'use client'

import { useState } from 'react'
import { MapPin, Search, X, Pencil, Loader2 } from 'lucide-react'
import {
  ACCESS_TYPES,
  ACCESS_TYPE_LABELS,
  AccessType,
  COST_BANDS,
  COST_BAND_LABELS,
  CostBand,
  NewCourse,
} from '@/types/golf'
import { createCourse } from '@/lib/supabase/golf'

interface PlaceResult {
  placeId: string
  name: string
  address: string
  lat: number
  lng: number
}

interface AddCourseModalProps {
  onClose: () => void
  onAdded: () => void
}

export function AddCourseModal({ onClose, onAdded }: AddCourseModalProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<PlaceResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [searched, setSearched] = useState(false)

  // The picked Google place, or null for a hand-made course. Bandon Dunes is one
  // Google place over six courses, so the name stays editable either way.
  const [place, setPlace] = useState<PlaceResult | null>(null)
  const [handMade, setHandMade] = useState(false)
  // Website/phone are not in the search payload; only the details endpoint has
  // them, and the course detail page renders both.
  const [details, setDetails] = useState<{
    website?: string
    phoneNumber?: string
  }>({})

  const [name, setName] = useState('')
  const [accessType, setAccessType] = useState<AccessType>('public')
  const [costBand, setCostBand] = useState<CostBand | ''>('')
  const [holes, setHoles] = useState('18')
  const [par, setPar] = useState('')
  const [notes, setNotes] = useState('')

  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const inDetails = place !== null || handMade

  const search = async () => {
    if (query.trim().length < 4) return
    setIsSearching(true)
    setError(null)
    try {
      const response = await fetch(
        `/api/places?query=${encodeURIComponent(query)}`
      )
      if (!response.ok) throw new Error('Failed to search')
      setResults(await response.json())
      setSearched(true)
    } catch {
      setError('Could not search right now. Try again, or add it by hand.')
    } finally {
      setIsSearching(false)
    }
  }

  const pickPlace = async (result: PlaceResult) => {
    setPlace(result)
    setName(result.name)
    try {
      const response = await fetch(
        `/api/places?placeId=${encodeURIComponent(result.placeId)}`
      )
      if (!response.ok) return
      const detail = await response.json()
      setDetails({
        website: detail.website,
        phoneNumber: detail.phoneNumber,
      })
    } catch {
      // Details are a bonus — a course without them is still perfectly usable.
    }
  }

  const startHandMade = () => {
    setHandMade(true)
    setName(query.trim())
  }

  const save = async () => {
    if (!name.trim()) {
      setError('A course needs a name.')
      return
    }

    setIsSaving(true)
    setError(null)
    try {
      const input: NewCourse = {
        name: name.trim(),
        accessType,
        costBand: costBand || undefined,
        holes: Number(holes) || 18,
        par: par ? Number(par) : undefined,
        notes: notes.trim() || undefined,
        wantsPlay: true,
        ...(place
          ? {
              placeId: place.placeId,
              address: place.address,
              lat: place.lat,
              lng: place.lng,
              website: details.website,
              phoneNumber: details.phoneNumber,
            }
          : {}),
      }
      await createCourse(input)
      onAdded()
      onClose()
    } catch (err) {
      console.error('Error creating course:', err)
      setError('Could not save the course. Try again.')
      setIsSaving(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 md:items-center md:p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Add a course"
        className="max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-surface p-5 shadow-pop md:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <h2 className="font-display text-2xl font-bold text-hue-deep">
            {inDetails ? 'Course details' : 'Add a course'}
          </h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="flex size-9 items-center justify-center rounded-full bg-surface-2 text-ink-soft"
          >
            <X className="size-4" />
          </button>
        </div>

        {!inDetails ? (
          <div className="space-y-4">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-faint" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && search()}
                placeholder="Search for a course…"
                autoFocus
                className="field pl-10"
              />
            </div>

            <button
              onClick={search}
              disabled={query.trim().length < 4 || isSearching}
              className="btn-primary w-full disabled:opacity-50"
            >
              {isSearching ? 'Searching…' : 'Search'}
            </button>

            {results.length > 0 && (
              <ul className="space-y-2">
                {results.map((result) => (
                  <li key={result.placeId}>
                    <button
                      onClick={() => pickPlace(result)}
                      className="card flex w-full items-start gap-3 p-3 text-left"
                    >
                      <MapPin className="mt-0.5 size-4 shrink-0 text-hue" />
                      <span className="min-w-0">
                        <span className="block truncate text-[15px] font-medium text-ink">
                          {result.name}
                        </span>
                        <span className="block truncate text-sm text-ink-soft">
                          {result.address}
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {/* Resorts come back as one Google pin over several courses, so the
                hand-made path is a first-class option, not a fallback. */}
            <button
              onClick={startHandMade}
              className="flex w-full items-center justify-center gap-2 rounded-full border border-line bg-surface px-4 py-2.5 text-sm font-medium text-ink-soft"
            >
              <Pencil className="size-4" />
              {searched ? 'Not listed — add it by hand' : 'Add by hand instead'}
            </button>

            {error && <p className="text-sm text-rose-500">{error}</p>}
          </div>
        ) : (
          <div className="space-y-4">
            {place && (
              <p className="flex items-start gap-2 rounded-xl bg-tint px-3 py-2 text-sm text-tint-ink">
                <MapPin className="mt-0.5 size-4 shrink-0" />
                {place.address}
              </p>
            )}

            <div>
              <label className="field-label" htmlFor="course-name">
                Course name
              </label>
              <input
                id="course-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Pacific Dunes"
                className="field"
              />
              {place && (
                <p className="mt-1.5 text-xs text-ink-faint">
                  One resort can hold several courses — name the eighteen you
                  want to play.
                </p>
              )}
            </div>

            <div>
              <span className="field-label">How you get on</span>
              <div className="flex flex-wrap gap-2">
                {ACCESS_TYPES.map((type) => (
                  <button
                    key={type}
                    onClick={() => setAccessType(type)}
                    aria-pressed={accessType === type}
                    className={`min-h-[36px] rounded-full px-3.5 py-1 text-sm transition-colors duration-150 ${
                      accessType === type
                        ? 'bg-hue-strong font-semibold text-on-hue'
                        : 'border border-line bg-surface font-medium text-ink-soft'
                    }`}
                  >
                    {ACCESS_TYPE_LABELS[type]}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <span className="field-label">Cost</span>
              <div className="flex flex-wrap gap-2">
                {COST_BANDS.map((band) => (
                  <button
                    key={band}
                    onClick={() => setCostBand(costBand === band ? '' : band)}
                    aria-pressed={costBand === band}
                    title={COST_BAND_LABELS[band]}
                    className={`min-h-[36px] rounded-full px-3.5 py-1 text-sm transition-colors duration-150 ${
                      costBand === band
                        ? 'bg-hue-strong font-semibold text-on-hue'
                        : 'border border-line bg-surface font-medium text-ink-soft'
                    }`}
                  >
                    {band}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex-1">
                <label className="field-label" htmlFor="course-holes">
                  Holes
                </label>
                <input
                  id="course-holes"
                  type="number"
                  inputMode="numeric"
                  value={holes}
                  onChange={(e) => setHoles(e.target.value)}
                  className="field"
                />
              </div>
              <div className="flex-1">
                <label className="field-label" htmlFor="course-par">
                  Par
                </label>
                <input
                  id="course-par"
                  type="number"
                  inputMode="numeric"
                  value={par}
                  onChange={(e) => setPar(e.target.value)}
                  placeholder="72"
                  className="field"
                />
              </div>
            </div>

            <div>
              <label className="field-label" htmlFor="course-notes">
                Notes
              </label>
              <textarea
                id="course-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="Why it's on the list…"
                className="field"
              />
            </div>

            {error && <p className="text-sm text-rose-500">{error}</p>}

            <div className="flex gap-2 pt-1">
              <button
                onClick={() => {
                  setPlace(null)
                  setHandMade(false)
                  setDetails({})
                  setError(null)
                }}
                className="btn-quiet flex-1"
              >
                Back
              </button>
              <button
                onClick={save}
                disabled={isSaving}
                className="btn-primary flex flex-1 items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSaving && <Loader2 className="size-4 animate-spin" />}
                {isSaving ? 'Saving…' : 'Add course'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
