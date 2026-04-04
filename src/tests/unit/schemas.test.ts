import { describe, it, expect } from 'vitest'
import { FeedItemSchema, FeedItemArraySchema, ProcessSourceRequestSchema } from '@/lib/schemas'

describe('FeedItemSchema', () => {
  const validItem = {
    hook: 'TypeScript catches bugs before production',
    body: 'Static type checking eliminates entire classes of runtime errors.',
    visual_type: 'TIP',
    visual_code: null,
    order_index: 0,
  }

  it('accepts a valid feed item', () => {
    expect(FeedItemSchema.parse(validItem)).toMatchObject(validItem)
  })

  it('rejects hook longer than 120 characters', () => {
    expect(() =>
      FeedItemSchema.parse({ ...validItem, hook: 'x'.repeat(121) })
    ).toThrow()
  })

  it('rejects body longer than 280 characters', () => {
    expect(() =>
      FeedItemSchema.parse({ ...validItem, body: 'x'.repeat(281) })
    ).toThrow()
  })

  it('rejects invalid visual_type', () => {
    expect(() =>
      FeedItemSchema.parse({ ...validItem, visual_type: 'INVALID' })
    ).toThrow()
  })

  it('accepts all valid VisualType values', () => {
    const types = ['QUOTE', 'CODE', 'DIAGRAM', 'STAT', 'TIP'] as const
    for (const visual_type of types) {
      expect(() => FeedItemSchema.parse({ ...validItem, visual_type })).not.toThrow()
    }
  })

  it('rejects empty hook', () => {
    expect(() => FeedItemSchema.parse({ ...validItem, hook: '' })).toThrow()
  })

  it('accepts visual_code as null for non-CODE types', () => {
    const result = FeedItemSchema.parse({ ...validItem, visual_type: 'TIP', visual_code: null })
    expect(result.visual_code).toBeNull()
  })
})

describe('FeedItemArraySchema', () => {
  const validItem = {
    hook: 'Hook',
    body: 'Body text',
    visual_type: 'TIP',
    visual_code: null,
    order_index: 0,
  }

  it('accepts an array of valid items', () => {
    expect(() => FeedItemArraySchema.parse([validItem])).not.toThrow()
  })

  it('rejects an empty array', () => {
    expect(() => FeedItemArraySchema.parse([])).toThrow()
  })

  it('rejects non-array input', () => {
    expect(() => FeedItemArraySchema.parse(validItem)).toThrow()
    expect(() => FeedItemArraySchema.parse(null)).toThrow()
    expect(() => FeedItemArraySchema.parse('[]')).toThrow()
  })
})

describe('ProcessSourceRequestSchema', () => {
  it('accepts TEXT source with rawContent', () => {
    expect(() =>
      ProcessSourceRequestSchema.parse({
        title: 'My Article',
        sourceType: 'TEXT',
        rawContent: 'Some content',
      })
    ).not.toThrow()
  })

  it('accepts URL source with sourceUrl', () => {
    expect(() =>
      ProcessSourceRequestSchema.parse({
        title: 'My URL',
        sourceType: 'URL',
        sourceUrl: 'https://example.com',
      })
    ).not.toThrow()
  })

  it('rejects when neither rawContent nor sourceUrl is provided', () => {
    expect(() =>
      ProcessSourceRequestSchema.parse({
        title: 'No content',
        sourceType: 'TEXT',
      })
    ).toThrow()
  })

  it('rejects invalid sourceUrl format', () => {
    expect(() =>
      ProcessSourceRequestSchema.parse({
        title: 'Bad URL',
        sourceType: 'URL',
        sourceUrl: 'not-a-url',
      })
    ).toThrow()
  })
})
