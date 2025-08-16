import { createClient } from '@/lib/supabase/client'
import { UpcomingItem, UpcomingItemForm } from '@/types/upcoming'
import { logServiceError } from '@/lib/logger'

// Helper function to map database row to UpcomingItem
const mapDbRowToItem = (row: any): UpcomingItem => ({
  id: row.id,
  title: row.title,
  description: row.description || undefined,
  url: row.url || undefined,
  imageUrl: row.image_url || undefined,
  location: row.location || undefined,
  startDate: row.start_date,
  endDate: row.end_date,
  status: row.status,
  listId: '00000000-0000-0000-0000-000000000000', // Default value since table doesn't have list_id
  createdAt: new Date(row.created_at),
  updatedAt: new Date(row.updated_at)
})

// Helper function to map UpcomingItemForm to database row
const mapFormToDbRow = (form: UpcomingItemForm) => ({
  title: form.title,
  description: form.description || null,
  url: form.url || null,
  image_url: form.imageUrl || null,
  location: form.location || null,
  start_date: form.startDate,
  end_date: form.endDate,
  status: form.status,
  list_id: '00000000-0000-0000-0000-000000000000' // Default list ID
})

export async function getUpcomingEvents(): Promise<UpcomingItem[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('upcoming_events')
    .select('*')
    .order('start_date', { ascending: true })

  if (error) {
    logServiceError('Failed to fetch upcoming events', 'upcomingEvents', 'getUpcomingEvents', error)
    throw error
  }

  return (data || []).map(mapDbRowToItem)
}

export async function createUpcomingEvent(formData: UpcomingItemForm): Promise<UpcomingItem> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('upcoming_events')
    .insert([mapFormToDbRow(formData)])
    .select()
    .single()

  if (error) {
    logServiceError('Failed to create upcoming event', 'upcomingEvents', 'createUpcomingEvent', error, { title: formData.title })
    throw error
  }

  return mapDbRowToItem(data)
}

export async function updateUpcomingEvent(id: string, formData: UpcomingItemForm): Promise<UpcomingItem> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('upcoming_events')
    .update(mapFormToDbRow(formData))
    .eq('id', id)
    .select()
    .single()

  if (error) {
    logServiceError('Failed to update upcoming event', 'upcomingEvents', 'updateUpcomingEvent', error, { id, title: formData.title })
    throw error
  }

  return mapDbRowToItem(data)
}

export async function deleteUpcomingEvent(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('upcoming_events')
    .delete()
    .eq('id', id)

  if (error) {
    logServiceError('Failed to delete upcoming event', 'upcomingEvents', 'deleteUpcomingEvent', error, { id })
    throw error
  }
} 