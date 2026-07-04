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
import { RecipeImage } from '@/components/RecipeImage'

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
      <main data-section="recipes" className="min-h-dvh bg-wash">
        <p className="py-12 text-center text-sm text-ink-faint">Loading…</p>
      </main>
    )
  }

  if (!recipe) {
    return (
      <main data-section="recipes" className="min-h-dvh bg-wash p-4">
        <BackLink />
        <p className="py-12 text-center text-sm text-ink-faint">
          Recipe not found.
        </p>
      </main>
    )
  }

  return (
    <main data-section="recipes" className="min-h-dvh bg-wash pb-32">
      <div className="mx-auto max-w-md space-y-5 p-4 md:max-w-2xl md:pt-24 lg:max-w-4xl">
        <div className="flex items-center justify-between">
          <BackLink />
          <Link
            href={`/recipes/${recipe.id}/edit`}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-hue hover:underline"
          >
            <Pencil className="size-4" />
            Edit
          </Link>
        </div>

        <div className="space-y-5 lg:grid lg:grid-cols-2 lg:items-start lg:gap-6 lg:space-y-0">
        <div className="space-y-5 lg:sticky lg:top-24">
        <div className="card overflow-hidden">
          <RecipeImage
            src={recipe.imageUrl}
            alt={recipe.title}
            className="aspect-[4/3]"
          />

          <div className="space-y-4 p-4">
            <div>
              <h1 className="font-display text-2xl font-bold text-ink">
                {recipe.title}
              </h1>
              {recipe.servings && (
                <p className="mt-1 text-sm text-ink-soft">{recipe.servings}</p>
              )}
            </div>

            {recipe.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {recipe.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-tint px-2.5 py-0.5 text-xs font-medium text-tint-ink"
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
                className="inline-flex items-center gap-1.5 text-sm font-medium text-hue hover:underline"
              >
                <ExternalLink className="size-4" />
                View source
              </a>
            )}
          </div>
        </div>

        {/* Stage / rating action area */}
        <StageAction recipe={recipe} saving={saving} onMarkTried={handleMarkTried} />
        </div>

        <div className="space-y-5">
        {/* Ingredients */}
        {recipe.ingredients.length > 0 && (
          <Section title="Ingredients">
            <ul className="space-y-1.5">
              {recipe.ingredients.map((line, i) => (
                <li key={i} className="flex gap-2 text-[15px] text-ink">
                  <span className="text-hue/60">•</span>
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
                <li key={i} className="flex gap-3 text-[15px] text-ink">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-tint text-xs font-bold text-tint-ink">
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
            className="field resize-y"
          />
        </Section>

        <button
          onClick={handleDelete}
          className="inline-flex min-h-[44px] items-center gap-1.5 text-sm font-medium text-rose-600 hover:underline"
        >
          <Trash2 className="size-4" />
          Delete recipe
        </button>
        </div>
        </div>
      </div>
    </main>
  )
}

function BackLink() {
  return (
    <Link
      href="/recipes"
      className="inline-flex min-h-[44px] items-center gap-1.5 text-sm font-medium text-hue hover:underline"
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
    <section className="card p-4">
      <h2 className="mb-3 text-xs font-bold uppercase tracking-wide text-hue">
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
      <div className="card flex items-center justify-center gap-2 p-4">
        <span
          className={`flex size-8 items-center justify-center rounded-full text-white ${
            up ? 'bg-emerald-600' : 'bg-rose-600'
          }`}
        >
          {up ? <ThumbsUp className="size-4" /> : <ThumbsDown className="size-4" />}
        </span>
        <span className="text-sm text-ink-soft">
          Tried
          {recipe.triedAt
            ? ` · ${recipe.triedAt.toLocaleDateString()}`
            : ''}
        </span>
      </div>
    )
  }

  return (
    <div className="card p-4">
      <p className="mb-3 text-center text-sm font-medium text-ink-soft">
        Made it? Rate it and it moves to Tried.
      </p>
      <div className="flex gap-3">
        <button
          disabled={saving}
          onClick={() => onMarkTried('up')}
          className="flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-full bg-emerald-600 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          <ThumbsUp className="size-4" />
          Thumbs up
        </button>
        <button
          disabled={saving}
          onClick={() => onMarkTried('down')}
          className="flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-full bg-rose-600 py-2.5 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-50"
        >
          <ThumbsDown className="size-4" />
          Thumbs down
        </button>
      </div>
    </div>
  )
}
