'use client'

import { useEffect } from 'react'
import { migrateToSharedList } from '@/lib/supabase/migrate'
import { useAuth } from '@/contexts/AuthContext'

export default function Migration() {
  const { user } = useAuth()

  useEffect(() => {
    if (user) {
      migrateToSharedList().catch(console.error)
    }
  }, [user])

  return null
} 