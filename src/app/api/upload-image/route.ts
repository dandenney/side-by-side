import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import fetch from 'node-fetch'

export async function POST(req: NextRequest) {
  const { imageUrl, fileName } = await req.json()
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
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Get public URL
  const { data: publicUrlData } = supabase.storage
    .from('url-images')
    .getPublicUrl(fileName)

  return NextResponse.json({ url: publicUrlData.publicUrl })
} 