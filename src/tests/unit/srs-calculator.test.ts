import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  calculateNextReview,
  applyMasteryDelta,
  isDueForReview,
  SRS_INTERVALS_DAYS,
} from '@/workers/srs-calculator'

describe('SRS_INTERVALS_DAYS', () => {
  it('has 6 entries for mastery levels 0–5', () => {
    expect(SRS_INTERVALS_DAYS).toHaveLength(6)
  })

  it('intervals are strictly increasing', () => {
    for (let i = 1; i < SRS_INTERVALS_DAYS.length; i++) {
      expect(SRS_INTERVALS_DAYS[i]).toBeGreaterThan(SRS_INTERVALS_DAYS[i - 1])
    }
  })
})

describe('calculateNextReview', () => {
  const BASE_DATE = new Date('2025-01-01T00:00:00.000Z')

  it('mastery 0 → review in 1 day', () => {
    const next = calculateNextReview(0, BASE_DATE)
    const expected = new Date(BASE_DATE)
    expected.setDate(expected.getDate() + 1)
    expect(next.toDateString()).toBe(expected.toDateString())
  })

  it('mastery 5 → review in 90 days', () => {
    const next = calculateNextReview(5, BASE_DATE)
    const expected = new Date(BASE_DATE)
    expected.setDate(expected.getDate() + 90)
    expect(next.toDateString()).toBe(expected.toDateString())
  })

  it('mastery 3 → review in 14 days', () => {
    const next = calculateNextReview(3, BASE_DATE)
    const expected = new Date(BASE_DATE)
    expected.setDate(expected.getDate() + 14)
    expect(next.toDateString()).toBe(expected.toDateString())
  })

  it('clamps mastery below 0 to 0', () => {
    const next = calculateNextReview(-1, BASE_DATE)
    const nextZero = calculateNextReview(0, BASE_DATE)
    expect(next.toDateString()).toBe(nextZero.toDateString())
  })

  it('clamps mastery above 5 to 5', () => {
    const next = calculateNextReview(10, BASE_DATE)
    const nextFive = calculateNextReview(5, BASE_DATE)
    expect(next.toDateString()).toBe(nextFive.toDateString())
  })

  it('defaults from date to now', () => {
    const before = new Date()
    const next = calculateNextReview(0)
    const after = new Date()
    // next should be ~1 day after now
    expect(next.getTime()).toBeGreaterThan(before.getTime())
    expect(next.getTime()).toBeLessThan(after.getTime() + 2 * 24 * 60 * 60 * 1000)
  })
})

describe('applyMasteryDelta', () => {
  it('+1 increments mastery', () => {
    expect(applyMasteryDelta(2, 1)).toBe(3)
  })

  it('-1 decrements mastery', () => {
    expect(applyMasteryDelta(3, -1)).toBe(2)
  })

  it('clamps at 0 minimum', () => {
    expect(applyMasteryDelta(0, -1)).toBe(0)
  })

  it('clamps at 5 maximum', () => {
    expect(applyMasteryDelta(5, 1)).toBe(5)
  })
})

describe('isDueForReview', () => {
  it('returns false for null nextReviewDate', () => {
    expect(isDueForReview(null)).toBe(false)
  })

  it('returns true for a past date', () => {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    expect(isDueForReview(yesterday)).toBe(true)
  })

  it('returns false for a future date', () => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    expect(isDueForReview(tomorrow)).toBe(false)
  })
})
