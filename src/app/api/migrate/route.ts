import { NextResponse } from 'next/server'
import { initializeMigrationTracking, runPendingMigrations, getAppliedMigrations } from '@/lib/supabase/migrations'
import { MIGRATION_REGISTRY } from '@/lib/supabase/migration-registry'
import { logApiError } from '@/lib/logger'

export async function POST(request: Request) {
  try {
    // Initialize migration tracking
    await initializeMigrationTracking()
    
    // Run pending migrations
    await runPendingMigrations(MIGRATION_REGISTRY)
    
    // Get applied migrations for response
    const appliedMigrations = await getAppliedMigrations()
    
    return NextResponse.json({ 
      success: true, 
      appliedMigrations: appliedMigrations.length,
      latest: appliedMigrations[appliedMigrations.length - 1]?.name || 'None'
    })
  } catch (error) {
    logApiError('Migration API failed', request, error as Error)
    return NextResponse.json({ 
      error: 'Migration failed', 
      message: (error as Error).message 
    }, { status: 500 })
  }
}

export async function GET() {
  try {
    // Get migration status without running migrations
    const appliedMigrations = await getAppliedMigrations()
    const totalMigrations = MIGRATION_REGISTRY.length
    const pendingMigrations = MIGRATION_REGISTRY.filter(
      migration => !appliedMigrations.some(applied => applied.id === migration.id)
    )
    
    return NextResponse.json({
      status: 'success',
      total: totalMigrations,
      applied: appliedMigrations.length,
      pending: pendingMigrations.length,
      appliedMigrations: appliedMigrations.map(m => ({
        id: m.id,
        name: m.name,
        version: m.version,
        appliedAt: m.applied_at
      })),
      pendingMigrations: pendingMigrations.map(m => ({
        id: m.id,
        name: m.name,
        version: m.version,
        description: m.description
      }))
    })
  } catch (error) {
    return NextResponse.json({ 
      error: 'Failed to get migration status',
      message: (error as Error).message 
    }, { status: 500 })
  }
} 