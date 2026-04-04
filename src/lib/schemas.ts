import { z } from 'zod'
import { VisualType, SourceType } from '@/types/index'

// ─── FeedItem Schema (validates AI output shape) ──────────────────────────────

export const FeedItemSchema = z.object({
  hook: z.string().min(1).max(120),
  body: z.string().min(1).max(280),
  visual_type: z.nativeEnum(VisualType),
  visual_code: z.string().nullable().optional(),
  order_index: z.number().int().min(0),
})

export const FeedItemArraySchema = z.array(FeedItemSchema).min(1)

export type ValidatedFeedItem = z.infer<typeof FeedItemSchema>

// ─── API Request Schemas ──────────────────────────────────────────────────────

export const ProcessSourceRequestSchema = z.object({
  title: z.string().min(1).max(500),
  sourceType: z.nativeEnum(SourceType),
  rawContent: z.string().optional(),
  sourceUrl: z.string().url().optional(),
}).refine(
  (data) => data.rawContent !== undefined || data.sourceUrl !== undefined,
  { message: 'Either rawContent or sourceUrl must be provided' }
)

export const UpdateMasteryRequestSchema = z.object({
  feedItemId: z.string().min(1),
  masteryDelta: z.union([z.literal(1), z.literal(-1)]),
})
