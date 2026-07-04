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
import PageHeader from '@/components/PageHeader'

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
    <main data-section="recipes" className="min-h-dvh bg-wash px-4 pb-32">
      <PageHeader title="Recipes" note="To try, and tried and true" />

      <div className="mx-auto w-full max-w-md space-y-4 md:max-w-2xl lg:max-w-4xl">
        {/* Stage toggle */}
        <div className="flex rounded-full bg-surface-2 p-1">
          {(
            [
              { key: 'to_try', label: 'To Try', icon: UtensilsCrossed },
              { key: 'tried', label: 'Tried', icon: ChefHat },
            ] as const
          ).map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setStage(key)}
              aria-pressed={stage === key}
              className={`flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-full px-4 py-2 text-sm transition-colors duration-150 ${
                stage === key
                  ? 'bg-tint font-semibold text-tint-ink'
                  : 'font-medium text-ink-faint hover:text-ink-soft'
              }`}
            >
              <Icon className="size-4" />
              {label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-faint" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search title, ingredients, notes…"
            className="field pl-10"
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
                aria-pressed={active}
                className={`min-h-[36px] rounded-full px-3.5 py-1 text-sm transition-colors duration-150 ${
                  active
                    ? 'bg-hue-strong font-semibold text-on-hue'
                    : 'border border-line bg-surface font-medium text-ink-soft hover:text-ink'
                }`}
              >
                {tag}
              </button>
            )
          })}
        </div>

        {/* Results */}
        {isLoading ? (
          <div
            className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 lg:grid-cols-4"
            role="status"
            aria-live="polite"
            aria-label="Loading recipes"
          >
            {[...Array(6)].map((_, i) => (
              <div key={i} className="card animate-pulse overflow-hidden">
                <div className="aspect-square bg-surface-2" />
                <div className="space-y-2 p-3">
                  <div className="h-4 w-4/5 rounded-full bg-surface-2" />
                  <div className="h-3 w-2/5 rounded-full bg-surface-2" />
                </div>
              </div>
            ))}
          </div>
        ) : visible.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-16 text-center">
            <div className="flex size-16 items-center justify-center rounded-full bg-tint">
              <UtensilsCrossed className="size-7 text-tint-ink" />
            </div>
            <div className="space-y-1">
              <p className="font-display text-lg font-semibold text-ink">
                {recipes.length === 0 ? 'No recipes yet' : 'Nothing matches'}
              </p>
              <p className="text-sm text-ink-soft">
                {recipes.length === 0
                  ? 'Paste a link or add one by hand, then cook your way through.'
                  : 'Try loosening the search or the tags.'}
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 lg:grid-cols-4">
            {visible.map((recipe) => (
              <RecipeCard key={recipe.id} recipe={recipe} />
            ))}
          </div>
        )}
      </div>

      <Link
        href="/recipes/new"
        aria-label="Add a recipe"
        className="fixed bottom-24 right-4 z-30 flex size-14 items-center justify-center rounded-full bg-hue-strong text-on-hue shadow-pop md:bottom-8 md:right-8"
      >
        <Plus className="size-6" />
      </Link>
    </main>
  )
}
