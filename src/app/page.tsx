'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import UpcomingList from '@/components/UpcomingList'
import PageHeader from '@/components/PageHeader'

export default function HomePage() {
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
    <main data-section="upcoming" className="min-h-[100dvh] bg-wash px-4">
      <PageHeader title="Upcoming" note="Things we're looking forward to" />
      <UpcomingList />
    </main>
  )
}
