/**
 * Database migration management system
 * Handles tracking and execution of data migrations
 */

import { createClient } from './client'
import { logServiceError } from '@/lib/logger'

export interface Migration {
  id: string
  name: string
  description: string
  version: string
  timestamp: Date
  execute: (supabase: any) => Promise<void>
  rollback?: (supabase: any) => Promise<void>
  validate?: (supabase: any) => Promise<boolean>
}

export interface MigrationRecord {
  id: string
  name: string
  version: string
  applied_at: string
  checksum: string
}

/**
 * Initialize migration tracking table
 */
export async function initializeMigrationTracking() {
  const supabase = createClient()
  
  try {
    // Create migration tracking table if it doesn't exist
    const { error } = await supabase.rpc('create_migration_table')
    
    if (error && !error.message.includes('already exists')) {
      throw error
    }
  } catch (error) {
    logServiceError('Failed to initialize migration tracking', 'migrations', 'initializeMigrationTracking', error as Error)
    throw error
  }
}

/**
 * Get list of applied migrations
 */
export async function getAppliedMigrations(): Promise<MigrationRecord[]> {
  const supabase = createClient()
  
  try {
    const { data, error } = await supabase
      .from('_migrations')
      .select('*')
      .order('applied_at', { ascending: true })
    
    if (error) throw error
    
    return data || []
  } catch (error) {
    logServiceError('Failed to get applied migrations', 'migrations', 'getAppliedMigrations', error as Error)
    return []
  }
}

/**
 * Record a migration as applied
 */
export async function recordMigration(migration: Migration): Promise<void> {
  const supabase = createClient()
  
  try {
    const checksum = await generateMigrationChecksum(migration)
    
    const { error } = await supabase
      .from('_migrations')
      .insert({
        id: migration.id,
        name: migration.name,
        version: migration.version,
        applied_at: new Date().toISOString(),
        checksum
      })
    
    if (error) throw error
  } catch (error) {
    logServiceError('Failed to record migration', 'migrations', 'recordMigration', error as Error, {
      migrationId: migration.id,
      migrationName: migration.name
    })
    throw error
  }
}

/**
 * Remove migration record (for rollbacks)
 */
export async function removeMigrationRecord(migrationId: string): Promise<void> {
  const supabase = createClient()
  
  try {
    const { error } = await supabase
      .from('_migrations')
      .delete()
      .eq('id', migrationId)
    
    if (error) throw error
  } catch (error) {
    logServiceError('Failed to remove migration record', 'migrations', 'removeMigrationRecord', error as Error, {
      migrationId
    })
    throw error
  }
}

/**
 * Execute a migration safely
 */
export async function executeMigration(migration: Migration): Promise<boolean> {
  const supabase = createClient()
  
  try {
    // Check if migration is already applied
    const applied = await getAppliedMigrations()
    const isApplied = applied.some(m => m.id === migration.id)
    
    if (isApplied) {
      return true // Already applied
    }
    
    // Validate migration integrity
    if (migration.validate) {
      const isValid = await migration.validate(supabase)
      if (!isValid) {
        throw new Error(`Migration ${migration.id} failed validation`)
      }
    }
    
    // Execute migration
    await migration.execute(supabase)
    
    // Record successful migration
    await recordMigration(migration)
    
    return true
  } catch (error) {
    logServiceError('Migration execution failed', 'migrations', 'executeMigration', error as Error, {
      migrationId: migration.id,
      migrationName: migration.name
    })
    
    // Attempt rollback if available
    if (migration.rollback) {
      try {
        await migration.rollback(supabase)
      } catch (rollbackError) {
        logServiceError('Migration rollback failed', 'migrations', 'executeMigration.rollback', rollbackError as Error, {
          migrationId: migration.id,
          originalError: (error as Error).message
        })
      }
    }
    
    throw error
  }
}

/**
 * Rollback a migration
 */
export async function rollbackMigration(migration: Migration): Promise<boolean> {
  if (!migration.rollback) {
    throw new Error(`Migration ${migration.id} does not support rollback`)
  }
  
  const supabase = createClient()
  
  try {
    // Execute rollback
    await migration.rollback(supabase)
    
    // Remove migration record
    await removeMigrationRecord(migration.id)
    
    return true
  } catch (error) {
    logServiceError('Migration rollback failed', 'migrations', 'rollbackMigration', error as Error, {
      migrationId: migration.id,
      migrationName: migration.name
    })
    throw error
  }
}

/**
 * Run all pending migrations
 */
export async function runPendingMigrations(migrations: Migration[]): Promise<void> {
  const applied = await getAppliedMigrations()
  const appliedIds = new Set(applied.map(m => m.id))
  
  const pending = migrations.filter(m => !appliedIds.has(m.id))
  
  for (const migration of pending) {
    await executeMigration(migration)
  }
}

/**
 * Generate checksum for migration integrity verification
 */
async function generateMigrationChecksum(migration: Migration): Promise<string> {
  const migrationString = JSON.stringify({
    id: migration.id,
    name: migration.name,
    version: migration.version,
    description: migration.description
  })
  
  // Simple checksum using built-in crypto if available
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const encoder = new TextEncoder()
    const data = encoder.encode(migrationString)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  }
  
  // Fallback simple hash
  let hash = 0
  for (let i = 0; i < migrationString.length; i++) {
    const char = migrationString.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32-bit integer
  }
  return hash.toString(16)
}