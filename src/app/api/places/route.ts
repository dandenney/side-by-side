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
      apiKeyExists: !!process.env.GOOGLE_MAPS_API_SERVER_KEY,
      apiKeyLength: process.env.GOOGLE_MAPS_API_SERVER_KEY?.length
    })
    return NextResponse.json(
      { error: error.message || 'Failed to fetch place data' },
      { status: 500 }
    )
  }
} 