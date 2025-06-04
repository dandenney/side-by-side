import { NextRequest, NextResponse } from 'next/server'
import fetch from 'node-fetch'

export async function POST(req: NextRequest) {
  try {
    const { imageUrl } = await req.json()
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
  } catch (error) {
    return NextResponse.json({ error: 'Failed to download image' }, { status: 500 })
  }
} 