/// <reference lib="webworker" />

import { jsonrepair } from 'jsonrepair'
import { FeedItemArraySchema, FeedItemSchema } from '@/lib/schemas'
import type { ValidatedFeedItem } from '@/lib/schemas'

/**
 * Strip markdown code fences if the model accidentally wraps the output.
 * Handles ```json ... ``` and ``` ... ``` variants.
 */
function stripMarkdownFences(raw: string): string {
  return raw
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```\s*$/, '')
    .trim()
}

/**
 * Extract the outermost JSON array from a string that may contain
 * extra text before or after the array.
 */
function extractJsonArray(text: string): string {
  const start = text.indexOf('[')
  const end = text.lastIndexOf(']')
  if (start === -1 || end === -1 || end < start) {
    throw new Error('No JSON array found in model output')
  }
  return text.slice(start, end + 1)
}

/**
 * Attempt to filter valid FeedItem objects from a partially invalid array.
 * Returns only items that individually pass the FeedItemSchema.
 */
function filterValidItems(arr: unknown[]): ValidatedFeedItem[] {
  const valid: ValidatedFeedItem[] = []
  for (const item of arr) {
    const result = FeedItemSchema.safeParse(item)
    if (result.success) valid.push(result.data)
  }
  return valid
}

/**
 * Full repair and validation pipeline.
 * Stages:
 *   1. Strip markdown fences
 *   2. Extract outermost [...] array
 *   3. JSON.parse (fast path)
 *   4. jsonrepair fallback (handles trailing commas, unquoted keys, etc.)
 *   5. Zod array validation (strict)
 *   6. Per-item filter (graceful partial success)
 *
 * Throws only if zero valid items can be recovered.
 */
export function repairAndValidate(rawOutput: string): ValidatedFeedItem[] {
  if (!rawOutput || rawOutput.trim().length === 0) {
    throw new Error('Model returned empty output')
  }

  // Stage 1: strip fences
  let cleaned = stripMarkdownFences(rawOutput)

  // Stage 2: extract array brackets
  cleaned = extractJsonArray(cleaned)

  // Stage 3: try direct parse
  let parsed: unknown
  try {
    parsed = JSON.parse(cleaned)
  } catch {
    // Stage 4: jsonrepair
    try {
      parsed = JSON.parse(jsonrepair(cleaned))
    } catch (repairErr) {
      throw new Error(`JSON repair failed: ${repairErr instanceof Error ? repairErr.message : String(repairErr)}`)
    }
  }

  if (!Array.isArray(parsed)) {
    throw new Error('Model output parsed but is not an array')
  }

  // Stage 5: strict Zod validation
  const strictResult = FeedItemArraySchema.safeParse(parsed)
  if (strictResult.success) {
    return strictResult.data
  }

  // Stage 6: per-item filter (partial recovery)
  console.warn('[json-repair] Strict validation failed, attempting partial recovery:', strictResult.error.message)
  const partial = filterValidItems(parsed)

  if (partial.length === 0) {
    throw new Error(`Model output validation failed and no valid items could be recovered. Zod error: ${strictResult.error.message}`)
  }

  console.warn(`[json-repair] Recovered ${partial.length}/${parsed.length} valid items`)
  return partial
}
