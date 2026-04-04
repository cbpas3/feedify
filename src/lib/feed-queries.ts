import { prisma } from '@/lib/db'
import type { ContentSource, FeedItem } from '@/types/index'

export async function getAllSources(): Promise<ContentSource[]> {
  const sources = await prisma.contentSource.findMany({
    orderBy: { createdAt: 'desc' },
  })
  return sources.map(toContentSource)
}

export async function getFeedItems(sourceId: string): Promise<FeedItem[]> {
  const items = await prisma.feedItem.findMany({
    where: { contentSourceId: sourceId },
    orderBy: { orderIndex: 'asc' },
  })
  return items.map(toFeedItem)
}

export async function getItemsDueForReview(): Promise<FeedItem[]> {
  const now = new Date()
  const items = await prisma.feedItem.findMany({
    where: {
      nextReviewDate: { lte: now },
    },
    orderBy: { nextReviewDate: 'asc' },
    take: 50,
  })
  return items.map(toFeedItem)
}

export async function getAllFeedItems(): Promise<FeedItem[]> {
  const items = await prisma.feedItem.findMany({
    orderBy: [{ contentSourceId: 'asc' }, { orderIndex: 'asc' }],
  })
  return items.map(toFeedItem)
}

// Map Prisma model to domain type
function toFeedItem(p: {
  id: string
  contentSourceId: string
  hook: string
  body: string
  visualType: string
  visualCode: string | null
  orderIndex: number
  masteryLevel: number
  nextReviewDate: Date | null
  lastReviewedAt: Date | null
  createdAt: Date
  updatedAt: Date
}): FeedItem {
  return {
    id: p.id,
    contentSourceId: p.contentSourceId,
    hook: p.hook,
    body: p.body,
    visualType: p.visualType as import('@/types/index').VisualType,
    visualCode: p.visualCode,
    orderIndex: p.orderIndex,
    masteryLevel: p.masteryLevel,
    nextReviewDate: p.nextReviewDate,
    lastReviewedAt: p.lastReviewedAt,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  }
}

function toContentSource(p: {
  id: string
  userId: string | null
  title: string
  sourceType: string
  rawContent: string
  sourceUrl: string | null
  status: string
  createdAt: Date
  updatedAt: Date
}): ContentSource {
  return {
    id: p.id,
    userId: p.userId,
    title: p.title,
    sourceType: p.sourceType as import('@/types/index').SourceType,
    rawContent: p.rawContent,
    sourceUrl: p.sourceUrl,
    status: p.status as import('@/types/index').SourceStatus,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  }
}
