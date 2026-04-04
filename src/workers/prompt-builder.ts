/// <reference lib="webworker" />

// Rough BPE token estimate: 1 token ≈ 4 characters
const CHARS_PER_TOKEN = 4
// Reserve output budget: 20 cards × ~200 tokens each + JSON overhead
const OUTPUT_TOKEN_BUDGET = 5000
// Max cards to request (avoid excessively long outputs)
const MAX_CARDS = 20
// Words per card estimate for card count
const WORDS_PER_CARD = 150

export function estimateTokens(text: string): number {
  return Math.ceil(text.length / CHARS_PER_TOKEN)
}

export function estimateCardCount(text: string): number {
  const wordCount = text.trim().split(/\s+/).length
  return Math.min(Math.ceil(wordCount / WORDS_PER_CARD), MAX_CARDS)
}

/**
 * Truncate text to fit within the model's context window.
 * Reserves space for the prompt template and expected output.
 * @param text - raw input text
 * @param contextWindowTokens - model's max context (128K for Gemma 4)
 * @returns truncated text with a suffix note if truncated
 */
export function truncateToTokenBudget(
  text: string,
  contextWindowTokens = 128_000
): string {
  const availableTokens = contextWindowTokens - OUTPUT_TOKEN_BUDGET - 500 // 500 for prompt template
  const maxChars = availableTokens * CHARS_PER_TOKEN

  if (text.length <= maxChars) return text

  const truncated = text.slice(0, maxChars)
  // Trim to last complete sentence to avoid mid-word cuts
  const lastPeriod = truncated.lastIndexOf('.')
  const cleanTruncated = lastPeriod > maxChars * 0.8 ? truncated.slice(0, lastPeriod + 1) : truncated
  return cleanTruncated + '\n\n[... content truncated to fit context window]'
}

/**
 * Build the inference prompt for the Gemma 4 model.
 * Uses a zero-shot JSON-only instruction that explicitly forbids non-JSON output.
 */
export function buildPrompt(rawText: string, cardCount: number): string {
  const safeText = truncateToTokenBudget(rawText)
  const actualCount = Math.min(cardCount, MAX_CARDS)

  return `You are a microlearning content transformer. Extract exactly ${actualCount} key insights from the text below and format them as a JSON array.

CRITICAL RULES:
1. Your response must be ONLY a valid JSON array. Nothing else.
2. No markdown code fences, no explanations, no text before or after the array.
3. Start your response with [ and end with ]

Each object in the array must follow this exact schema:
{
  "hook": "<attention-grabbing headline, max 120 characters>",
  "body": "<core insight in plain language, max 280 characters>",
  "visual_type": "<one of: QUOTE, CODE, DIAGRAM, STAT, TIP>",
  "visual_code": "<only for CODE type: the actual code snippet as a string, otherwise null>",
  "order_index": <0-based integer>
}

Guidelines for visual_type selection:
- QUOTE: a memorable statement or key quote from the text
- CODE: when the insight involves a code snippet or command
- STAT: when the insight involves a number, percentage, or measurable fact
- TIP: actionable advice or best practice
- DIAGRAM: conceptual relationship or process (no actual diagram needed)

Text to transform:
---
${safeText}
---

JSON array:`
}
