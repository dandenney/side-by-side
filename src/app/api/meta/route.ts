import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const url = searchParams.get('url')

  if (!url) {
    return NextResponse.json({ error: 'URL is required' }, { status: 400 })
  }

  try {
    const response = await fetch(url)
    const html = await response.text()

    // Extract title
    const titleMatch = html.match(/<title>(.*?)<\/title>/i)
    const ogTitleMatch = html.match(/<meta[^>]*property="og:title"[^>]*content="([^"]*)"[^>]*>/i)
    const title = ogTitleMatch?.[1] || titleMatch?.[1] || 'Untitled'

    // Extract description
    const ogDescMatch = html.match(/<meta[^>]*property="og:description"[^>]*content="([^"]*)"[^>]*>/i)
    const metaDescMatch = html.match(/<meta[^>]*name="description"[^>]*content="([^"]*)"[^>]*>/i)
    const description = ogDescMatch?.[1] || metaDescMatch?.[1] || ''

    // Extract image
    const ogImageMatch = html.match(/<meta[^>]*property="og:image"[^>]*content="([^"]*)"[^>]*>/i)
    const twitterImageMatch = html.match(/<meta[^>]*name="twitter:image"[^>]*content="([^"]*)"[^>]*>/i)
    const image = ogImageMatch?.[1] || twitterImageMatch?.[1] || ''

    return NextResponse.json({
      title,
      description,
      image,
    })
  } catch (error) {
    console.error('Error fetching meta data:', error)
    return NextResponse.json({ error: 'Failed to fetch meta data' }, { status: 500 })
  }
} 