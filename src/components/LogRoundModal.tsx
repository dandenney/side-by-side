'use client'

import { useState } from 'react'
import { Loader2, ThumbsDown, ThumbsUp, X } from 'lucide-react'
import { Course, GolfRating } from '@/types/golf'
import { createRound } from '@/lib/supabase/golf'

interface LogRoundModalProps {
  course: Course
  onClose: () => void
  onLogged: () => void
}

const toDateInput = (date: Date): string =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate()
  ).padStart(2, '0')}`

export function LogRoundModal({ course, onClose, onLogged }: LogRoundModalProps) {
  const [playedOn, setPlayedOn] = useState(toDateInput(new Date()))
  const [holesPlayed, setHolesPlayed] = useState(String(course.holes))
  const [score, setScore] = useState('')
  const [rating, setRating] = useState<GolfRating | ''>('')
  const [notes, setNotes] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const save = async () => {
    if (!playedOn) {
      setError('When did you play?')
      return
    }

    setIsSaving(true)
    setError(null)
    try {
      await createRound({
        courseId: course.id,
        // Parse as local midnight so the round lands on the day you played it.
        playedOn: new Date(`${playedOn}T00:00:00`),
        holesPlayed: Number(holesPlayed) || course.holes,
        score: score ? Number(score) : undefined,
        rating: rating || undefined,
        notes: notes.trim() || undefined,
      })
      onLogged()
      onClose()
    } catch (err) {
      console.error('Error logging round:', err)
      setError('Could not save the round. Try again.')
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
        aria-label={`Log a round at ${course.name}`}
        className="max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-surface p-5 shadow-pop md:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="font-display text-2xl font-bold text-hue-deep">
              Log a round
            </h2>
            <p className="truncate text-sm text-ink-soft">{course.name}</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="flex size-9 shrink-0 items-center justify-center rounded-full bg-surface-2 text-ink-soft"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="field-label" htmlFor="round-date">
              Date
            </label>
            <input
              id="round-date"
              type="date"
              value={playedOn}
              onChange={(e) => setPlayedOn(e.target.value)}
              className="field"
            />
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <label className="field-label" htmlFor="round-holes">
                Holes
              </label>
              <input
                id="round-holes"
                type="number"
                inputMode="numeric"
                value={holesPlayed}
                onChange={(e) => setHolesPlayed(e.target.value)}
                className="field"
              />
            </div>
            <div className="flex-1">
              <label className="field-label" htmlFor="round-score">
                Score
              </label>
              <input
                id="round-score"
                type="number"
                inputMode="numeric"
                value={score}
                onChange={(e) => setScore(e.target.value)}
                placeholder="82"
                className="field"
              />
            </div>
          </div>

          {/* The rating is on the ROUND, not the course — the same eighteen can
              earn a thumbs down in the rain and a thumbs up in June. */}
          <div>
            <span className="field-label">How was it?</span>
            <div className="flex gap-2">
              {(
                [
                  { key: 'up', label: 'Great', icon: ThumbsUp },
                  { key: 'down', label: 'Rough', icon: ThumbsDown },
                ] as const
              ).map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setRating(rating === key ? '' : key)}
                  aria-pressed={rating === key}
                  className={`flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-full px-4 py-2 text-sm transition-colors duration-150 ${
                    rating === key
                      ? key === 'up'
                        ? 'bg-emerald-500 font-semibold text-white'
                        : 'bg-rose-500 font-semibold text-white'
                      : 'border border-line bg-surface font-medium text-ink-soft'
                  }`}
                >
                  <Icon className="size-4" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="field-label" htmlFor="round-notes">
              Notes
            </label>
            <textarea
              id="round-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Brutal wind, lost four balls, the 12th is unreal…"
              className="field"
            />
          </div>

          {error && <p className="text-sm text-rose-500">{error}</p>}

          <div className="flex gap-2 pt-1">
            <button onClick={onClose} className="btn-quiet flex-1">
              Cancel
            </button>
            <button
              onClick={save}
              disabled={isSaving}
              className="btn-primary flex flex-1 items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSaving && <Loader2 className="size-4 animate-spin" />}
              {isSaving ? 'Saving…' : 'Log round'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
