import { createClient } from '@/lib/supabase/client'
import {
  NewRecipe,
  Recipe,
  RecipeEdit,
  RecipeRating,
  RecipeStatus,
} from '@/types/recipe'

interface SupabaseRecipe {
  id: string
  title: string
  ingredients: string[]
  instructions: string[]
  image_url: string | null
  source_url: string | null
  servings: string | null
  tags: string[]
  status: RecipeStatus
  rating: RecipeRating | null
  tried_at: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

const mapRecipe = (row: SupabaseRecipe): Recipe => ({
  id: row.id,
  title: row.title,
  ingredients: row.ingredients ?? [],
  instructions: row.instructions ?? [],
  imageUrl: row.image_url ?? undefined,
  sourceUrl: row.source_url ?? undefined,
  servings: row.servings ?? undefined,
  tags: row.tags ?? [],
  status: row.status,
  rating: row.rating ?? undefined,
  triedAt: row.tried_at ? new Date(row.tried_at) : undefined,
  notes: row.notes ?? undefined,
  createdAt: new Date(row.created_at),
  updatedAt: new Date(row.updated_at),
})

// Download an image by URL and re-host it in the recipe-images bucket, mirroring
// the url-items flow. Returns the public URL, or null if it couldn't be stored.
async function uploadImageToStorage(imageUrl: string): Promise<string | null> {
  try {
    const response = await fetch(
      `/api/fetch-image?url=${encodeURIComponent(imageUrl)}`
    )
    if (!response.ok) return null

    const blob = await response.blob()
    if (blob.size === 0) return null

    const supabase = createClient()
    const fileName = `recipe-image-${Date.now()}.jpg`

    const { error } = await supabase.storage
      .from('recipe-images')
      .upload(fileName, blob, {
        contentType: blob.type,
        cacheControl: '3600',
        upsert: false,
      })
    if (error) return null

    const {
      data: { publicUrl },
    } = supabase.storage.from('recipe-images').getPublicUrl(fileName)

    return publicUrl
  } catch (error) {
    console.error('Failed to store recipe image:', error)
    return null
  }
}

// An already-hosted image (in our bucket) is left as-is; anything else is
// fetched and re-hosted. Returns the URL to persist, or undefined.
async function resolveImageUrl(
  imageUrl: string | undefined
): Promise<string | undefined> {
  if (!imageUrl) return undefined
  if (imageUrl.includes('/recipe-images/')) return imageUrl
  return (await uploadImageToStorage(imageUrl)) ?? imageUrl
}

export async function getRecipes(): Promise<Recipe[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('recipes')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data as SupabaseRecipe[]).map(mapRecipe)
}

export async function getRecipe(id: string): Promise<Recipe | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('recipes')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (error) throw error
  return data ? mapRecipe(data as SupabaseRecipe) : null
}

export async function createRecipe(input: NewRecipe): Promise<Recipe> {
  const supabase = createClient()
  const imageUrl = await resolveImageUrl(input.imageUrl)

  // A new recipe always starts in `to_try`, so rating/tried_at stay null and
  // the DB stage-consistency constraint is satisfied.
  const insertData = {
    title: input.title,
    ingredients: input.ingredients ?? [],
    instructions: input.instructions ?? [],
    image_url: imageUrl ?? null,
    source_url: input.sourceUrl ?? null,
    servings: input.servings ?? null,
    tags: input.tags ?? [],
    notes: input.notes ?? null,
  }

  const { data, error } = await supabase
    .from('recipes')
    .insert([insertData])
    .select('*')
    .single()

  if (error) throw error
  return mapRecipe(data as SupabaseRecipe)
}

// The one-way To Try -> Tried transition. Sets status, rating, and tried_at
// together so the stage-consistency constraint always holds.
export async function markRecipeTried(
  id: string,
  rating: RecipeRating
): Promise<Recipe> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('recipes')
    .update({
      status: 'tried',
      rating,
      tried_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select('*')
    .single()

  if (error) throw error
  return mapRecipe(data as SupabaseRecipe)
}

// Update editable content only. Stage fields (status/rating/tried_at) are never
// touched here — use markRecipeTried for that.
export async function updateRecipe(
  id: string,
  edit: RecipeEdit
): Promise<Recipe> {
  const supabase = createClient()

  const updateData: Record<string, unknown> = {}
  if (edit.title !== undefined) updateData.title = edit.title
  if (edit.ingredients !== undefined) updateData.ingredients = edit.ingredients
  if (edit.instructions !== undefined)
    updateData.instructions = edit.instructions
  if (edit.sourceUrl !== undefined) updateData.source_url = edit.sourceUrl
  if (edit.servings !== undefined) updateData.servings = edit.servings
  if (edit.tags !== undefined) updateData.tags = edit.tags
  if (edit.notes !== undefined) updateData.notes = edit.notes
  if (edit.imageUrl !== undefined) {
    updateData.image_url = (await resolveImageUrl(edit.imageUrl)) ?? null
  }

  const { data, error } = await supabase
    .from('recipes')
    .update(updateData)
    .eq('id', id)
    .select('*')
    .single()

  if (error) throw error
  return mapRecipe(data as SupabaseRecipe)
}

export async function deleteRecipe(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('recipes').delete().eq('id', id)
  if (error) throw error
}
