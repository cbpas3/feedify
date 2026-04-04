'use server'

import type { CreateSourceResponse, ProcessSourceRequest, UpdateMasteryRequest } from '@/types/api'
import type { FeedItem } from '@/types/index'
import type { ValidatedFeedItem } from '@/lib/schemas'

export async function createSource(
  data: ProcessSourceRequest
): Promise<{ id: string } | { error: string }> {
  const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/api/sources`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  const json = await response.json()
  if (json.error) return { error: json.error }
  return json.data as CreateSourceResponse
}

export async function saveFeedItems(
  sourceId: string,
  items: ValidatedFeedItem[]
): Promise<{ count: number } | { error: string }> {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/api/sources/${sourceId}/feed-items`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items }),
    }
  )
  const json = await response.json()
  if (json.error) return { error: json.error }
  return json.data
}

export async function updateMastery(
  feedItemId: string,
  masteryDelta: 1 | -1
): Promise<{ masteryLevel: number; nextReviewDate: Date } | { error: string }> {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/api/feed-items/${feedItemId}/mastery`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ masteryDelta } satisfies Omit<UpdateMasteryRequest, 'feedItemId'>),
    }
  )
  const json = await response.json()
  if (json.error) return { error: json.error }
  return json.data
}
