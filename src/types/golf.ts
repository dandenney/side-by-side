// Golf types. See CONTEXT.md and docs/adr/0002 for the domain model.
//
// Two things deliberately diverge from the Recipe model:
//   1. There is no status. `played` is DERIVED from round count; `wantsPlay` is
//      an independent flag. A Course can be both, or neither.
//   2. A Rating lives on a Round, never on a Course — the same course plays
//      differently in a February downpour and on a June morning.

export type GolfRating = 'up' | 'down'

// Fixed, app-defined vocabularies. Extend here — both are plain text columns,
// so adding a value is a code edit (the DB check constraint is the exception:
// widening it needs a migration).
export const ACCESS_TYPES = [
  'public',
  'municipal',
  'semi_private',
  'private',
  'resort',
] as const

export type AccessType = (typeof ACCESS_TYPES)[number]

export const ACCESS_TYPE_LABELS: Record<AccessType, string> = {
  public: 'Public',
  municipal: 'Municipal',
  semi_private: 'Semi-private',
  private: 'Private',
  resort: 'Resort',
}

// Coarse buckets, not an exact greens fee — a band stays true for years while a
// number goes stale and gets checked on the course's own site before booking.
export const COST_BANDS = ['$', '$$', '$$$', '$$$$'] as const

export type CostBand = (typeof COST_BANDS)[number]

export const COST_BAND_LABELS: Record<CostBand, string> = {
  $: 'Under $50',
  $$: '$50–100',
  $$$: '$100–200',
  $$$$: '$200+',
}

export interface Round {
  id: string
  courseId: string
  playedOn: Date
  holesPlayed: number // 9 or 18; keeps a 41 from reading as a career day
  score?: number
  rating?: GolfRating
  notes?: string
  createdAt: Date
  updatedAt: Date
}

export interface Course {
  id: string
  name: string

  // Google Places enrichment — all optional. A hand-made course has none, and
  // sibling courses at one resort intentionally share a placeId.
  placeId?: string
  address?: string
  lat?: number
  lng?: number
  website?: string
  phoneNumber?: string
  imageUrl?: string

  accessType: AccessType
  costBand?: CostBand
  holes: number
  par?: number

  wantsPlay: boolean // independent of `played`
  notes?: string

  rounds: Round[]
  createdAt: Date
  updatedAt: Date
}

/** Played is derived, never stored. */
export const isPlayed = (course: Course): boolean => course.rounds.length > 0

/** The most recent Round, or undefined if the course has never been played. */
export const lastRound = (course: Course): Round | undefined => course.rounds[0]

/**
 * A score read against the course's par, as a signed differential ("+10", "E").
 * Returns undefined when either number is missing. Par is prorated for a
 * nine-hole round so a 41 on a par 72 course reads as +5, not -31.
 */
export function scoreDifferential(
  course: Course,
  round: Round
): string | undefined {
  if (round.score == null || course.par == null || !course.holes) return undefined

  const parForRound = Math.round(course.par * (round.holesPlayed / course.holes))
  const diff = round.score - parForRound

  if (diff === 0) return 'E'
  return diff > 0 ? `+${diff}` : `${diff}`
}

// Fields settable when creating a course. `rounds` is never part of the input —
// a course starts with none, which is exactly what makes it "not played".
export interface NewCourse {
  name: string
  placeId?: string
  address?: string
  lat?: number
  lng?: number
  website?: string
  phoneNumber?: string
  imageUrl?: string
  accessType: AccessType
  costBand?: CostBand
  holes?: number
  par?: number
  wantsPlay?: boolean
  notes?: string
}

export type CourseEdit = Partial<Omit<NewCourse, 'accessType'>> & {
  accessType?: AccessType
}

export interface NewRound {
  courseId: string
  playedOn: Date
  holesPlayed?: number
  score?: number
  rating?: GolfRating
  notes?: string
}
