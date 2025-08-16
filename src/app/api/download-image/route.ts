import { NextRequest, NextResponse } from 'next/server'
import fetch from 'node-fetch'
import { validateRequestBody, apiSchemas, createValidationErrorResponse } from '@/lib/validation'
import { logApiError } from '@/lib/logger'

export async function POST(req: NextRequest) {
  // Validate input parameters
  const validationResult = await validateRequestBody(apiSchemas.imageDownload, req)
  
  if (!validationResult.success) {
    return createValidationErrorResponse(req, validationResult.error, validationResult.issues)
  }
  
  try {
    const { imageUrl } = validationResult.data
    const response = await fetch(imageUrl)
    
    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to download image' }, { status: response.status })
    }

    const buffer = await response.buffer()
    const base64 = buffer.toString('base64')
    const contentType = response.headers.get('content-type') || 'image/jpeg'
    
    return NextResponse.json({
      success: true,
      base64Data: `data:${contentType};base64,${base64}`,
      contentType
    })
  } catch (error: any) {
    logApiError('Failed to download image', req, error, {
      requestData: validationResult.data
    })
    return NextResponse.json({ error: 'Failed to download image' }, { status: 500 })
  }
} 