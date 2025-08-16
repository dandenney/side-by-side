'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { initializeMigrationTracking, runPendingMigrations } from '@/lib/supabase/migrations'
import { MIGRATION_REGISTRY } from '@/lib/supabase/migration-registry'
import { logComponentError } from '@/lib/logger'

export default function Migration() {
  const { user } = useAuth()
  const [migrationStatus, setMigrationStatus] = useState<'idle' | 'running' | 'completed' | 'error'>('idle')

  useEffect(() => {
    if (user && migrationStatus === 'idle') {
      runMigrations()
    }
  }, [user, migrationStatus])

  const runMigrations = async () => {
    try {
      setMigrationStatus('running')
      
      // Initialize migration tracking
      await initializeMigrationTracking()
      
      // Run pending migrations
      await runPendingMigrations(MIGRATION_REGISTRY)
      
      setMigrationStatus('completed')
    } catch (error) {
      logComponentError('Migration failed', 'Migration', error as Error)
      setMigrationStatus('error')
    }
  }

  // Show migration status in development
  if (process.env.NODE_ENV === 'development' && migrationStatus !== 'idle' && migrationStatus !== 'completed') {
    return (
      <div className="fixed top-4 right-4 bg-blue-100 border border-blue-300 rounded p-2 text-sm z-50">
        <div className="flex items-center gap-2">
          {migrationStatus === 'running' && (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span>Running migrations...</span>
            </>
          )}
          {migrationStatus === 'error' && (
            <>
              <div className="w-4 h-4 bg-red-500 rounded-full"></div>
              <span>Migration failed</span>
            </>
          )}
        </div>
      </div>
    )
  }

  return null
} 