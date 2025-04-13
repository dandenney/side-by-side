import { createClient } from './client'
import { SHARED_LIST_ID } from '@/lib/constants'

export async function removeUrlOrPlaceConstraint() {
  const supabase = createClient()

  try {
    const { error } = await supabase.rpc('remove_url_or_place_constraint')
    if (error) {
      console.error('Error removing constraint:', error)
      throw error
    }
  } catch (error) {
    console.error('Error in removing constraint:', error)
    throw error
  }
}

export async function migrateToSharedList() {
  const supabase = createClient()

  try {
    // First, check if there are any items to update
    const { data: existingItems, error: checkError } = await supabase
      .from('url_items')
      .select('id, list_id')
      .neq('list_id', SHARED_LIST_ID)

    if (checkError) {
      console.error('Error checking existing items:', checkError)
      throw checkError
    }

    if (existingItems && existingItems.length > 0) {
      // Update all url_items to use the shared list ID
      const { data: urlItemsData, error: urlItemsError } = await supabase
        .from('url_items')
        .update({ list_id: SHARED_LIST_ID })
        .neq('list_id', SHARED_LIST_ID)
        .select()

      if (urlItemsError) {
        console.error('Error updating url_items:', urlItemsError)
        throw urlItemsError
      }
    }

    // Check if there are any tags to update
    const { data: existingTags, error: checkTagsError } = await supabase
      .from('tags')
      .select('id, list_id')
      .neq('list_id', SHARED_LIST_ID)

    if (checkTagsError) {
      console.error('Error checking existing tags:', checkTagsError)
      throw checkTagsError
    }

    if (existingTags && existingTags.length > 0) {
      // Update all tags to use the shared list ID
      const { data: tagsData, error: tagsError } = await supabase
        .from('tags')
        .update({ list_id: SHARED_LIST_ID })
        .neq('list_id', SHARED_LIST_ID)
        .select()

      if (tagsError) {
        console.error('Error updating tags:', tagsError)
        throw tagsError
      }
    }

  } catch (error) {
    console.error('Error in migration:', error)
    throw error
  }
} 