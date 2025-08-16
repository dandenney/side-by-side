import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { validateRequestBody, apiSchemas, createValidationErrorResponse } from '@/lib/validation'
import { logApiError } from '@/lib/logger'

export async function POST(req: NextRequest) {
  // Validate input parameters
  const validationResult = await validateRequestBody(apiSchemas.storageUpload, req)
  
  if (!validationResult.success) {
    return createValidationErrorResponse(req, validationResult.error, validationResult.issues)
  }

  try {
    // Create a Supabase client with the service role key
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const { fileName, base64Data, contentType } = validationResult.data

    // Convert base64 to buffer
    const base64DataWithoutPrefix = base64Data.split(',')[1]
    const buffer = Buffer.from(base64DataWithoutPrefix, 'base64')

    const { error } = await supabase.storage
      .from('url-images')
      .upload(fileName, buffer, {
        contentType: contentType || 'image/jpeg',
        upsert: true,
        cacheControl: '3600'
      })

    if (error) {
      logApiError('Failed to upload to Supabase storage', req, error, {
        requestData: validationResult.data,
        fileName
      })
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Construct the public URL manually to ensure it works with Next.js Image
    const publicUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/url-images/${fileName}`
    return NextResponse.json({ success: true, url: publicUrl })
  } catch (error: any) {
    logApiError('Failed to upload to storage', req, error, {
      requestData: validationResult.data
    })
    return NextResponse.json({ error: 'Unexpected error occurred' }, { status: 500 })
  }
} 