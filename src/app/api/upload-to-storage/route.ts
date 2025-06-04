import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
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

    const { fileName, base64Data, contentType } = await req.json()

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
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Construct the public URL manually to ensure it works with Next.js Image
    const publicUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/url-images/${fileName}`
    return NextResponse.json({ success: true, url: publicUrl })
  } catch (error) {
    return NextResponse.json({ error: 'Unexpected error occurred' }, { status: 500 })
  }
} 