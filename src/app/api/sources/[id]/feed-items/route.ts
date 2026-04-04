import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { FeedItemSchema } from '@/lib/schemas'
import type { ApiResponse } from '@/types/api'
import { z } from 'zod'

const BulkCreateSchema = z.object({
  items: z.array(FeedItemSchema).min(1).max(50),
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sourceId } = await params
    const body = await request.json()
    const parsed = BulkCreateSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json<ApiResponse<never>>(
        { data: null, error: parsed.error.message },
        { status: 400 }
      )
    }

    // Verify source exists
    const source = await prisma.contentSource.findUnique({
      where: { id: sourceId },
    })

    if (!source) {
      return NextResponse.json<ApiResponse<never>>(
        { data: null, error: 'Content source not found' },
        { status: 404 }
      )
    }

    // Bulk insert feed items
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

    // Mark source as done
    await prisma.contentSource.update({
      where: { id: sourceId },
      data: { status: 'DONE' },
    })

    return NextResponse.json<ApiResponse<{ count: number }>>(
      { data: { count: parsed.data.items.length }, error: null },
      { status: 201 }
    )
  } catch (error) {
    console.error('[POST /api/sources/[id]/feed-items]', error)
    return NextResponse.json<ApiResponse<never>>(
      { data: null, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
