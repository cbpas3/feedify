import type { SourceType } from './index'

// ─── Generic Response Wrapper ─────────────────────────────────────────────────

export type ApiResponse<T> =
  | { data: T; error: null }
  | { data: null; error: string }

// ─── Request Bodies ───────────────────────────────────────────────────────────

export interface ProcessSourceRequest {
  title: string
  sourceType: SourceType
  rawContent?: string
  sourceUrl?: string
}

export interface UpdateMasteryRequest {
  feedItemId: string
  masteryDelta: 1 | -1
}

// ─── Response Bodies ──────────────────────────────────────────────────────────

export interface CreateSourceResponse {
  id: string
}
