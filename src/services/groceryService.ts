import { createClient } from '@/lib/supabase/client'
import { GroceryItem } from '@/types/grocery'
import { SHARED_LIST_ID } from '@/lib/constants'
import { logServiceError } from '@/lib/logger'

export interface GroceryItemForm {
  name: string
  store: 'Publix' | 'Costco' | 'Aldi'
  checked?: boolean
}

export interface ArchivedGroceryItem {
  id: string
  name: string
  store: 'Publix' | 'Costco' | 'Aldi'
  createdAt: Date
  archivedAt: Date
}

// Helper function to map database row to GroceryItem
const mapDbRowToGroceryItem = (row: any): GroceryItem => ({
  id: row.id,
  name: row.name,
  checked: row.checked || false,
  store: row.store,
  createdAt: new Date(row.created_at),
  updatedAt: new Date(row.updated_at)
})

// Helper function to map archived database row
const mapDbRowToArchivedItem = (row: any): ArchivedGroceryItem => ({
  id: row.id,
  name: row.name,
  store: row.store,
  createdAt: new Date(row.created_at),
  archivedAt: new Date(row.archived_at)
})

export async function getGroceryItems(): Promise<GroceryItem[]> {
  const supabase = createClient()
  
  try {
    const { data, error } = await supabase
      .from('grocery_items')
      .select('*')
      .eq('list_id', SHARED_LIST_ID)
      .order('created_at', { ascending: true })

    if (error) {
      logServiceError('Failed to fetch grocery items', 'groceryService', 'getGroceryItems', error)
      throw error
    }

    return (data || []).map(mapDbRowToGroceryItem)
  } catch (error) {
    logServiceError('Failed to fetch grocery items', 'groceryService', 'getGroceryItems', error as Error)
    throw error
  }
}

export async function getArchivedGroceryItems(): Promise<ArchivedGroceryItem[]> {
  const supabase = createClient()
  
  try {
    const { data, error } = await supabase
      .from('archived_items')
      .select('*')
      .eq('list_id', SHARED_LIST_ID)
      .order('archived_at', { ascending: false })

    if (error) {
      logServiceError('Failed to fetch archived grocery items', 'groceryService', 'getArchivedGroceryItems', error)
      throw error
    }

    return (data || []).map(mapDbRowToArchivedItem)
  } catch (error) {
    logServiceError('Failed to fetch archived grocery items', 'groceryService', 'getArchivedGroceryItems', error as Error)
    throw error
  }
}

export async function createGroceryItem(item: GroceryItemForm): Promise<GroceryItem> {
  const supabase = createClient()
  
  try {
    const { data, error } = await supabase
      .from('grocery_items')
      .insert([{
        name: item.name,
        store: item.store,
        checked: item.checked || false,
        list_id: SHARED_LIST_ID
      }])
      .select()
      .single()

    if (error) {
      logServiceError('Failed to create grocery item', 'groceryService', 'createGroceryItem', error)
      throw error
    }

    return mapDbRowToGroceryItem(data)
  } catch (error) {
    logServiceError('Failed to create grocery item', 'groceryService', 'createGroceryItem', error as Error)
    throw error
  }
}

export async function updateGroceryItem(id: string, updates: Partial<GroceryItemForm>): Promise<GroceryItem> {
  const supabase = createClient()
  
  try {
    const { data, error } = await supabase
      .from('grocery_items')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      logServiceError('Failed to update grocery item', 'groceryService', 'updateGroceryItem', error)
      throw error
    }

    return mapDbRowToGroceryItem(data)
  } catch (error) {
    logServiceError('Failed to update grocery item', 'groceryService', 'updateGroceryItem', error as Error)
    throw error
  }
}

export async function deleteGroceryItem(id: string): Promise<void> {
  const supabase = createClient()
  
  try {
    const { error } = await supabase
      .from('grocery_items')
      .delete()
      .eq('id', id)

    if (error) {
      logServiceError('Failed to delete grocery item', 'groceryService', 'deleteGroceryItem', error)
      throw error
    }
  } catch (error) {
    logServiceError('Failed to delete grocery item', 'groceryService', 'deleteGroceryItem', error as Error)
    throw error
  }
}

export async function archiveGroceryItem(item: GroceryItem): Promise<void> {
  const supabase = createClient()
  
  try {
    // First, add to archived_items
    const { error: archiveError } = await supabase
      .from('archived_items')
      .insert([{
        name: item.name,
        store: item.store,
        list_id: SHARED_LIST_ID
      }])

    if (archiveError) {
      logServiceError('Failed to archive grocery item', 'groceryService', 'archiveGroceryItem', archiveError)
      throw archiveError
    }

    // Then delete from grocery_items
    await deleteGroceryItem(item.id)
  } catch (error) {
    logServiceError('Failed to archive grocery item', 'groceryService', 'archiveGroceryItem', error as Error)
    throw error
  }
}