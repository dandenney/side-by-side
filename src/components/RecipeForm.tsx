'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Link2, Loader2 } from 'lucide-react'
import {
  createRecipe,
  updateRecipe,
  getRecipeBySourceUrl,
} from '@/lib/supabase/recipes'
import { Recipe, RECIPE_TAGS } from '@/types/recipe'
import { RecipeImage } from '@/components/RecipeImage'

const linesToText = (lines: string[]) => lines.join('\n')
const textToLines = (text: string) =>
  text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)

export function RecipeForm({ recipe }: { recipe?: Recipe }) {
  const router = useRouter()
  const isEdit = Boolean(recipe)

  const [url, setUrl] = useState('')
  const [fetching, setFetching] = useState(false)
  const [fetchError, setFetchError] = useState<string | null>(null)

  const [title, setTitle] = useState(recipe?.title ?? '')
  const [imageUrl, setImageUrl] = useState(recipe?.imageUrl ?? '')
  const [sourceUrl, setSourceUrl] = useState(recipe?.sourceUrl ?? '')
  const [servings, setServings] = useState(recipe?.servings ?? '')
  const [tags, setTags] = useState<string[]>(recipe?.tags ?? [])
  const [ingredients, setIngredients] = useState(
    linesToText(recipe?.ingredients ?? [])
  )
  const [instructions, setInstructions] = useState(
    linesToText(recipe?.instructions ?? [])
  )

  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  // An existing recipe sharing this source URL (create mode only).
  const [duplicate, setDuplicate] = useState<Recipe | null>(null)

  const handleFetch = async () => {
    if (!url.trim()) return
    setFetching(true)
    setFetchError(null)
    setDuplicate(null)
    try {
      const res = await fetch(`/api/recipe-preview?url=${encodeURIComponent(url.trim())}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Could not read that URL')

      setTitle(data.title ?? '')
      setIngredients(linesToText(data.ingredients ?? []))
      setInstructions(linesToText(data.instructions ?? []))
      setServings(data.servings ?? '')
      setImageUrl(data.imageUrl ?? '')
      const resolvedSource = data.sourceUrl ?? url.trim()
      setSourceUrl(resolvedSource)

      // Warn early if we've already added this source.
      const existing = await getRecipeBySourceUrl(resolvedSource)
      if (existing) setDuplicate(existing)
    } catch (err) {
      setFetchError(err instanceof Error ? err.message : 'Could not read that URL')
    } finally {
      setFetching(false)
    }
  }

  const toggleTag = (tag: string) =>
    setTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) {
      setSaveError('Title is required')
      return
    }
    setSaving(true)
    setSaveError(null)

    const trimmedSource = sourceUrl.trim()
    const payload = {
      title: title.trim(),
      ingredients: textToLines(ingredients),
      instructions: textToLines(instructions),
      servings: servings.trim() || undefined,
      sourceUrl: trimmedSource || undefined,
      imageUrl: imageUrl.trim() || undefined,
      tags,
    }

    try {
      // Block duplicate adds by source URL (create mode only).
      if (!isEdit && trimmedSource) {
        const existing = await getRecipeBySourceUrl(trimmedSource)
        if (existing) {
          setDuplicate(existing)
          setSaving(false)
          return
        }
      }

      const saved =
        isEdit && recipe
          ? await updateRecipe(recipe.id, payload)
          : await createRecipe(payload)
      router.push(`/recipes/${saved.id}`)
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save recipe')
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* URL-first prefill (add mode only) */}
      {!isEdit && (
        <div className="card p-4">
          <label className="mb-2 block text-sm font-medium text-ink-soft">
            Paste a recipe URL to autofill
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Link2 className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-faint" />
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://recime.app/p/…"
                className="field pl-9 text-sm"
              />
            </div>
            <button
              type="button"
              onClick={handleFetch}
              disabled={fetching || !url.trim()}
              className="btn-primary shrink-0 px-4 text-sm disabled:opacity-50"
            >
              {fetching && <Loader2 className="size-4 animate-spin" />}
              Autofill
            </button>
          </div>
          {fetchError && (
            <p className="mt-2 text-sm font-medium text-rose-600">{fetchError}</p>
          )}
          <p className="mt-2 text-xs text-ink-faint">
            Or fill the fields in manually below.
          </p>
        </div>
      )}

      <Field label="Title">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className={inputClass}
          required
        />
      </Field>

      {imageUrl && (
        <div className="card overflow-hidden">
          <RecipeImage src={imageUrl} alt={title} className="aspect-[4/3]" />
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Field label="Servings">
          <input
            type="text"
            value={servings}
            onChange={(e) => setServings(e.target.value)}
            placeholder="4"
            className={inputClass}
          />
        </Field>
        <Field label="Source URL">
          <input
            type="url"
            value={sourceUrl}
            onChange={(e) => {
              setSourceUrl(e.target.value)
              setDuplicate(null)
            }}
            placeholder="https://…"
            className={inputClass}
          />
        </Field>
      </div>

      <Field label="Tags">
        <div className="flex flex-wrap gap-2">
          {RECIPE_TAGS.map((tag) => {
            const active = tags.includes(tag)
            return (
              <button
                key={tag}
                type="button"
                onClick={() => toggleTag(tag)}
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
      </Field>

      <Field label="Ingredients" hint="One per line">
        <textarea
          value={ingredients}
          onChange={(e) => setIngredients(e.target.value)}
          rows={6}
          placeholder={'2 tbsp olive oil\n8 oz crimini mushrooms'}
          className={inputClass}
        />
      </Field>

      <Field label="Instructions" hint="One step per line">
        <textarea
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          rows={8}
          className={inputClass}
        />
      </Field>

      {duplicate && (
        <div className="rounded-xl border border-tint bg-wash p-3 text-sm text-tint-ink">
          This URL is already saved as{' '}
          <Link
            href={`/recipes/${duplicate.id}`}
            className="font-medium underline"
          >
            {duplicate.title}
          </Link>
          . Saving is disabled to avoid a duplicate.
        </div>
      )}

      {saveError && <p className="text-sm font-medium text-rose-600">{saveError}</p>}

      <div className="flex gap-3 pt-1">
        <button
          type="submit"
          disabled={saving || Boolean(duplicate && !isEdit)}
          className="btn-primary flex-1 text-sm disabled:opacity-50"
        >
          {saving && <Loader2 className="size-4 animate-spin" />}
          {isEdit ? 'Save changes' : 'Add recipe'}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="btn-quiet px-4 text-sm"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}

const inputClass = 'field text-sm'

function Field({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-baseline gap-2">
        <span className="text-sm font-medium text-ink-soft">{label}</span>
        {hint && <span className="text-xs text-ink-faint">{hint}</span>}
      </span>
      {children}
    </label>
  )
}
