import { describe, it, expect } from 'vitest'
import { repairAndValidate } from '@/workers/json-repair'

const validItem = {
  hook: 'TypeScript is great',
  body: 'It catches bugs at compile time before they reach production.',
  visual_type: 'TIP',
  visual_code: null,
  order_index: 0,
}

describe('repairAndValidate', () => {
  it('parses clean JSON array', () => {
    const input = JSON.stringify([validItem])
    const result = repairAndValidate(input)
    expect(result).toHaveLength(1)
    expect(result[0].hook).toBe(validItem.hook)
  })

  it('strips leading markdown code fence (```json)', () => {
    const input = `\`\`\`json\n${JSON.stringify([validItem])}\n\`\`\``
    const result = repairAndValidate(input)
    expect(result).toHaveLength(1)
  })

  it('strips plain code fence (```)', () => {
    const input = `\`\`\`\n${JSON.stringify([validItem])}\n\`\`\``
    const result = repairAndValidate(input)
    expect(result).toHaveLength(1)
  })

  it('repairs trailing comma in JSON', () => {
    const broken = `[{"hook":"h","body":"b","visual_type":"TIP","visual_code":null,"order_index":0,}]`
    // jsonrepair handles trailing commas
    const result = repairAndValidate(broken)
    expect(result).toHaveLength(1)
  })

  it('recovers valid items from a partially invalid array', () => {
    const mixed = JSON.stringify([
      validItem,
      { hook: 'x'.repeat(200), body: 'invalid — hook too long', visual_type: 'TIP', visual_code: null, order_index: 1 },
      { ...validItem, hook: 'Second valid item', order_index: 2 },
    ])
    const result = repairAndValidate(mixed)
    // Should recover 2 valid items, skip the one with hook > 120
    expect(result.length).toBe(2)
    expect(result.some((r) => r.hook === 'Second valid item')).toBe(true)
  })

  it('throws on completely empty input', () => {
    expect(() => repairAndValidate('')).toThrow()
  })

  it('throws when no JSON array brackets can be found', () => {
    expect(() => repairAndValidate('This is just plain text with no JSON')).toThrow()
  })

  it('throws when zero items pass validation', () => {
    // All items have hook > 120 chars
    const allInvalid = JSON.stringify([
      { hook: 'x'.repeat(200), body: 'b', visual_type: 'TIP', visual_code: null, order_index: 0 },
    ])
    expect(() => repairAndValidate(allInvalid)).toThrow()
  })

  it('handles array with extra text before it', () => {
    const input = `Here is the output you requested:\n${JSON.stringify([validItem])}`
    const result = repairAndValidate(input)
    expect(result).toHaveLength(1)
  })
})
