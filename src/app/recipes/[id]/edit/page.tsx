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
    <main data-section="recipes" className="min-h-dvh bg-wash pb-32">
      <div className="mx-auto max-w-md space-y-4 p-4 md:max-w-2xl md:pt-24">
        <Link
          href={`/recipes/${id}`}
          className="inline-flex min-h-[44px] items-center gap-1.5 text-sm font-medium text-hue hover:underline"
        >
          <ArrowLeft className="size-4" />
          Back to recipe
        </Link>
        <h1 className="font-display text-2xl font-bold text-ink">Edit recipe</h1>
        {isLoading ? (
          <p className="py-12 text-center text-sm text-ink-faint">Loading…</p>
        ) : recipe ? (
          <RecipeForm recipe={recipe} />
        ) : (
          <p className="py-12 text-center text-sm text-ink-faint">
            Recipe not found.
          </p>
        )}
      </div>
    </main>
  )
}
