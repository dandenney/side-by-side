import { NextResponse } from 'next/server'
import { searchPlaces, getPlaceDetails } from '@/lib/google/places'
import { rateLimit, getClientIP } from '@/lib/rate-limit'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('query')
  const placeId = searchParams.get('placeId')

  // Get client IP and check rate limit
  const ip = getClientIP(request)
  const rateLimitResult = await rateLimit(ip, {
    limit: 50, // requests per minute
    window: 60000, // 1 minute
    keyPrefix: 'places_api',
  })

  if (!rateLimitResult.success) {
    return NextResponse.json(
      { 
        error: 'Rate limit exceeded. Please try again later.',
        remaining: rateLimitResult.remaining,
        reset: new Date(rateLimitResult.reset).toISOString()
      },
      { 
        status: 429,
        headers: {
          'X-RateLimit-Limit': rateLimitResult.limit.toString(),
          'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
          'X-RateLimit-Reset': rateLimitResult.reset.toString(),
        }
      }
    )
  }

  if (!query && !placeId) {
    return NextResponse.json({ error: 'Missing query or placeId parameter' }, { status: 400 })
  }

  // Debug: Check if API key is available
  if (!process.env.GOOGLE_MAPS_API_SERVER_KEY) {
    console.error('GOOGLE_MAPS_API_SERVER_KEY is not set')
    return NextResponse.json(
      { error: 'Google Maps API server key is not configured' },
      { status: 500 }
    )
  }

  try {
    if (placeId) {
      const place = await getPlaceDetails(placeId)
      return NextResponse.json(place)
    } else {
      const places = await searchPlaces(query!)
      return NextResponse.json(places)
    }
  } catch (error: any) {
    console.error('Detailed error in places API:', {
      message: error.message,
      stack: error.stack,
      details: error.response?.data || error.response || error,
      apiKeyExists: !!process.env.GOOGLE_MAPS_API_SERVER_KEY
    })
    return NextResponse.json(
      { error: error.message || 'Failed to fetch place data' },
      { status: 500 }
    )
  }
} 