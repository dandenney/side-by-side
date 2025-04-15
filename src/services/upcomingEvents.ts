import { createClient } from '@/lib/supabase/client'
import { UpcomingItem, UpcomingItemForm } from '@/types/upcoming'
import { SHARED_LIST_ID } from '@/lib/constants'

export async function getUpcomingEvents(): Promise<UpcomingItem[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('upcoming_events')
    .select('*')
    .order('start_date', { ascending: true })

  if (error) {
    console.error('Error fetching upcoming events:', error)
    throw error
  }

  return data.map(item => ({
    id: item.id,
    title: item.title,
    description: item.description || undefined,
    url: item.url || undefined,
    imageUrl: item.image_url || undefined,
    location: item.location || undefined,
    startDate: item.start_date,
    endDate: item.end_date,
    status: item.status,
    listType: item.list_type,
    listId: item.list_id,
    createdAt: item.created_at,
    updatedAt: item.updated_at,
  }))
}

export async function createUpcomingEvent(formData: UpcomingItemForm): Promise<UpcomingItem> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('upcoming_events')
    .insert({
      title: formData.title,
      description: formData.description,
      url: formData.url,
      image_url: formData.imageUrl,
      location: formData.location,
      start_date: formData.startDate,
      end_date: formData.endDate,
      status: formData.status,
      list_type: 'local',
      list_id: SHARED_LIST_ID,
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating upcoming event:', error)
    throw error
  }

  return {
    id: data.id,
    title: data.title,
    description: data.description || undefined,
    url: data.url || undefined,
    imageUrl: data.image_url || undefined,
    location: data.location || undefined,
    startDate: data.start_date,
    endDate: data.end_date,
    status: data.status,
    listType: data.list_type,
    listId: data.list_id,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  }
}

export async function updateUpcomingEvent(id: string, formData: UpcomingItemForm): Promise<UpcomingItem> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('upcoming_events')
    .update({
      title: formData.title,
      description: formData.description,
      url: formData.url,
      image_url: formData.imageUrl,
      location: formData.location,
      start_date: formData.startDate,
      end_date: formData.endDate,
      status: formData.status,
      list_type: 'local',
      list_id: SHARED_LIST_ID,
    })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating upcoming event:', error)
    throw error
  }

  return {
    id: data.id,
    title: data.title,
    description: data.description || undefined,
    url: data.url || undefined,
    imageUrl: data.image_url || undefined,
    location: data.location || undefined,
    startDate: data.start_date,
    endDate: data.end_date,
    status: data.status,
    listType: data.list_type,
    listId: data.list_id,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  }
}

export async function deleteUpcomingEvent(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('upcoming_events')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting upcoming event:', error)
    throw error
  }
} 