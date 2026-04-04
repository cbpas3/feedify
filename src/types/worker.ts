import type { FeedItem } from './index'

// ─── Inbound (main thread → worker) ──────────────────────────────────────────

export type WorkerInboundMessage =
  | { type: 'LOAD_MODEL' }
  | { type: 'RUN_INFERENCE'; payload: { rawText: string; sourceId: string } }

// ─── Outbound (worker → main thread) ─────────────────────────────────────────

export type WorkerOutboundMessage =
  | { type: 'MODEL_LOADING'; progress: number }   // 0–100
  | { type: 'MODEL_READY' }
  | { type: 'INFERENCE_STREAMING'; token: string }
  | { type: 'INFERENCE_COMPLETE'; items: FeedItem[] }
  | { type: 'INFERENCE_ERROR'; message: string }

// ─── Cache Metadata ───────────────────────────────────────────────────────────

export interface ModelCacheEntry {
  version: string
  cachedAt: number  // Unix timestamp ms
  byteSize: number
}
