import { createClient } from '@/lib/supabase/client'
import { UrlListItem, Tag, Place } from '@/types/url-list'
import { SHARED_LIST_ID } from '@/lib/constants'

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

// Helper function to convert UTC date to local date string
const utcToLocalDate = (utcDate: string) => {
  return utcDate.split('T')[0]
}

// Helper function to convert local date to UTC date string
const localToUtcDate = (localDate: string) => {
  return `${localDate}T00:00:00Z`
}

export async function getUrlItems(listType: 'local' | 'shared', listId: string) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('url_items')
    .select('*')
    .eq('list_type', listType)
    .eq('list_id', listId)
    .order('created_at', { ascending: false })

  if (error) {
    throw error
  }

  return data.map(item => ({
    id: item.id,
    url: item.url,
    place: item.place_id ? {
      placeId: item.place_id,
      name: item.place_name!,
      address: item.place_address!,
      lat: item.place_lat!,
      lng: item.place_lng!,
      types: item.place_types!,
      rating: item.place_rating,
      userRatingsTotal: item.place_user_ratings_total,
      priceLevel: item.place_price_level,
      website: item.place_website,
      phoneNumber: item.place_phone_number,
      openingHours: item.place_opening_hours as Place['openingHours'],
    } : undefined,
    imageUrl: item.image_url,
    title: item.title,
    description: item.description,
    notes: item.notes,
    dateRange: item.date_range as UrlListItem['dateRange'],
    listType: item.list_type,
    listId: item.list_id,
    createdAt: new Date(item.created_at),
    updatedAt: new Date(item.updated_at),
    archived: item.archived,
  }))
}

export async function createUrlItem(item: Omit<UrlListItem, 'id' | 'createdAt' | 'updatedAt'>) {
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

  const { data, error } = await supabase
    .from('url_items')
    .insert(insertData)
    .select()
    .single()

  if (error) {
    throw error
  }

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
  const supabase = createClient()
  
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
      image_url: item.imageUrl,
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
    throw error
  }

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