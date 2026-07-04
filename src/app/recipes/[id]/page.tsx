'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  ThumbsUp,
  ThumbsDown,
  ExternalLink,
  Trash2,
  UtensilsCrossed,
  Pencil,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import {
  getRecipe,
  markRecipeTried,
  updateRecipe,
  deleteRecipe,
} from '@/lib/supabase/recipes'
import { Recipe, RecipeRating } from '@/types/recipe'

export default function RecipeDetailPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const id = params.id

  const [recipe, setRecipe] = useState<Recipe | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [notesDraft, setNotesDraft] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!loading && !user) router.push('/login')
  }, [user, loading, router])

  useEffect(() => {
    if (!user) return
    getRecipe(id)
      .then((r) => {
        setRecipe(r)
        setNotesDraft(r?.notes ?? '')
      })
      .catch((error) => console.error('Error loading recipe:', error))
      .finally(() => setIsLoading(false))
  }, [user, id])

  const handleMarkTried = async (rating: RecipeRating) => {
    if (!recipe) return
    setSaving(true)
    try {
      setRecipe(await markRecipeTried(recipe.id, rating))
    } catch (error) {
      console.error('Error marking recipe tried:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleSaveNotes = async () => {
    if (!recipe || notesDraft === (recipe.notes ?? '')) return
    setSaving(true)
    try {
      setRecipe(await updateRecipe(recipe.id, { notes: notesDraft }))
    } catch (error) {
      console.error('Error saving notes:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!recipe) return
    if (!confirm('Delete this recipe? This cannot be undone.')) return
    try {
      await deleteRecipe(recipe.id)
      router.push('/recipes')
    } catch (error) {
      console.error('Error deleting recipe:', error)
    }
  }

  if (loading || !user) return null

  if (isLoading) {
    return (
      <main className="bg-purple-50 min-h-dvh">
        <p className="py-12 text-center text-sm text-gray-400">Loading…</p>
      </main>
    )
  }

  if (!recipe) {
    return (
      <main className="bg-purple-50 min-h-dvh p-4">
        <BackLink />
        <p className="py-12 text-center text-sm text-gray-400">
          Recipe not found.
        </p>
      </main>
    )
  }

  return (
    <main className="antialiased bg-purple-50 min-h-dvh pb-24">
      <div className="max-w-md mx-auto p-4 space-y-5">
        <div className="flex items-center justify-between">
          <BackLink />
          <Link
            href={`/recipes/${recipe.id}/edit`}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-purple-600 hover:underline"
          >
            <Pencil className="size-4" />
            Edit
          </Link>
        </div>

        <div className="overflow-hidden rounded-2xl bg-white shadow-sm border border-gray-950/5">
          <div className="relative aspect-[4/3] bg-purple-100">
            {recipe.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={recipe.imageUrl}
                alt={recipe.title}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-purple-300">
                <UtensilsCrossed className="size-10" />
              </div>
            )}
          </div>

          <div className="space-y-4 p-4">
            <div>
              <h1 className="text-xl font-semibold text-purple-900">
                {recipe.title}
              </h1>
              {recipe.servings && (
                <p className="mt-1 text-sm text-gray-500">{recipe.servings}</p>
              )}
            </div>

            {recipe.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {recipe.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-purple-50 px-2.5 py-0.5 text-xs font-medium text-purple-600"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {recipe.sourceUrl && (
              <a
                href={recipe.sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-purple-600 hover:underline"
              >
                <ExternalLink className="size-4" />
                View source
              </a>
            )}
          </div>
        </div>

        {/* Stage / rating action area */}
        <StageAction recipe={recipe} saving={saving} onMarkTried={handleMarkTried} />

        {/* Ingredients */}
        {recipe.ingredients.length > 0 && (
          <Section title="Ingredients">
            <ul className="space-y-1.5">
              {recipe.ingredients.map((line, i) => (
                <li key={i} className="flex gap-2 text-sm text-gray-700">
                  <span className="text-purple-300">•</span>
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </Section>
        )}

        {/* Instructions */}
        {recipe.instructions.length > 0 && (
          <Section title="Instructions">
            <ol className="space-y-3">
              {recipe.instructions.map((step, i) => (
                <li key={i} className="flex gap-3 text-sm text-gray-700">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-purple-100 text-xs font-semibold text-purple-700">
                    {i + 1}
                  </span>
                  <span className="pt-0.5">{step}</span>
                </li>
              ))}
            </ol>
          </Section>
        )}

        {/* Notes */}
        <Section title="Notes">
          <textarea
            value={notesDraft}
            onChange={(e) => setNotesDraft(e.target.value)}
            onBlur={handleSaveNotes}
            placeholder="Add a note…"
            rows={3}
            className="w-full resize-y rounded-xl border border-gray-950/5 bg-white p-3 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-300"
          />
        </Section>

        <button
          onClick={handleDelete}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-rose-500 hover:underline"
        >
          <Trash2 className="size-4" />
          Delete recipe
        </button>
      </div>
    </main>
  )
}

function BackLink() {
  return (
    <Link
      href="/recipes"
      className="inline-flex items-center gap-1.5 text-sm font-medium text-purple-600 hover:underline"
    >
      <ArrowLeft className="size-4" />
      All recipes
    </Link>
  )
}

function Section({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="rounded-2xl bg-white p-4 shadow-sm border border-gray-950/5">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-purple-400">
        {title}
      </h2>
      {children}
    </section>
  )
}

function StageAction({
  recipe,
  saving,
  onMarkTried,
}: {
  recipe: Recipe
  saving: boolean
  onMarkTried: (rating: RecipeRating) => void
}) {
  if (recipe.status === 'tried') {
    const up = recipe.rating === 'up'
    return (
      <div className="flex items-center justify-center gap-2 rounded-2xl bg-white p-4 shadow-sm border border-gray-950/5">
        <span
          className={`flex size-8 items-center justify-center rounded-full text-white ${
            up ? 'bg-green-500' : 'bg-rose-500'
          }`}
        >
          {up ? <ThumbsUp className="size-4" /> : <ThumbsDown className="size-4" />}
        </span>
        <span className="text-sm text-gray-600">
          Tried
          {recipe.triedAt
            ? ` · ${recipe.triedAt.toLocaleDateString()}`
            : ''}
        </span>
      </div>
    )
  }

  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm border border-gray-950/5">
      <p className="mb-3 text-center text-sm font-medium text-gray-600">
        Made it? Rate it — this moves it to Tried.
      </p>
      <div className="flex gap-3">
        <button
          disabled={saving}
          onClick={() => onMarkTried('up')}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-green-500 py-2.5 text-sm font-medium text-white hover:bg-green-600 disabled:opacity-50"
        >
          <ThumbsUp className="size-4" />
          Thumbs up
        </button>
        <button
          disabled={saving}
          onClick={() => onMarkTried('down')}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-rose-500 py-2.5 text-sm font-medium text-white hover:bg-rose-600 disabled:opacity-50"
        >
          <ThumbsDown className="size-4" />
          Thumbs down
        </button>
      </div>
    </div>
  )
}
