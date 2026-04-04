import { NextRequest, NextResponse } from 'next/server'
import type { ApiResponse } from '@/types/api'

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url')

  if (!url) {
    return NextResponse.json<ApiResponse<never>>(
      { data: null, error: 'url parameter is required' },
      { status: 400 }
    )
  }

  try {
    new URL(url) // validate URL format
  } catch {
    return NextResponse.json<ApiResponse<never>>(
      { data: null, error: 'Invalid URL format' },
      { status: 400 }
    )
  }

  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Feedify/1.0 (content-preview)' },
      signal: AbortSignal.timeout(5000),
    })

    const html = await response.text()

    // Extract title from <title> tag or og:title meta
    const titleMatch =
      html.match(/<title[^>]*>([^<]+)<\/title>/i) ||
      html.match(/<meta[^>]+property="og:title"[^>]+content="([^"]+)"/i)

    const title = titleMatch ? titleMatch[1].trim() : url

    return NextResponse.json<ApiResponse<{ title: string; url: string }>>(
      { data: { title, url }, error: null }
    )
  } catch {
    // Return URL as fallback title — non-fatal
    return NextResponse.json<ApiResponse<{ title: string; url: string }>>(
      { data: { title: url, url }, error: null }
    )
  }
}
