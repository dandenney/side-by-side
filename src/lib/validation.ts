/**
 * API validation utilities using Zod schemas
 */

import { z } from 'zod'
import { logApiError } from './logger'

// Conditional import for Next.js environment
let NextResponse: any
if (typeof window === 'undefined') {
  try {
    NextResponse = require('next/server').NextResponse
  } catch (e) {
    // NextResponse not available in test environment
  }
}

/**
 * Common validation schemas
 */
export const commonSchemas = {
  // URL validation - only allow HTTP/HTTPS for security
  url: z.string().url({ message: 'Must be a valid URL' }).refine(
    (url) => url.startsWith('http://') || url.startsWith('https://'),
    { message: 'URL must use HTTP or HTTPS protocol' }
  ),
  
  // URL with optional validation - only allow HTTP/HTTPS for security
  optionalUrl: z.string().url({ message: 'Must be a valid URL' }).refine(
    (url) => url.startsWith('http://') || url.startsWith('https://'),
    { message: 'URL must use HTTP or HTTPS protocol' }
  ).optional().or(z.literal('')),
  
  // Non-empty string
  nonEmptyString: z.string().min(1, { message: 'Cannot be empty' }),
  
  // Optional string
  optionalString: z.string().optional(),
  
  // Google Place ID format
  placeId: z.string().regex(/^[A-Za-z0-9_-]+$/, { message: 'Invalid Place ID format' }),
  
  // Pagination parameters
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  
  // UUID format
  uuid: z.string().uuid({ message: 'Must be a valid UUID' }),
  
  // ISO date string
  isoDate: z.string().datetime({ message: 'Must be a valid ISO date string' }),
  
  // Status enum for upcoming events
  eventStatus: z.enum(['tickets', 'definitely', 'maybe']),
}

/**
 * API-specific validation schemas
 */
export const apiSchemas = {
  // Places API
  placesSearch: z.object({
    query: commonSchemas.nonEmptyString,
  }),
  
  placesDetails: z.object({
    placeId: commonSchemas.placeId,
  }),
  
  // Meta API
  metaFetch: z.object({
    url: commonSchemas.url,
  }),
  
  // Image download
  imageDownload: z.object({
    imageUrl: commonSchemas.url,
  }),
  
  // Image fetch
  imageFetch: z.object({
    url: commonSchemas.url,
  }),
  
  // Image upload
  imageUpload: z.object({
    imageUrl: commonSchemas.url,
    fileName: commonSchemas.nonEmptyString,
  }),
  
  // Storage upload
  storageUpload: z.object({
    fileName: commonSchemas.nonEmptyString,
    base64Data: z.string().min(1, { message: 'Base64 data is required' }),
    contentType: z.string().regex(/^image\/.+/, { message: 'Content type must be an image MIME type' }).optional(),
  }),
  
  // Upcoming events
  upcomingEventCreate: z.object({
    title: commonSchemas.nonEmptyString,
    description: commonSchemas.optionalString,
    url: commonSchemas.optionalUrl,
    imageUrl: commonSchemas.optionalUrl,
    location: commonSchemas.optionalString,
    startDate: commonSchemas.isoDate,
    endDate: commonSchemas.isoDate,
    status: commonSchemas.eventStatus,
  }),
  
  upcomingEventUpdate: z.object({
    id: commonSchemas.uuid,
    title: commonSchemas.nonEmptyString,
    description: commonSchemas.optionalString,
    url: commonSchemas.optionalUrl,
    imageUrl: commonSchemas.optionalUrl,
    location: commonSchemas.optionalString,
    startDate: commonSchemas.isoDate,
    endDate: commonSchemas.isoDate,
    status: commonSchemas.eventStatus,
  }),
  
  upcomingEventDelete: z.object({
    id: commonSchemas.uuid,
  }),
}

/**
 * Validation result types
 */
export type ValidationResult<T> = {
  success: true
  data: T
} | {
  success: false
  error: string
  issues: z.ZodIssue[]
}

/**
 * Validate data against a Zod schema
 */
export function validateSchema<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): ValidationResult<T> {
  const result = schema.safeParse(data)
  
  if (result.success) {
    return {
      success: true,
      data: result.data,
    }
  }
  
  return {
    success: false,
    error: result.error.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`).join(', '),
    issues: result.error.issues,
  }
}

/**
 * Validate URL search parameters
 */
export function validateSearchParams<T>(
  schema: z.ZodSchema<T>,
  searchParams: URLSearchParams
): ValidationResult<T> {
  const params: Record<string, string> = {}
  
  searchParams.forEach((value, key) => {
    params[key] = value
  })
  
  return validateSchema(schema, params)
}

/**
 * Validate JSON request body
 */
export async function validateRequestBody<T>(
  schema: z.ZodSchema<T>,
  request: Request
): Promise<ValidationResult<T>> {
  try {
    const body = await request.json()
    return validateSchema(schema, body)
  } catch (error) {
    return {
      success: false,
      error: 'Invalid JSON in request body',
      issues: [],
    }
  }
}

/**
 * Create validation error response
 */
export function createValidationErrorResponse(
  request: Request,
  error: string,
  issues: z.ZodIssue[] = []
): any {
  if (NextResponse) {
    logApiError('Validation failed', request, undefined, {
      validationError: error,
      issues: issues.map(issue => ({
        path: issue.path.join('.'),
        message: issue.message,
        code: issue.code,
      })),
    })
    
    return NextResponse.json(
      {
        error: 'Validation failed',
        message: error,
        issues: issues.map(issue => ({
          field: issue.path.join('.'),
          message: issue.message,
        })),
      },
      { status: 400 }
    )
  }
  
  // Fallback for test environment
  return {
    error: 'Validation failed',
    message: error,
    issues: issues.map(issue => ({
      field: issue.path.join('.'),
      message: issue.message,
    })),
  }
}

/**
 * Middleware-like function to validate API requests
 */
export function withValidation<T>(
  schema: z.ZodSchema<T>,
  source: 'searchParams' | 'body' = 'searchParams'
) {
  return async (
    request: Request,
    handler: (data: T, request: Request) => Promise<any>
  ): Promise<any> => {
    let validation: ValidationResult<T>
    
    if (source === 'searchParams') {
      const { searchParams } = new URL(request.url)
      validation = validateSearchParams(schema, searchParams)
    } else {
      validation = await validateRequestBody(schema, request)
    }
    
    if (!validation.success) {
      return createValidationErrorResponse(request, validation.error, validation.issues)
    }
    
    return handler(validation.data, request)
  }
}