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
    <main className="antialiased bg-purple-50 min-h-dvh pb-24">
      <div className="max-w-md mx-auto p-4 space-y-4">
        <Link
          href="/recipes"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-purple-600 hover:underline"
        >
          <ArrowLeft className="size-4" />
          All recipes
        </Link>
        <h1 className="text-xl font-semibold text-purple-900">Add a recipe</h1>
        <RecipeForm />
      </div>
    </main>
  )
}
