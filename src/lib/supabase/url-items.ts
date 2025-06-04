import { createClient } from '@/lib/supabase/client'
import { UrlListItem, Tag, Place } from '@/types/url-list'
import { SHARED_LIST_ID } from '@/lib/constants'

interface UrlItem {
  id: number
  url: string
  image_url?: string
  title?: string
  description?: string
  notes?: string
  list_type: string
  list_id: string
  created_at: string
  updated_at: string
  archived: boolean
  place_id?: string
  place_name?: string
  place_address?: string
  place_lat?: number
  place_lng?: number
  place_types?: string[]
  place_rating?: number
  place_user_ratings_total?: number
  place_price_level?: number
  place_website?: string
  place_phone_number?: string
  place_opening_hours?: any
  date_range_start?: string
  date_range_end?: string
}

interface UrlItemInsert {
  url: string
  image_url?: string
  title?: string
  description?: string
  notes?: string
  list_type: string
  list_id: string
  archived?: boolean
  place_id?: string
  place_name?: string
  place_address?: string
  place_lat?: number
  place_lng?: number
  place_types?: string[]
  place_rating?: number
  place_user_ratings_total?: number
  place_price_level?: number
  place_website?: string
  place_phone_number?: string
  place_opening_hours?: any
  date_range_start?: string
  date_range_end?: string
}

interface SupabaseUrlItem {
  id: string
  url: string
  image_url: string | null
  title: string
  description: string | null
  notes: string | null
  list_type: 'local' | 'shared'
  list_id: string
  created_at: string
  updated_at: string
  archived: boolean
  place_id: string | null
  place_name: string | null
  place_address: string | null
  place_lat: number | null
  place_lng: number | null
  place_types: string[] | null
  place_rating: number | null
  place_user_ratings_total: number | null
  place_price_level: number | null
  place_website: string | null
  place_phone_number: string | null
  date_range: { start: string; end: string } | null
}

interface SupabaseItemTag {
  tag: {
    id: string
    name: string
    list_id: string
    list_type: 'local' | 'shared'
    created_at: string
  }
}

interface SupabaseUrlItemWithTags extends SupabaseUrlItem {
  item_tags: SupabaseItemTag[]
}

// Helper function to convert UTC date to local date string
const utcToLocalDate = (utcDate: string) => {
  return utcDate.split('T')[0]
}

// Helper function to convert local date to UTC date string
const localToUtcDate = (localDate: string) => {
  return `${localDate}T00:00:00Z`
}

async function uploadImageToStorage(imageUrl: string): Promise<string | null> {
  console.log('🖼️ Starting image upload process for URL:', imageUrl)
  try {
    // First, download the image through our API route
    console.log('📥 Downloading image through API route...')
    const downloadResponse = await fetch('/api/download-image', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ imageUrl }),
    })

    if (!downloadResponse.ok) {
      console.error('❌ Failed to download image:', await downloadResponse.text())
      return null
    }

    const { data: base64Data, contentType } = await downloadResponse.json()
    console.log('✅ Image downloaded successfully')

    // Upload to storage through server-side route
    const fileName = `url-image-${Date.now()}.jpg`
    console.log('📤 Uploading to Supabase Storage as:', fileName)
    
    const uploadResponse = await fetch('/api/upload-to-storage', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fileName,
        base64Data,
        contentType
      }),
    })

    if (!uploadResponse.ok) {
      console.error('❌ Failed to upload image:', await uploadResponse.text())
      return null
    }

    const { url } = await uploadResponse.json()
    console.log('✅ Image uploaded successfully to Supabase')
    console.log('🔗 Public URL:', url)
    return url
  } catch (error) {
    console.error('❌ Unexpected error during image upload:', error)
    return null
  }
}

export async function getUrlItems(listType: 'local' | 'shared', listId: string) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('url_items')
    .select(`
      *,
      item_tags (
        tag:tags (
          id,
          name,
          list_id,
          list_type,
          created_at
        )
      )
    `)
    .eq('list_type', listType)
    .eq('list_id', listId)
    .order('created_at', { ascending: false })

  if (error) {
    throw error
  }

  return (data as SupabaseUrlItemWithTags[]).map(item => {
    const tags = item.item_tags?.map(({ tag }) => ({
      id: tag.id,
      name: tag.name,
      listId: tag.list_id,
      listType: tag.list_type,
      createdAt: new Date(tag.created_at)
    })) || []

    return {
      id: item.id,
      url: item.url,
      place: item.place_id ? {
        placeId: item.place_id,
        name: item.place_name!,
        address: item.place_address!,
        lat: item.place_lat!,
        lng: item.place_lng!,
        types: item.place_types!,
        rating: item.place_rating ?? undefined,
        userRatingsTotal: item.place_user_ratings_total ?? undefined,
        priceLevel: item.place_price_level ?? undefined,
        website: item.place_website ?? undefined,
        phoneNumber: item.place_phone_number ?? undefined,
      } : undefined,
      imageUrl: item.image_url ?? undefined,
      title: item.title,
      description: item.description ?? undefined,
      notes: item.notes ?? undefined,
      dateRange: item.date_range ? {
        start: item.date_range.start,
        end: item.date_range.end
      } : undefined,
      listType: item.list_type,
      listId: item.list_id,
      createdAt: new Date(item.created_at),
      updatedAt: new Date(item.updated_at),
      archived: item.archived,
      tags
    }
  })
}

export async function createUrlItem(item: Omit<UrlListItem, 'id' | 'createdAt' | 'updatedAt'>) {
  console.log('📝 Creating new URL item with image:', item.imageUrl ? 'Yes' : 'No')
  const supabase = createClient()
  
  // Transform place data to match Supabase schema
  const insertData = {
    url: item.url,
    image_url: item.imageUrl,
    title: item.title,
    description: item.description,
    notes: item.notes,
    date_range_start: item.dateRange?.start,
    date_range_end: item.dateRange?.end,
    list_type: item.listType,
    list_id: item.listId,
    archived: item.archived || false,
    // Place fields - flattened and prefixed
    place_id: item.place?.placeId || null,
    place_name: item.place?.name || null,
    place_address: item.place?.address || null,
    place_lat: item.place?.lat || null,
    place_lng: item.place?.lng || null,
    place_types: item.place?.types || null,
    place_rating: item.place?.rating || null,
    place_user_ratings_total: item.place?.userRatingsTotal || null,
    place_price_level: item.place?.priceLevel || null,
    place_website: item.place?.website || null,
    place_phone_number: item.place?.phoneNumber || null,
    place_opening_hours: item.place?.openingHours || null,
  }

  // If an imageUrl is provided, upload the image to Supabase Storage
  if (item.imageUrl) {
    console.log('🖼️ Image URL provided, attempting to upload to storage...')
    const storedImageUrl = await uploadImageToStorage(item.imageUrl)
    if (storedImageUrl) {
      console.log('✅ Image uploaded successfully, updating image_url in database')
      insertData.image_url = storedImageUrl
    } else {
      console.log('⚠️ Failed to upload image, keeping original URL')
    }
  }

  console.log('💾 Saving item to database...')
  const { data, error } = await supabase
    .from('url_items')
    .insert(insertData)
    .select()
    .single()

  if (error) {
    console.error('❌ Error saving item to database:', error.message)
    throw error
  }

  console.log('✅ Item created successfully')
  return {
    id: data.id,
    url: data.url,
    place: data.place_id ? {
      placeId: data.place_id,
      name: data.place_name!,
      address: data.place_address!,
      lat: data.place_lat!,
      lng: data.place_lng!,
      types: data.place_types!,
      rating: data.place_rating,
      userRatingsTotal: data.place_user_ratings_total,
      priceLevel: data.place_price_level,
      website: data.place_website,
      phoneNumber: data.place_phone_number,
      openingHours: data.place_opening_hours as Place['openingHours'],
    } : undefined,
    imageUrl: data.image_url,
    title: data.title,
    description: data.description,
    notes: data.notes,
    dateRange: (data.date_range_start || data.date_range_end) ? {
      start: data.date_range_start!,
      end: data.date_range_end!,
    } : undefined,
    listType: data.list_type,
    listId: data.list_id,
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at),
    archived: data.archived,
  }
}

export async function updateUrlItem(item: UrlListItem) {
  console.log('📝 Updating URL item:', item.id)
  const supabase = createClient()

  // If the image URL has changed, upload the new image
  let imageUrl = item.imageUrl
  if (item.imageUrl && !item.imageUrl.startsWith('https://')) {
    console.log('🖼️ New image URL detected, attempting to upload...')
    const storedImageUrl = await uploadImageToStorage(item.imageUrl)
    if (storedImageUrl) {
      console.log('✅ New image uploaded successfully')
      imageUrl = storedImageUrl
    } else {
      console.log('⚠️ Failed to upload new image, keeping original URL')
    }
  }
  
  console.log('💾 Updating item in database...')
  const { data, error } = await supabase
    .from('url_items')
    .update({
      url: item.url,
      place_id: item.place?.placeId,
      place_name: item.place?.name,
      place_address: item.place?.address,
      place_lat: item.place?.lat,
      place_lng: item.place?.lng,
      place_types: item.place?.types,
      place_rating: item.place?.rating,
      place_user_ratings_total: item.place?.userRatingsTotal,
      place_price_level: item.place?.priceLevel,
      place_website: item.place?.website,
      place_phone_number: item.place?.phoneNumber,
      place_opening_hours: item.place?.openingHours,
      image_url: imageUrl,
      title: item.title,
      description: item.description,
      notes: item.notes,
      date_range: item.dateRange,
      list_type: item.listType,
      list_id: item.listId,
      archived: item.archived,
    })
    .eq('id', item.id)
    .select()
    .single()

  if (error) {
    console.error('❌ Error updating item:', error.message)
    throw error
  }

  console.log('✅ Item updated successfully')
  return {
    id: data.id,
    url: data.url,
    place: data.place_id ? {
      placeId: data.place_id,
      name: data.place_name!,
      address: data.place_address!,
      lat: data.place_lat!,
      lng: data.place_lng!,
      types: data.place_types!,
      rating: data.place_rating,
      userRatingsTotal: data.place_user_ratings_total,
      priceLevel: data.place_price_level,
      website: data.place_website,
      phoneNumber: data.place_phone_number,
      openingHours: data.place_opening_hours as Place['openingHours'],
    } : undefined,
    imageUrl: data.image_url,
    title: data.title,
    description: data.description,
    notes: data.notes,
    dateRange: data.date_range as UrlListItem['dateRange'],
    listType: data.list_type,
    listId: data.list_id,
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at),
    archived: data.archived,
  }
}

export async function deleteUrlItem(id: string) {
  const supabase = createClient()
  
  const { error } = await supabase
    .from('url_items')
    .delete()
    .eq('id', id)

  if (error) {
    throw error
  }
}

export async function archiveUrlItem(id: string) {
  const supabase = createClient()
  
  const { error } = await supabase
    .from('url_items')
    .update({ archived: true })
    .eq('id', id)

  if (error) {
    throw error
  }
} 