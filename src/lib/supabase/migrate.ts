/**
 * Legacy migration functions - now deprecated in favor of the new migration system
 * These are kept for backward compatibility but should not be used for new migrations
 */

import { createClient } from './client'
import { SHARED_LIST_ID } from '@/lib/constants'
import { logServiceError } from '@/lib/logger'

/**
 * @deprecated Use the new migration system in migration-registry.ts instead
 */
export async function removeUrlOrPlaceConstraint() {
  const supabase = createClient()

  try {
    const { error } = await supabase.rpc('remove_url_or_place_constraint')
    if (error) {
      logServiceError('Error removing constraint', 'migrate', 'removeUrlOrPlaceConstraint', new Error(error.message))
      throw error
    }
  } catch (error) {
    logServiceError('Error in removing constraint', 'migrate', 'removeUrlOrPlaceConstraint', error as Error)
    throw error
  }
}

/**
 * @deprecated Use migrateToSharedListMigration from migration-registry.ts instead
 */
export async function migrateToSharedList() {
  const supabase = createClient()

  try {
    // First, check if there are any items to update
    const { data: existingItems, error: checkError } = await supabase
      .from('url_items')
      .select('id, list_id')
      .neq('list_id', SHARED_LIST_ID)

    if (checkError) {
      logServiceError('Error checking existing items', 'migrate', 'migrateToSharedList', new Error(checkError.message))
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
        logServiceError('Error updating url_items', 'migrate', 'migrateToSharedList', new Error(urlItemsError.message))
        throw urlItemsError
      }
    }

    // Check if there are any tags to update
    const { data: existingTags, error: checkTagsError } = await supabase
      .from('tags')
      .select('id, list_id')
      .neq('list_id', SHARED_LIST_ID)

    if (checkTagsError) {
      logServiceError('Error checking existing tags', 'migrate', 'migrateToSharedList', new Error(checkTagsError.message))
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
        logServiceError('Error updating tags', 'migrate', 'migrateToSharedList', new Error(tagsError.message))
        throw tagsError
      }
    }

  } catch (error) {
    logServiceError('Error in migration', 'migrate', 'migrateToSharedList', error as Error)
    throw error
  }
} 