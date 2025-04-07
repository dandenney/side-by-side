import { supabase } from '../supabase'
import { UrlListItem, Tag } from '@/types/url-list'
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
  console.log('Converting UTC to local:', utcDate)
  const result = utcDate.split('T')[0]
  console.log('Result:', result)
  return result
}

// Helper function to convert local date to UTC date string
const localToUtcDate = (localDate: string) => {
  console.log('Converting local to UTC:', localDate)
  const result = `${localDate}T00:00:00Z`
  console.log('Result:', result)
  return result
}

export async function getUrlItems(listType: 'local' | 'shared', listId: string): Promise<UrlListItem[]> {
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
    .eq('list_id', listId)
    .eq('list_type', listType)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching url items:', error)
    throw error
  }

  return data.map(item => ({
    id: item.id,
    url: item.url,
    imageUrl: item.image_url,
    title: item.title,
    description: item.description,
    notes: item.notes,
    dateRange: item.date_range_start && item.date_range_end ? {
      start: utcToLocalDate(item.date_range_start),
      end: utcToLocalDate(item.date_range_end)
    } : undefined,
    listType: item.list_type,
    listId: item.list_id,
    createdAt: new Date(item.created_at),
    updatedAt: new Date(item.updated_at),
    archived: item.archived,
    tags: (item.item_tags as SupabaseItemTag[]).map(({ tag }) => ({
      id: tag.id,
      name: tag.name,
      listId: tag.list_id,
      listType: tag.list_type,
      createdAt: new Date(tag.created_at)
    }))
  }))
}

export async function createUrlItem(item: Omit<UrlListItem, 'id' | 'createdAt' | 'updatedAt'>) {
  const { data, error } = await supabase
    .from('url_items')
    .insert({
      url: item.url,
      image_url: item.imageUrl,
      title: item.title,
      description: item.description,
      notes: item.notes,
      date_range_start: item.dateRange?.start ? localToUtcDate(item.dateRange.start) : null,
      date_range_end: item.dateRange?.end ? localToUtcDate(item.dateRange.end) : null,
      list_type: item.listType,
      list_id: item.listId,
      archived: item.archived || false
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating url item:', error)
    throw error
  }

  return {
    id: data.id,
    url: data.url,
    imageUrl: data.image_url,
    title: data.title,
    description: data.description,
    notes: data.notes,
    dateRange: data.date_range_start && data.date_range_end ? {
      start: utcToLocalDate(data.date_range_start),
      end: utcToLocalDate(data.date_range_end)
    } : undefined,
    listType: data.list_type,
    listId: data.list_id,
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at),
    archived: data.archived,
    tags: [] // Will be populated separately
  } as UrlListItem
}

export async function updateUrlItem(item: UrlListItem) {
  console.log('Original item dateRange:', item.dateRange)
  
  const updateData = {
    url: item.url,
    image_url: item.imageUrl,
    title: item.title,
    description: item.description,
    notes: item.notes,
    date_range_start: item.dateRange?.start ? localToUtcDate(item.dateRange.start) : null,
    date_range_end: item.dateRange?.end ? localToUtcDate(item.dateRange.end) : null,
    archived: item.archived,
    updated_at: new Date().toISOString()
  }
  
  console.log('Data being sent to Supabase:', JSON.stringify(updateData, null, 2))

  const { data, error } = await supabase
    .from('url_items')
    .update(updateData)
    .eq('id', item.id)
    .select()
    .single()

  if (error) {
    console.error('Error updating url item:', error)
    throw error
  }

  console.log('Raw data received from Supabase:', JSON.stringify(data, null, 2))

  const result = {
    id: data.id,
    url: data.url,
    imageUrl: data.image_url,
    title: data.title,
    description: data.description,
    notes: data.notes,
    dateRange: data.date_range_start && data.date_range_end ? {
      start: utcToLocalDate(data.date_range_start),
      end: utcToLocalDate(data.date_range_end)
    } : undefined,
    listType: data.list_type,
    listId: data.list_id,
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at),
    archived: data.archived,
    tags: item.tags || [] // Will be populated separately
  } as UrlListItem

  console.log('Final processed result:', JSON.stringify(result, null, 2))
  return result
}

export async function deleteUrlItem(id: string) {
  const { error } = await supabase
    .from('url_items')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting url item:', error)
    throw error
  }
}

export async function archiveUrlItem(id: string) {
  const { error } = await supabase
    .from('url_items')
    .update({ archived: true, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) {
    console.error('Error archiving url item:', error)
    throw error
  }
} 