import { createClient } from '@/lib/supabase/client'
import {
  AccessType,
  CostBand,
  Course,
  CourseEdit,
  GolfRating,
  NewCourse,
  NewRound,
  Round,
} from '@/types/golf'

interface SupabaseRound {
  id: string
  course_id: string
  played_on: string
  holes_played: number
  score: number | null
  rating: GolfRating | null
  notes: string | null
  created_at: string
  updated_at: string
}

interface SupabaseCourse {
  id: string
  name: string
  place_id: string | null
  address: string | null
  lat: number | null
  lng: number | null
  website: string | null
  phone_number: string | null
  image_url: string | null
  access_type: AccessType
  cost_band: CostBand | null
  holes: number
  par: number | null
  wants_play: boolean
  notes: string | null
  created_at: string
  updated_at: string
  rounds?: SupabaseRound[]
}

const mapRound = (row: SupabaseRound): Round => ({
  id: row.id,
  courseId: row.course_id,
  // played_on is a DATE; parse as local midnight so it doesn't shift a day west.
  playedOn: new Date(`${row.played_on}T00:00:00`),
  holesPlayed: row.holes_played,
  score: row.score ?? undefined,
  rating: row.rating ?? undefined,
  notes: row.notes ?? undefined,
  createdAt: new Date(row.created_at),
  updatedAt: new Date(row.updated_at),
})

const mapCourse = (row: SupabaseCourse): Course => ({
  id: row.id,
  name: row.name,
  placeId: row.place_id ?? undefined,
  address: row.address ?? undefined,
  lat: row.lat ?? undefined,
  lng: row.lng ?? undefined,
  website: row.website ?? undefined,
  phoneNumber: row.phone_number ?? undefined,
  imageUrl: row.image_url ?? undefined,
  accessType: row.access_type,
  costBand: row.cost_band ?? undefined,
  holes: row.holes,
  par: row.par ?? undefined,
  wantsPlay: row.wants_play,
  notes: row.notes ?? undefined,
  // Newest first, so rounds[0] is the most recent visit.
  rounds: (row.rounds ?? [])
    .map(mapRound)
    .sort((a, b) => b.playedOn.getTime() - a.playedOn.getTime()),
  createdAt: new Date(row.created_at),
  updatedAt: new Date(row.updated_at),
})

// Download a Google Place Photo and re-host it in the course-images bucket,
// mirroring the recipes flow. Google's photo URLs carry the server API key as a
// query param, so persisting one would leak that key to every visitor.
// Returns the public URL, or null if it couldn't be stored.
async function uploadImageToStorage(imageUrl: string): Promise<string | null> {
  try {
    const response = await fetch(
      `/api/fetch-image?url=${encodeURIComponent(imageUrl)}`
    )
    if (!response.ok) return null

    const blob = await response.blob()
    if (blob.size === 0) return null

    const supabase = createClient()
    const fileName = `course-image-${Date.now()}.jpg`

    const { error } = await supabase.storage
      .from('course-images')
      .upload(fileName, blob, {
        contentType: blob.type,
        cacheControl: '3600',
        upsert: false,
      })
    if (error) return null

    const {
      data: { publicUrl },
    } = supabase.storage.from('course-images').getPublicUrl(fileName)

    return publicUrl
  } catch (error) {
    console.error('Failed to store course image:', error)
    return null
  }
}

// An already-hosted image is left as-is; a Google photo URL is fetched and
// re-hosted. Returns undefined rather than persisting a URL carrying our key.
async function resolveImageUrl(
  imageUrl: string | undefined
): Promise<string | undefined> {
  if (!imageUrl) return undefined
  if (imageUrl.includes('/course-images/')) return imageUrl
  return (await uploadImageToStorage(imageUrl)) ?? undefined
}

// Courses always come back with their rounds, because "played" is derived from
// round count — a course without its rounds can't answer the basic question.
const COURSE_SELECT = '*, rounds(*)'

export async function getCourses(): Promise<Course[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('courses')
    .select(COURSE_SELECT)
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data as SupabaseCourse[]).map(mapCourse)
}

export async function getCourse(id: string): Promise<Course | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('courses')
    .select(COURSE_SELECT)
    .eq('id', id)
    .maybeSingle()

  if (error) throw error
  return data ? mapCourse(data as SupabaseCourse) : null
}

/**
 * Courses already saved for a Google place. Sibling courses at one resort share
 * a placeId, so this returns a list — used to offer "add another course here"
 * rather than to block a duplicate.
 */
export async function getCoursesByPlaceId(placeId: string): Promise<Course[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('courses')
    .select(COURSE_SELECT)
    .eq('place_id', placeId)

  if (error) throw error
  return (data as SupabaseCourse[]).map(mapCourse)
}

export async function createCourse(input: NewCourse): Promise<Course> {
  const supabase = createClient()
  const imageUrl = await resolveImageUrl(input.imageUrl)

  const { data, error } = await supabase
    .from('courses')
    .insert([
      {
        name: input.name,
        place_id: input.placeId ?? null,
        address: input.address ?? null,
        lat: input.lat ?? null,
        lng: input.lng ?? null,
        website: input.website ?? null,
        phone_number: input.phoneNumber ?? null,
        image_url: imageUrl ?? null,
        access_type: input.accessType,
        cost_band: input.costBand ?? null,
        holes: input.holes ?? 18,
        par: input.par ?? null,
        wants_play: input.wantsPlay ?? true,
        notes: input.notes ?? null,
      },
    ])
    .select(COURSE_SELECT)
    .single()

  if (error) throw error
  return mapCourse(data as SupabaseCourse)
}

export async function updateCourse(
  id: string,
  edit: CourseEdit
): Promise<Course> {
  const supabase = createClient()

  const updateData: Record<string, unknown> = {}
  if (edit.name !== undefined) updateData.name = edit.name
  if (edit.placeId !== undefined) updateData.place_id = edit.placeId
  if (edit.address !== undefined) updateData.address = edit.address
  if (edit.lat !== undefined) updateData.lat = edit.lat
  if (edit.lng !== undefined) updateData.lng = edit.lng
  if (edit.website !== undefined) updateData.website = edit.website
  if (edit.phoneNumber !== undefined) updateData.phone_number = edit.phoneNumber
  if (edit.imageUrl !== undefined) {
    updateData.image_url = (await resolveImageUrl(edit.imageUrl)) ?? null
  }
  if (edit.accessType !== undefined) updateData.access_type = edit.accessType
  if (edit.costBand !== undefined) updateData.cost_band = edit.costBand
  if (edit.holes !== undefined) updateData.holes = edit.holes
  if (edit.par !== undefined) updateData.par = edit.par
  if (edit.wantsPlay !== undefined) updateData.wants_play = edit.wantsPlay
  if (edit.notes !== undefined) updateData.notes = edit.notes

  const { data, error } = await supabase
    .from('courses')
    .update(updateData)
    .eq('id', id)
    .select(COURSE_SELECT)
    .single()

  if (error) throw error
  return mapCourse(data as SupabaseCourse)
}

/** Toggling the wishlist flag never touches rounds — the two axes are independent. */
export async function setWantsPlay(
  id: string,
  wantsPlay: boolean
): Promise<Course> {
  return updateCourse(id, { wantsPlay })
}

export async function deleteCourse(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('courses').delete().eq('id', id)
  if (error) throw error
}

// Store played_on as a plain YYYY-MM-DD in local terms — a round belongs to the
// day you played it, with no timezone to shift it.
const toDateOnly = (date: Date): string =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate()
  ).padStart(2, '0')}`

export async function createRound(input: NewRound): Promise<Round> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('rounds')
    .insert([
      {
        course_id: input.courseId,
        played_on: toDateOnly(input.playedOn),
        holes_played: input.holesPlayed ?? 18,
        score: input.score ?? null,
        rating: input.rating ?? null,
        notes: input.notes ?? null,
      },
    ])
    .select('*')
    .single()

  if (error) throw error
  return mapRound(data as SupabaseRound)
}

export async function deleteRound(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('rounds').delete().eq('id', id)
  if (error) throw error
}
