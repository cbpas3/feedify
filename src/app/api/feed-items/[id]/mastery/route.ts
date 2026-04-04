import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { UpdateMasteryRequestSchema } from '@/lib/schemas'
import type { ApiResponse } from '@/types/api'

const SRS_INTERVALS_DAYS = [1, 3, 7, 14, 30, 90] as const

function calculateNextReview(masteryLevel: number): Date {
  const clampedLevel = Math.max(0, Math.min(5, masteryLevel))
  const intervalDays = SRS_INTERVALS_DAYS[clampedLevel]
  const next = new Date()
  next.setDate(next.getDate() + intervalDays)
  return next
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: itemId } = await params
    const body = await request.json()
    const parsed = UpdateMasteryRequestSchema.safeParse({
      feedItemId: itemId,
      ...body,
    })

    if (!parsed.success) {
      return NextResponse.json<ApiResponse<never>>(
        { data: null, error: parsed.error.message },
        { status: 400 }
      )
    }

    const item = await prisma.feedItem.findUnique({
      where: { id: itemId },
      select: { masteryLevel: true },
    })

    if (!item) {
      return NextResponse.json<ApiResponse<never>>(
        { data: null, error: 'Feed item not found' },
        { status: 404 }
      )
    }

    const newMastery = Math.max(0, Math.min(5, item.masteryLevel + parsed.data.masteryDelta))
    const nextReviewDate = calculateNextReview(newMastery)

    const updated = await prisma.feedItem.update({
      where: { id: itemId },
      data: {
        masteryLevel: newMastery,
        nextReviewDate,
        lastReviewedAt: new Date(),
      },
    })

    return NextResponse.json<ApiResponse<{ masteryLevel: number; nextReviewDate: Date }>>(
      {
        data: { masteryLevel: updated.masteryLevel, nextReviewDate: updated.nextReviewDate! },
        error: null,
      }
    )
  } catch (error) {
    console.error('[PATCH /api/feed-items/[id]/mastery]', error)
    return NextResponse.json<ApiResponse<never>>(
      { data: null, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
