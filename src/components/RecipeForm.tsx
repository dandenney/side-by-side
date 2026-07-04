'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Link2, Loader2 } from 'lucide-react'
import { createRecipe, updateRecipe } from '@/lib/supabase/recipes'
import { Recipe, RECIPE_TAGS } from '@/types/recipe'

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

  const handleFetch = async () => {
    if (!url.trim()) return
    setFetching(true)
    setFetchError(null)
    try {
      const res = await fetch(`/api/recipe-preview?url=${encodeURIComponent(url.trim())}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Could not read that URL')

      setTitle(data.title ?? '')
      setIngredients(linesToText(data.ingredients ?? []))
      setInstructions(linesToText(data.instructions ?? []))
      setServings(data.servings ?? '')
      setImageUrl(data.imageUrl ?? '')
      setSourceUrl(data.sourceUrl ?? url.trim())
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

    const payload = {
      title: title.trim(),
      ingredients: textToLines(ingredients),
      instructions: textToLines(instructions),
      servings: servings.trim() || undefined,
      sourceUrl: sourceUrl.trim() || undefined,
      imageUrl: imageUrl.trim() || undefined,
      tags,
    }

    try {
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
        <div className="rounded-2xl bg-white p-4 shadow-sm border border-gray-950/5">
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Paste a recipe URL to autofill
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Link2 className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://recime.app/p/…"
                className="w-full rounded-xl border border-gray-950/5 bg-white py-2.5 pl-9 pr-3 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-300"
              />
            </div>
            <button
              type="button"
              onClick={handleFetch}
              disabled={fetching || !url.trim()}
              className="flex items-center gap-1.5 rounded-xl bg-purple-600 px-4 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-50"
            >
              {fetching && <Loader2 className="size-4 animate-spin" />}
              Autofill
            </button>
          </div>
          {fetchError && (
            <p className="mt-2 text-sm text-rose-500">{fetchError}</p>
          )}
          <p className="mt-2 text-xs text-gray-400">
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
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm border border-gray-950/5">
          <div className="aspect-[4/3] bg-purple-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imageUrl} alt={title} className="h-full w-full object-cover" />
          </div>
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
            onChange={(e) => setSourceUrl(e.target.value)}
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

      {saveError && <p className="text-sm text-rose-500">{saveError}</p>}

      <div className="flex gap-3 pt-1">
        <button
          type="submit"
          disabled={saving}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-purple-600 py-2.5 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-50"
        >
          {saving && <Loader2 className="size-4 animate-spin" />}
          {isEdit ? 'Save changes' : 'Add recipe'}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}

const inputClass =
  'w-full rounded-xl border border-gray-950/5 bg-white p-3 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-300'

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
        <span className="text-sm font-medium text-gray-700">{label}</span>
        {hint && <span className="text-xs text-gray-400">{hint}</span>}
      </span>
      {children}
    </label>
  )
}
