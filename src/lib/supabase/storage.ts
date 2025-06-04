import { createClient } from './client'

/**
 * Downloads an image from a URL and stores it in Supabase storage
 * @param imageUrl The URL of the image to download and store
 * @returns The public URL of the stored image
 */
export async function storeImageFromUrl(imageUrl: string): Promise<string> {
  const supabase = createClient()

  try {
    // Download the image through our API route to avoid CORS issues
    const response = await fetch(`/api/fetch-image?url=${encodeURIComponent(imageUrl)}`)
    if (!response.ok) {
      throw new Error(`Failed to download image: ${response.statusText}`)
    }

    const blob = await response.blob()
    const fileExtension = imageUrl.split('.').pop()?.split('?')[0] || 'jpg'
    const fileName = `${Date.now()}.${fileExtension}`

    // Upload to Supabase storage
    const { data, error } = await supabase.storage
      .from('url-images')
      .upload(fileName, blob, {
        contentType: blob.type,
        cacheControl: '3600',
        upsert: false
      })

    if (error) {
      throw error
    }

    // Get the public URL
    const { data: { publicUrl } } = supabase.storage
      .from('url-images')
      .getPublicUrl(fileName)

    return publicUrl
  } catch (error) {
    console.error('Error storing image:', error)
    throw error
  }
} 