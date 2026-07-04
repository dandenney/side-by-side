'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { getRecipe } from '@/lib/supabase/recipes'
import { Recipe } from '@/types/recipe'
import { RecipeForm } from '@/components/RecipeForm'

export default function EditRecipePage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const id = params.id

  const [recipe, setRecipe] = useState<Recipe | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!loading && !user) router.push('/login')
  }, [user, loading, router])

  useEffect(() => {
    if (!user) return
    getRecipe(id)
      .then(setRecipe)
      .catch((error) => console.error('Error loading recipe:', error))
      .finally(() => setIsLoading(false))
  }, [user, id])

  if (loading || !user) return null

  return (
    <main className="antialiased bg-purple-50 min-h-dvh pb-24">
      <div className="max-w-md mx-auto p-4 space-y-4">
        <Link
          href={`/recipes/${id}`}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-purple-600 hover:underline"
        >
          <ArrowLeft className="size-4" />
          Back to recipe
        </Link>
        <h1 className="text-xl font-semibold text-purple-900">Edit recipe</h1>
        {isLoading ? (
          <p className="py-12 text-center text-sm text-gray-400">Loading…</p>
        ) : recipe ? (
          <RecipeForm recipe={recipe} />
        ) : (
          <p className="py-12 text-center text-sm text-gray-400">
            Recipe not found.
          </p>
        )}
      </div>
    </main>
  )
}
