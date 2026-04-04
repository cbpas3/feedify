import { describe, it, expect } from 'vitest'
import {
  estimateCardCount,
  buildPrompt,
  truncateToTokenBudget,
  estimateTokens,
} from '@/workers/prompt-builder'

describe('estimateTokens', () => {
  it('estimates tokens as length / 4', () => {
    expect(estimateTokens('hello')).toBe(2) // ceil(5/4) = 2
    expect(estimateTokens('x'.repeat(400))).toBe(100)
  })
})

describe('estimateCardCount', () => {
  it('returns 1 for very short text', () => {
    expect(estimateCardCount('short text')).toBe(1)
  })

  it('calculates count based on word count / 150', () => {
    const words = Array.from({ length: 300 }, (_, i) => `word${i}`).join(' ')
    expect(estimateCardCount(words)).toBe(2)
  })

  it('caps at 20 cards', () => {
    const words = Array.from({ length: 10_000 }, (_, i) => `word${i}`).join(' ')
    expect(estimateCardCount(words)).toBe(20)
  })

  it('returns at least 1', () => {
    expect(estimateCardCount('')).toBe(1)
  })
})

describe('truncateToTokenBudget', () => {
  it('returns text unchanged when it fits in the budget', () => {
    const short = 'This is a short text.'
    expect(truncateToTokenBudget(short)).toBe(short)
  })

  it('truncates very long text and appends a note', () => {
    // 128K context - 5500 output - 500 template = 122000 tokens ≈ 488000 chars
    const longText = 'word '.repeat(200_000) // ~1,000,000 chars — well over budget
    const result = truncateToTokenBudget(longText)
    expect(result.length).toBeLessThan(longText.length)
    expect(result).toContain('[... content truncated')
  })

  it('respects a custom context window size', () => {
    const text = 'word '.repeat(1_000) // ~5000 chars
    // Very small context: 1000 tokens - 5500 output leaves negative, should still not crash
    const result = truncateToTokenBudget(text, 10_000)
    expect(typeof result).toBe('string')
  })
})

describe('buildPrompt', () => {
  it('includes the raw text in the prompt', () => {
    const text = 'This is my article content.'
    const prompt = buildPrompt(text, 3)
    expect(prompt).toContain(text)
  })

  it('includes the card count in the prompt', () => {
    const prompt = buildPrompt('Some text', 5)
    expect(prompt).toContain('5')
  })

  it('caps the card count at 20', () => {
    const prompt = buildPrompt('Some text', 100)
    expect(prompt).toContain('20')
    expect(prompt).not.toContain('100')
  })

  it('mentions JSON output format', () => {
    const prompt = buildPrompt('content', 3)
    expect(prompt.toLowerCase()).toContain('json')
  })
})
