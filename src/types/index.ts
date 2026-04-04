// ─── Enums ───────────────────────────────────────────────────────────────────

export enum VisualType {
  QUOTE = 'QUOTE',
  CODE = 'CODE',
  DIAGRAM = 'DIAGRAM',
  STAT = 'STAT',
  TIP = 'TIP',
}

export enum SourceType {
  TEXT = 'TEXT',
  URL = 'URL',
}

export enum SourceStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  DONE = 'DONE',
  ERROR = 'ERROR',
}

// ─── Domain Interfaces ────────────────────────────────────────────────────────

export interface ContentSource {
  id: string
  userId: string | null
  title: string
  sourceType: SourceType
  rawContent: string
  sourceUrl: string | null
  status: SourceStatus
  createdAt: Date
  updatedAt: Date
}

export interface FeedItem {
  id: string
  contentSourceId: string
  hook: string          // max 120 chars
  body: string          // max 280 chars
  visualType: VisualType
  visualCode: string | null
  orderIndex: number
  masteryLevel: number  // 0–5
  nextReviewDate: Date | null
  lastReviewedAt: Date | null
  createdAt: Date
  updatedAt: Date
}

// ─── Input Types ──────────────────────────────────────────────────────────────

export type CreateContentSourceInput = {
  title: string
  sourceType: SourceType
  rawContent: string
  sourceUrl?: string | null
  userId?: string | null
}

export type CreateFeedItemInput = {
  contentSourceId: string
  hook: string
  body: string
  visualType: VisualType
  visualCode?: string | null
  orderIndex: number
}
