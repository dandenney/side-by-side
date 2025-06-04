import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/client'
import fetch from 'node-fetch'

export async function POST(req: NextRequest) {
  try {
    const { imageUrl } = await req.json()
    const supabase = createClient()

    // Download the image
    console.log('Downloading image from:', imageUrl)
    const response = await fetch(imageUrl)
    if (!response.ok) {
      console.error('Failed to fetch image:', response.statusText)
      return NextResponse.json({ error: 'Failed to fetch image' }, { status: 400 })
    }

    const arrayBuffer = await response.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    console.log('Image downloaded, size:', buffer.length)

    // Upload to Supabase Storage
    const fileName = `test-image-${Date.now()}.jpg`
    console.log('Uploading to Supabase as:', fileName)
    
    const { data, error } = await supabase.storage
      .from('url-images')
      .upload(fileName, buffer, {
        contentType: response.headers.get('content-type') || 'image/jpeg',
        upsert: true,
      })

    if (error) {
      console.error('Supabase upload error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from('url-images')
      .getPublicUrl(fileName)

    console.log('Upload successful, public URL:', publicUrlData.publicUrl)
    return NextResponse.json({ 
      success: true, 
      url: publicUrlData.publicUrl,
      originalUrl: imageUrl
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Unexpected error occurred' }, { status: 500 })
  }
} 