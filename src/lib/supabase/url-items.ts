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
  place_opening_hours: any | null
  date_range_start: string | null
  date_range_end: string | null
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
    // Download the image through our API route
    console.log('📥 Downloading image through API route...')
    const response = await fetch(`/api/fetch-image?url=${encodeURIComponent(imageUrl)}`)
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('❌ Failed to download image:', errorData.error || response.statusText)
      return null
    }

    const blob = await response.blob()
    console.log('✅ Image downloaded successfully')

    // Upload to Supabase storage
    const supabase = createClient()
    const fileName = `url-image-${Date.now()}.jpg`
    console.log('📤 Uploading to Supabase Storage as:', fileName)
    
    const { data, error } = await supabase.storage
      .from('url-images')
      .upload(fileName, blob, {
        contentType: blob.type,
        cacheControl: '3600',
        upsert: false
      })

    if (error) {
      console.error('❌ Failed to upload image:', error)
      return null
    }

    // Get the public URL
    const { data: { publicUrl } } = supabase.storage
      .from('url-images')
      .getPublicUrl(fileName)

    console.log('✅ Image uploaded successfully to Supabase')
    console.log('🔗 Public URL:', publicUrl)
    return publicUrl
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
        openingHours: item.place_opening_hours as Place['openingHours'],
      } : undefined,
      imageUrl: item.image_url ?? undefined,
      title: item.title,
      description: item.description ?? undefined,
      notes: item.notes ?? undefined,
      dateRange: (item.date_range_start || item.date_range_end) ? {
        start: item.date_range_start!,
        end: item.date_range_end!,
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
  
  // Store image if provided
  let storedImageUrl = item.imageUrl
  if (item.imageUrl) {
    try {
      storedImageUrl = await uploadImageToStorage(item.imageUrl) || item.imageUrl
    } catch (error) {
      console.error('Failed to store image:', error)
      // Continue with original image URL if storage fails
    }
  }
  
  // Transform place data to match Supabase schema
  const insertData = {
    url: item.url,
    image_url: storedImageUrl,
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

  const { data, error } = await supabase
    .from('url_items')
    .insert([insertData])
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
    .single()

  if (error) {
    console.error('❌ Error creating item:', error.message)
    throw error
  }

  console.log('✅ Item created successfully')
  
  // Transform the data back to UrlListItem type
  const urlItem = data as SupabaseUrlItemWithTags
  return {
    id: urlItem.id,
    url: urlItem.url,
    place: urlItem.place_id ? {
      placeId: urlItem.place_id,
      name: urlItem.place_name!,
      address: urlItem.place_address!,
      lat: urlItem.place_lat!,
      lng: urlItem.place_lng!,
      types: urlItem.place_types!,
      rating: urlItem.place_rating ?? undefined,
      userRatingsTotal: urlItem.place_user_ratings_total ?? undefined,
      priceLevel: urlItem.place_price_level ?? undefined,
      website: urlItem.place_website ?? undefined,
      phoneNumber: urlItem.place_phone_number ?? undefined,
      openingHours: urlItem.place_opening_hours as Place['openingHours'],
    } : undefined,
    imageUrl: urlItem.image_url ?? undefined,
    title: urlItem.title,
    description: urlItem.description ?? undefined,
    notes: urlItem.notes ?? undefined,
    dateRange: (urlItem.date_range_start || urlItem.date_range_end) ? {
      start: urlItem.date_range_start!,
      end: urlItem.date_range_end!,
    } : undefined,
    listType: urlItem.list_type,
    listId: urlItem.list_id,
    createdAt: new Date(urlItem.created_at),
    updatedAt: new Date(urlItem.updated_at),
    archived: urlItem.archived,
    tags: urlItem.item_tags?.map(({ tag }) => ({
      id: tag.id,
      name: tag.name,
      listId: tag.list_id,
      listType: tag.list_type,
      createdAt: new Date(tag.created_at)
    })) || []
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
      date_range_start: item.dateRange?.start,
      date_range_end: item.dateRange?.end,
      list_type: item.listType,
      list_id: item.listId,
      archived: item.archived,
    })
    .eq('id', item.id)
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
    .single()

  if (error) {
    console.error('❌ Error updating item:', error.message)
    throw error
  }

  console.log('✅ Item updated successfully')
  
  // Transform the data back to UrlListItem type
  const urlItem = data as SupabaseUrlItemWithTags
  return {
    id: urlItem.id,
    url: urlItem.url,
    place: urlItem.place_id ? {
      placeId: urlItem.place_id,
      name: urlItem.place_name!,
      address: urlItem.place_address!,
      lat: urlItem.place_lat!,
      lng: urlItem.place_lng!,
      types: urlItem.place_types!,
      rating: urlItem.place_rating ?? undefined,
      userRatingsTotal: urlItem.place_user_ratings_total ?? undefined,
      priceLevel: urlItem.place_price_level ?? undefined,
      website: urlItem.place_website ?? undefined,
      phoneNumber: urlItem.place_phone_number ?? undefined,
      openingHours: urlItem.place_opening_hours as Place['openingHours'],
    } : undefined,
    imageUrl: urlItem.image_url ?? undefined,
    title: urlItem.title,
    description: urlItem.description ?? undefined,
    notes: urlItem.notes ?? undefined,
    dateRange: (urlItem.date_range_start || urlItem.date_range_end) ? {
      start: urlItem.date_range_start!,
      end: urlItem.date_range_end!,
    } : undefined,
    listType: urlItem.list_type,
    listId: urlItem.list_id,
    createdAt: new Date(urlItem.created_at),
    updatedAt: new Date(urlItem.updated_at),
    archived: urlItem.archived,
    tags: urlItem.item_tags?.map(({ tag }) => ({
      id: tag.id,
      name: tag.name,
      listId: tag.list_id,
      listType: tag.list_type,
      createdAt: new Date(tag.created_at)
    })) || []
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