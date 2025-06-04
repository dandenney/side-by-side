import { NextResponse } from 'next/server'

// List of blocked domains/patterns
const BLOCKED_PATTERNS = [
  'localhost',
  '127.0.0.1',
  '192.168.',
  '10.',
  '172.16.',
  '172.17.',
  '172.18.',
  '172.19.',
  '172.20.',
  '172.21.',
  '172.22.',
  '172.23.',
  '172.24.',
  '172.25.',
  '172.26.',
  '172.27.',
  '172.28.',
  '172.29.',
  '172.30.',
  '172.31.',
  'file://',
  'data:',
  'blob:'
]

// Maximum file size (5MB)
const MAX_FILE_SIZE = 5 * 1024 * 1024

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const imageUrl = searchParams.get('url')

  if (!imageUrl) {
    return NextResponse.json({ error: 'Image URL is required' }, { status: 400 })
  }

  try {
    // Validate URL
    const url = new URL(imageUrl)
    
    // Check for blocked patterns
    if (BLOCKED_PATTERNS.some(pattern => 
      url.hostname.includes(pattern) || 
      imageUrl.startsWith(pattern)
    )) {
      return NextResponse.json(
        { error: 'Invalid image URL' },
        { status: 400 }
      )
    }

    // Ensure URL uses HTTPS
    if (url.protocol !== 'https:') {
      return NextResponse.json(
        { error: 'Only HTTPS URLs are allowed' },
        { status: 400 }
      )
    }

    // Fetch with timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

    const response = await fetch(imageUrl, {
      signal: controller.signal,
      headers: {
        'Accept': 'image/*',
        'User-Agent': 'SideBySide/1.0'
      }
    })
    
    clearTimeout(timeoutId)

    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`)
    }

    // Check content type
    const contentType = response.headers.get('content-type')
    if (!contentType?.startsWith('image/')) {
      return NextResponse.json(
        { error: 'Invalid content type' },
        { status: 400 }
      )
    }

    // Check file size
    const contentLength = response.headers.get('content-length')
    if (contentLength && parseInt(contentLength) > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File too large' },
        { status: 400 }
      )
    }

    const blob = await response.blob()

    // Double check blob size
    if (blob.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File too large' },
        { status: 400 }
      )
    }

    const headers = new Headers()
    headers.set('Content-Type', blob.type)
    headers.set('Cache-Control', 'public, max-age=3600')

    return new NextResponse(blob, {
      status: 200,
      headers
    })
  } catch (error: unknown) {
    console.error('Error fetching image:', error)
    
    // Handle specific error types
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      return NextResponse.json(
        { error: 'Failed to fetch image - network error' },
        { status: 503 }
      )
    }
    if (error instanceof Error && error.name === 'AbortError') {
      return NextResponse.json(
        { error: 'Request timed out' },
        { status: 504 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to fetch image' },
      { status: 500 }
    )
  }
} 