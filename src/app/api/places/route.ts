import { NextResponse } from 'next/server'
import { searchPlaces, getPlaceDetails } from '@/lib/google/places'

// Simple rate limiting
const RATE_LIMIT = 50 // requests per minute
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const limit = rateLimitMap.get(ip)

  if (!limit || now > limit.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + 60000 }) // 1 minute
    return true
  }

  if (limit.count >= RATE_LIMIT) {
    return false
  }

  limit.count++
  return true
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('query')
  const placeId = searchParams.get('placeId')

  console.log('API Route - Request params:', { query, placeId })
  console.log('API Key present:', !!process.env.GOOGLE_MAPS_API_KEY)

  // Get client IP (this is a simplified version - in production, use proper IP detection)
  const ip = request.headers.get('x-forwarded-for') || 'unknown'

  // Check rate limit
  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: 'Rate limit exceeded. Please try again later.' },
      { status: 429 }
    )
  }

  if (!query && !placeId) {
    return NextResponse.json({ error: 'Missing query or placeId parameter' }, { status: 400 })
  }

  try {
    if (placeId) {
      console.log('Fetching details for place:', placeId)
      const place = await getPlaceDetails(placeId)
      console.log('Place details received:', place)
      return NextResponse.json(place)
    } else {
      console.log('Searching places for query:', query)
      const places = await searchPlaces(query!)
      console.log('Search results:', places)
      return NextResponse.json(places)
    }
  } catch (error: any) {
    console.error('Detailed error in places API:', {
      message: error.message,
      stack: error.stack,
      details: error.response?.data || error.response || error
    })
    return NextResponse.json(
      { error: error.message || 'Failed to fetch place data' },
      { status: 500 }
    )
  }
} 