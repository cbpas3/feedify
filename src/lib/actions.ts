'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/db'
import { ProcessSourceRequestSchema, FeedItemSchema, UpdateMasteryRequestSchema } from '@/lib/schemas'
import type { CreateSourceResponse, ProcessSourceRequest, UpdateMasteryRequest } from '@/types/api'
import type { FeedItem } from '@/types/index'
import type { ValidatedFeedItem } from '@/lib/schemas'
import { SourceType } from '@/types/index'
import { z } from 'zod'

const BulkCreateSchema = z.object({
  items: z.array(FeedItemSchema).min(1).max(50),
})

const SRS_INTERVALS_DAYS = [1, 3, 7, 14, 30, 90] as const

function calculateNextReview(masteryLevel: number): Date {
  const clampedLevel = Math.max(0, Math.min(5, masteryLevel))
  const intervalDays = SRS_INTERVALS_DAYS[clampedLevel]
  const next = new Date()
  next.setDate(next.getDate() + intervalDays)
  return next
}

export async function createSource(
  data: ProcessSourceRequest
): Promise<{ id: string } | { error: string }> {
  const parsed = ProcessSourceRequestSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.message }

  const { title, sourceType, rawContent, sourceUrl } = parsed.data

  try {
    const source = await prisma.contentSource.create({
      data: {
        title,
        sourceType: sourceType as SourceType,
        rawContent: rawContent ?? '',
        sourceUrl: sourceUrl ?? null,
        status: 'PENDING',
      },
    })
    return { id: source.id }
  } catch (error) {
    console.error('[createSource]', error)
    return { error: 'Internal server error' }
  }
}

export async function saveFeedItems(
  sourceId: string,
  items: ValidatedFeedItem[]
): Promise<{ count: number } | { error: string }> {
  const parsed = BulkCreateSchema.safeParse({ items })
  if (!parsed.success) return { error: parsed.error.message }

  try {
    const source = await prisma.contentSource.findUnique({ where: { id: sourceId } })
    if (!source) return { error: 'Content source not found' }

    await prisma.feedItem.createMany({
      data: parsed.data.items.map((item) => ({
        contentSourceId: sourceId,
        hook: item.hook,
        body: item.body,
        visualType: item.visual_type,
        visualCode: item.visual_code ?? null,
        orderIndex: item.order_index,
        masteryLevel: 0,
      })),
    })

    await prisma.contentSource.update({
      where: { id: sourceId },
      data: { status: 'DONE' },
    })

    revalidatePath('/')
    return { count: parsed.data.items.length }
  } catch (error) {
    console.error('[saveFeedItems]', error)
    return { error: 'Internal server error' }
  }
}

export async function updateMastery(
  feedItemId: string,
  masteryDelta: 1 | -1
): Promise<{ masteryLevel: number; nextReviewDate: Date } | { error: string }> {
  const parsed = UpdateMasteryRequestSchema.safeParse({ feedItemId, masteryDelta })
  if (!parsed.success) return { error: parsed.error.message }

  try {
    const item = await prisma.feedItem.findUnique({
      where: { id: feedItemId },
      select: { masteryLevel: true },
    })
    if (!item) return { error: 'Feed item not found' }

    const newMastery = Math.max(0, Math.min(5, item.masteryLevel + masteryDelta))
    const nextReviewDate = calculateNextReview(newMastery)

    const updated = await prisma.feedItem.update({
      where: { id: feedItemId },
      data: {
        masteryLevel: newMastery,
        nextReviewDate,
        lastReviewedAt: new Date(),
      },
    })

    return { masteryLevel: updated.masteryLevel, nextReviewDate: updated.nextReviewDate! }
  } catch (error) {
    console.error('[updateMastery]', error)
    return { error: 'Internal server error' }
  }
}
