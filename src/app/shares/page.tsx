'use client'

import { UrlList } from '@/components/UrlList'
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
    <main className="bg-gray-100 min-h-[100dvh] px-4">
      <UrlList
        title="Shares"
        textColor="text-purple-900"
        titleColor="text-purple-900"
        accentColor="text-purple-500"
        iconColor="text-purple-500"
        buttonGradientFrom="from-purple-500"
        buttonGradientTo="to-purple-600"
        buttonAccentColor="text-purple-500"
        listType="shared"
        listId={SHARED_LIST_ID}
      />
    </main>
  )
} 