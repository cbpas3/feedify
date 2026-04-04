import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { ProcessSourceRequestSchema } from '@/lib/schemas'
import type { ApiResponse, CreateSourceResponse } from '@/types/api'
import { SourceType } from '@/types/index'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = ProcessSourceRequestSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json<ApiResponse<never>>(
        { data: null, error: parsed.error.message },
        { status: 400 }
      )
    }

    const { title, sourceType, rawContent, sourceUrl } = parsed.data

    const source = await prisma.contentSource.create({
      data: {
        title,
        sourceType: sourceType as SourceType,
        rawContent: rawContent ?? '',
        sourceUrl: sourceUrl ?? null,
        status: 'PENDING',
      },
    })

    return NextResponse.json<ApiResponse<CreateSourceResponse>>(
      { data: { id: source.id }, error: null },
      { status: 201 }
    )
  } catch (error) {
    console.error('[POST /api/sources]', error)
    return NextResponse.json<ApiResponse<never>>(
      { data: null, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
