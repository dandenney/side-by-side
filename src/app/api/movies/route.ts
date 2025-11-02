import { NextResponse } from 'next/server'
import { searchMovies, getMovieDetails } from '@/lib/movies'
import { rateLimit, getClientIP } from '@/lib/rate-limit'
import { logApiError } from '@/lib/logger'
import { validateSearchParams, apiSchemas, createValidationErrorResponse } from '@/lib/validation'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  
  // Validate input parameters
  const hasQuery = searchParams.has('query')
  const hasImdbId = searchParams.has('imdbId')
  
  if (!hasQuery && !hasImdbId) {
    return createValidationErrorResponse(
      request,
      'Either query or imdbId parameter is required',
      []
    )
  }
  
  // Validate specific parameter based on what's provided
  let validationResult
  if (hasImdbId) {
    validationResult = validateSearchParams(apiSchemas.moviesDetails, searchParams)
  } else {
    validationResult = validateSearchParams(apiSchemas.moviesSearch, searchParams)
  }
  
  if (!validationResult.success) {
    return createValidationErrorResponse(request, validationResult.error, validationResult.issues)
  }
  
  // Get client IP and check rate limit
  const ip = getClientIP(request)
  const rateLimitResult = await rateLimit(ip, {
    limit: 50, // requests per minute
    window: 60000, // 1 minute
    keyPrefix: 'movies_api',
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

  const apiKey = process.env.OMDB_API_KEY
  if (!apiKey) {
    logApiError('OMDB API key not configured', request)
    return NextResponse.json(
      { error: 'OMDB API key is not configured. Please check your environment variables.' },
      { status: 500 }
    )
  }

  try {
    if (hasImdbId) {
      const { imdbId } = validationResult.data as { imdbId: string }
      const movieDetails = await getMovieDetails(imdbId)
      return NextResponse.json(movieDetails)
    } else {
      const { query } = validationResult.data as { query: string }
      const movies = await searchMovies(query)
      return NextResponse.json(movies)
    }
  } catch (error: unknown) {
    const errorObj = error instanceof Error ? error : new Error(String(error))
    
    logApiError('Movies API request failed', request, errorObj, {
      validatedData: validationResult.data,
      apiKeyExists: !!apiKey,
    })
    
    // Return user-friendly error message
    const errorMessage = errorObj.message || 'Failed to fetch movie data'
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}

