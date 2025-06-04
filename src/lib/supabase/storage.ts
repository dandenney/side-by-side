import { createClient } from './client'

const MAX_RETRIES = 3
const RETRY_DELAY = 1000 // 1 second

/**
 * Downloads an image from a URL and stores it in Supabase storage
 * @param imageUrl The URL of the image to download and store
 * @returns The public URL of the stored image
 */
export async function storeImageFromUrl(imageUrl: string): Promise<string> {
  const supabase = createClient()

  // Validate URL
  try {
    new URL(imageUrl)
  } catch (error) {
    throw new Error('Invalid image URL')
  }

  let lastError: Error | null = null
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      // Download the image through our API route to avoid CORS issues
      const response = await fetch(`/api/fetch-image?url=${encodeURIComponent(imageUrl)}`)
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Failed to download image: ${response.statusText}`)
      }

      const blob = await response.blob()
      
      // Validate blob
      if (blob.size === 0) {
        throw new Error('Downloaded image is empty')
      }

      const fileExtension = imageUrl.split('.').pop()?.split('?')[0] || 'jpg'
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExtension}`

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
      lastError = error instanceof Error ? error : new Error(String(error))
      console.error(`Attempt ${attempt} failed:`, lastError)
      
      if (attempt < MAX_RETRIES) {
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * attempt))
      }
    }
  }

  // If we get here, all retries failed
  throw lastError || new Error('Failed to store image after multiple attempts')
} 