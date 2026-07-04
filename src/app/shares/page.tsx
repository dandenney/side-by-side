'use client'

import { UrlList } from '@/components/UrlList'
import PageHeader from '@/components/PageHeader'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { SHARED_LIST_ID } from '@/lib/constants'

export default function SharesList() {
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
    <main data-section="shares" className="min-h-[100dvh] bg-wash px-4">
      <PageHeader title="Shares" note="Movies, links, and finds for each other" />
      <UrlList listType="shared" listId={SHARED_LIST_ID} />
    </main>
  )
}
