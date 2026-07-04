'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { RecipeForm } from '@/components/RecipeForm'

export default function NewRecipePage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) router.push('/login')
  }, [user, loading, router])

  if (loading || !user) return null

  return (
    <main data-section="recipes" className="min-h-dvh bg-wash pb-32">
      <div className="mx-auto max-w-md space-y-4 p-4 md:max-w-2xl md:pt-24">
        <Link
          href="/recipes"
          className="inline-flex min-h-[44px] items-center gap-1.5 text-sm font-medium text-hue hover:underline"
        >
          <ArrowLeft className="size-4" />
          All recipes
        </Link>
        <h1 className="font-display text-2xl font-bold text-ink">Add a recipe</h1>
        <RecipeForm />
      </div>
    </main>
  )
}
