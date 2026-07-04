'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Search, UtensilsCrossed, ChefHat, Plus } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { getRecipes } from '@/lib/supabase/recipes'
import { filterRecipes } from '@/lib/recipe-search'
import { Recipe, RecipeStatus, RECIPE_TAGS } from '@/types/recipe'
import { RecipeCard } from '@/components/RecipeCard'

export default function RecipesPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [stage, setStage] = useState<RecipeStatus>('to_try')
  const [query, setQuery] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])

  useEffect(() => {
    if (!loading && !user) router.push('/login')
  }, [user, loading, router])

  useEffect(() => {
    if (!user) return
    getRecipes()
      .then(setRecipes)
      .catch((error) => console.error('Error loading recipes:', error))
      .finally(() => setIsLoading(false))
  }, [user])

  const visible = useMemo(
    () => filterRecipes(recipes, { status: stage, query, tags: selectedTags }),
    [recipes, stage, query, selectedTags]
  )

  const toggleTag = (tag: string) =>
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    )

  if (loading || !user) return null

  return (
    <main className="antialiased bg-purple-50 min-h-dvh pb-24">
      <div className="p-4 space-y-4 max-w-md mx-auto">
        {/* Stage toggle */}
        <div className="flex justify-center">
          <div className="flex rounded-2xl bg-white/80 p-1 gap-1 shadow-sm border border-gray-950/5">
            {(
              [
                { key: 'to_try', label: 'To Try', icon: UtensilsCrossed },
                { key: 'tried', label: 'Tried', icon: ChefHat },
              ] as const
            ).map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setStage(key)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium ${
                  stage === key
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-400'
                }`}
              >
                <Icon className="size-4" />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search title, ingredients, notes…"
            className="w-full rounded-2xl border border-gray-950/5 bg-white py-2.5 pl-9 pr-3 text-sm shadow-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-300"
          />
        </div>

        {/* Tag filter chips */}
        <div className="flex flex-wrap gap-2">
          {RECIPE_TAGS.map((tag) => {
            const active = selectedTags.includes(tag)
            return (
              <button
                key={tag}
                onClick={() => toggleTag(tag)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  active
                    ? 'bg-purple-600 text-white'
                    : 'bg-white text-purple-600 border border-purple-100'
                }`}
              >
                {tag}
              </button>
            )
          })}
        </div>

        {/* Results */}
        {isLoading ? (
          <p className="py-12 text-center text-sm text-gray-400">Loading…</p>
        ) : visible.length === 0 ? (
          <p className="py-12 text-center text-sm text-gray-400">
            {recipes.length === 0
              ? 'No recipes yet.'
              : 'No recipes match these filters.'}
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {visible.map((recipe) => (
              <RecipeCard key={recipe.id} recipe={recipe} />
            ))}
          </div>
        )}
      </div>

      <Link
        href="/recipes/new"
        aria-label="Add a recipe"
        className="fixed bottom-6 right-6 flex size-14 items-center justify-center rounded-full bg-purple-600 text-white shadow-lg hover:bg-purple-700"
      >
        <Plus className="size-6" />
      </Link>
    </main>
  )
}
