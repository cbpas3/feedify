/// <reference lib="webworker" />

// SM-2 review intervals indexed by mastery level 0–5
export const SRS_INTERVALS_DAYS = [1, 3, 7, 14, 30, 90] as const

/**
 * Calculate the next review date based on current mastery level.
 * @param masteryLevel - 0 to 5
 * @param from - base date (defaults to now)
 */
export function calculateNextReview(masteryLevel: number, from: Date = new Date()): Date {
  const clamped = Math.max(0, Math.min(5, Math.round(masteryLevel)))
  const intervalDays = SRS_INTERVALS_DAYS[clamped]
  const next = new Date(from)
  next.setDate(next.getDate() + intervalDays)
  return next
}

/**
 * Calculate the new mastery level after a review interaction.
 * "Got it" (delta +1) increases mastery; "Review Later" (delta -1) decreases.
 */
export function applyMasteryDelta(current: number, delta: 1 | -1): number {
  return Math.max(0, Math.min(5, current + delta))
}

/**
 * Check whether a FeedItem is due for review.
 */
export function isDueForReview(nextReviewDate: Date | null): boolean {
  if (nextReviewDate === null) return false
  return nextReviewDate <= new Date()
}
