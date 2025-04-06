'use client'

import { UrlList } from '@/components/UrlList'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

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
    <main className="h-[100dvh]">
      <UrlList
        title="Shares"
        gradientFrom="from-purple-50"
        gradientTo="to-purple-100"
        textColor="text-purple-900"
        titleColor="text-purple-900"
        accentColor="text-purple-500"
        iconColor="text-purple-500"
        buttonGradientFrom="from-purple-500"
        buttonGradientTo="to-purple-600"
        buttonAccentColor="text-purple-500"
        listType="shared"
        listId={user.id}
      />
    </main>
  )
} 