'use client'

import { UrlList } from '@/components/UrlList'

export default function ReadingList() {
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
      />
    </main>
  )
} 