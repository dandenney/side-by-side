import { NextRequest, NextResponse } from 'next/server'
import { parseRecipeHtml } from '@/lib/recipe-parse'

// Fetch a recipe page server-side (avoids browser CORS) and return the parsed
// JSON-LD fields for the add form to prefill.
export async function GET(request: NextRequest) {
  const raw = request.nextUrl.searchParams.get('url')
  if (!raw) {
    return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 })
  }

  let target = raw
  if (!/^https?:\/\//.test(target)) target = `https://${target}`
  try {
    new URL(target)
  } catch {
    return NextResponse.json({ error: 'Invalid URL' }, { status: 400 })
  }

  try {
    const res = await fetch(target, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    })
    if (!res.ok) {
      return NextResponse.json(
        { error: `Failed to fetch URL (${res.status})` },
        { status: 502 }
      )
    }

    const html = await res.text()
    const parsed = parseRecipeHtml(html)
    if (!parsed) {
      return NextResponse.json(
        { error: 'No recipe data found at that URL' },
        { status: 422 }
      )
    }

    return NextResponse.json({ ...parsed, sourceUrl: target })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch URL' }, { status: 500 })
  }
}
