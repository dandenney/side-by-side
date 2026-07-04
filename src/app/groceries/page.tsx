'use client'

import { GroceryList } from '@/components/GroceryList'
import PageHeader from '@/components/PageHeader'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function GroceriesPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  if (loading || !user) {
    return null
  }

  return (
    <main data-section="groceries" className="min-h-[100dvh] bg-wash px-4">
      <PageHeader title="Groceries" note="What are we out of?" />
      <GroceryList />
    </main>
  )
}
