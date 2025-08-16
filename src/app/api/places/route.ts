import { NextResponse } from 'next/server'
import { searchPlaces, getPlaceDetails } from '@/lib/google/places'
import { rateLimit, getClientIP } from '@/lib/rate-limit'
import { logApiError } from '@/lib/logger'
import { validateSearchParams, apiSchemas, createValidationErrorResponse } from '@/lib/validation'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  
  // Validate input parameters
  const hasQuery = searchParams.has('query')
  const hasPlaceId = searchParams.has('placeId')
  
  if (!hasQuery && !hasPlaceId) {
    return createValidationErrorResponse(
      request,
      'Either query or placeId parameter is required',
      []
    )
  }
  
  // Validate specific parameter based on what's provided
  let validationResult
  if (hasPlaceId) {
    validationResult = validateSearchParams(apiSchemas.placesDetails, searchParams)
  } else {
    validationResult = validateSearchParams(apiSchemas.placesSearch, searchParams)
  }
  
  if (!validationResult.success) {
    return createValidationErrorResponse(request, validationResult.error, validationResult.issues)
  }
  
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

  if (!process.env.GOOGLE_MAPS_API_SERVER_KEY) {
    logApiError('Google Maps API key not configured', request)
    return NextResponse.json(
      { error: 'Google Maps API server key is not configured' },
      { status: 500 }
    )
  }

  try {
    if (hasPlaceId) {
      const { placeId } = validationResult.data as { placeId: string }
      const placeDetails = await getPlaceDetails(placeId)
      return NextResponse.json(placeDetails)
    } else {
      const { query } = validationResult.data as { query: string }
      const places = await searchPlaces(query)
      return NextResponse.json(places)
    }
  } catch (error: any) {
    logApiError('Places API request failed', request, error, {
      validatedData: validationResult.data,
      apiKeyExists: !!process.env.GOOGLE_MAPS_API_SERVER_KEY,
      details: error.response?.data || error.response
    })
    return NextResponse.json(
      { error: error.message || 'Failed to fetch place data' },
      { status: 500 }
    )
  }
} 