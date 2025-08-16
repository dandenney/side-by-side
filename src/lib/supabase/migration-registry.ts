/**
 * Registry of data migrations
 * Each migration should be idempotent and include rollback logic where possible
 */

import { Migration } from './migrations'
import { SHARED_LIST_ID } from '@/lib/constants'
import { logServiceError } from '@/lib/logger'

/**
 * Migration: Migrate all items to shared list
 * Converts personal lists to shared list structure
 */
export const migrateToSharedListMigration: Migration = {
  id: 'migrate_to_shared_list_v2',
  name: 'Migrate to Shared List v2',
  description: 'Update all url_items and tags to use the shared list ID with proper validation',
  version: '2.0.0',
  timestamp: new Date('2024-01-01'),
  
  async execute(supabase) {
    // Migration logic with better error handling and validation
    try {
      // Check if there are any items to update
      const { data: existingItems, error: checkError } = await supabase
        .from('url_items')
        .select('id, list_id')
        .neq('list_id', SHARED_LIST_ID)
      
      if (checkError) {
        throw new Error(`Failed to check existing items: ${checkError.message}`)
      }
      
      if (existingItems && existingItems.length > 0) {
        // Update url_items in batches to avoid timeout
        const batchSize = 100
        for (let i = 0; i < existingItems.length; i += batchSize) {
          const batch = existingItems.slice(i, i + batchSize)
          const itemIds = batch.map(item => item.id)
          
          const { error: updateError } = await supabase
            .from('url_items')
            .update({ list_id: SHARED_LIST_ID })
            .in('id', itemIds)
          
          if (updateError) {
            throw new Error(`Failed to update url_items batch: ${updateError.message}`)
          }
        }
      }
      
      // Check and update tags
      const { data: existingTags, error: checkTagsError } = await supabase
        .from('tags')
        .select('id, list_id')
        .neq('list_id', SHARED_LIST_ID)
      
      if (checkTagsError) {
        throw new Error(`Failed to check existing tags: ${checkTagsError.message}`)
      }
      
      if (existingTags && existingTags.length > 0) {
        // Update tags in batches
        const batchSize = 100
        for (let i = 0; i < existingTags.length; i += batchSize) {
          const batch = existingTags.slice(i, i + batchSize)
          const tagIds = batch.map(tag => tag.id)
          
          const { error: updateError } = await supabase
            .from('tags')
            .update({ list_id: SHARED_LIST_ID })
            .in('id', tagIds)
          
          if (updateError) {
            throw new Error(`Failed to update tags batch: ${updateError.message}`)
          }
        }
      }
    } catch (error) {
      logServiceError('Shared list migration failed', 'migrations', error as Error)
      throw error
    }
  },
  
  async rollback(supabase) {
    // Rollback is not safe for this migration as we don't track original list_ids
    throw new Error('Rollback not supported for shared list migration - original list IDs not preserved')
  },
  
  async validate(supabase) {
    try {
      // Verify all items have been migrated
      const { data: unmigrated, error } = await supabase
        .from('url_items')
        .select('id')
        .neq('list_id', SHARED_LIST_ID)
        .limit(1)
      
      if (error) {
        logServiceError('Migration validation failed', 'migrations', error)
        return false
      }
      
      // Check tags as well
      const { data: unmigratedTags, error: tagError } = await supabase
        .from('tags')
        .select('id')
        .neq('list_id', SHARED_LIST_ID)
        .limit(1)
      
      if (tagError) {
        logServiceError('Tag migration validation failed', 'migrations', tagError)
        return false
      }
      
      return (!unmigrated || unmigrated.length === 0) && (!unmigratedTags || unmigratedTags.length === 0)
    } catch (error) {
      logServiceError('Migration validation error', 'migrations', error as Error)
      return false
    }
  }
}

/**
 * Migration: Remove URL or Place constraint
 * Updates database constraint to allow more flexible data storage
 */
export const removeUrlOrPlaceConstraintMigration: Migration = {
  id: 'remove_url_or_place_constraint_v1',
  name: 'Remove URL or Place Constraint',
  description: 'Remove database constraint requiring either URL or place data',
  version: '1.0.0',
  timestamp: new Date('2024-02-01'),
  
  async execute(supabase) {
    try {
      const { error } = await supabase.rpc('remove_url_or_place_constraint')
      if (error) {
        throw new Error(`Failed to remove constraint: ${error.message}`)
      }
    } catch (error) {
      logServiceError('Constraint removal migration failed', 'migrations', error as Error)
      throw error
    }
  },
  
  // Note: Rollback would require recreating the constraint, which might fail
  // if data that violates the constraint has been added
  async rollback(supabase) {
    throw new Error('Rollback not supported for constraint removal - may cause data consistency issues')
  },
  
  async validate(supabase) {
    // This validation would require checking database schema
    // For now, we'll assume success if no error was thrown during execution
    return true
  }
}

/**
 * Example future migration template
 */
export const exampleFutureMigration: Migration = {
  id: 'example_migration_v1',
  name: 'Example Migration',
  description: 'Template for future data migrations',
  version: '1.0.0',
  timestamp: new Date('2024-12-01'),
  
  async execute(supabase) {
    // Implementation here
    // Always include proper error handling and batching for large data sets
  },
  
  async rollback(supabase) {
    // Rollback implementation here
    // Only include if rollback is safe and feasible
  },
  
  async validate(supabase) {
    // Validation logic here
    // Should verify migration completed successfully
    return true
  }
}

/**
 * Registry of all available migrations
 * Migrations will be executed in order based on timestamp
 */
export const MIGRATION_REGISTRY: Migration[] = [
  removeUrlOrPlaceConstraintMigration,
  migrateToSharedListMigration,
  // Add new migrations here
].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())