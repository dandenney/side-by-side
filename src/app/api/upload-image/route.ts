import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import fetch from 'node-fetch'
import { validateRequestBody, apiSchemas, createValidationErrorResponse } from '@/lib/validation'
import { logApiError } from '@/lib/logger'

export async function POST(req: NextRequest) {
  // Validate input parameters
  const validationResult = await validateRequestBody(apiSchemas.imageUpload, req)
  
  if (!validationResult.success) {
    return createValidationErrorResponse(req, validationResult.error, validationResult.issues)
  }
  
  try {
    const { imageUrl, fileName } = validationResult.data
    const supabase = await createClient()

    // Download the image
    const response = await fetch(imageUrl)
    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to fetch image' }, { status: 400 })
    }
    const arrayBuffer = await response.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('url-images')
      .upload(fileName, buffer, {
        contentType: response.headers.get('content-type') || undefined,
        upsert: true,
      })

    if (error) {
      logApiError('Failed to upload image to Supabase', req, error, {
        requestData: validationResult.data,
        fileName
      })
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from('url-images')
      .getPublicUrl(fileName)

    return NextResponse.json({ url: publicUrlData.publicUrl })
  } catch (error: any) {
    logApiError('Failed to upload image', req, error, {
      requestData: validationResult.data
    })
    return NextResponse.json({ error: 'Failed to upload image' }, { status: 500 })
  }
} 