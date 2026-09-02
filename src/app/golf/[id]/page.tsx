'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import {
  ArrowLeft,
  Globe,
  MapPin,
  Phone,
  Plus,
  Target,
  Trash2,
  ThumbsDown,
  ThumbsUp,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import {
  deleteCourse,
  deleteRound,
  getCourse,
  setWantsPlay,
} from '@/lib/supabase/golf'
import {
  ACCESS_TYPE_LABELS,
  COST_BAND_LABELS,
  Course,
  isPlayed,
  scoreDifferential,
} from '@/types/golf'
import { LogRoundModal } from '@/components/LogRoundModal'

export default function CourseDetailPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const params = useParams<{ id: string }>()

  const [course, setCourse] = useState<Course | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isLogging, setIsLogging] = useState(false)

  useEffect(() => {
    if (!loading && !user) router.push('/login')
  }, [user, loading, router])

  const load = () => {
    getCourse(params.id)
      .then(setCourse)
      .catch((error) => console.error('Error loading course:', error))
      .finally(() => setIsLoading(false))
  }

  useEffect(() => {
    if (user && params.id) load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, params.id])

  const toggleWants = async () => {
    if (!course) return
    // Optimistic: the flag is independent of rounds, so nothing else can shift.
    setCourse({ ...course, wantsPlay: !course.wantsPlay })
    try {
      await setWantsPlay(course.id, !course.wantsPlay)
    } catch (error) {
      console.error('Error updating course:', error)
      setCourse(course)
    }
  }

  const removeRound = async (roundId: string) => {
    if (!course) return
    try {
      await deleteRound(roundId)
      load()
    } catch (error) {
      console.error('Error deleting round:', error)
    }
  }

  const removeCourse = async () => {
    if (!course) return
    if (!confirm(`Delete ${course.name} and all of its rounds?`)) return
    try {
      await deleteCourse(course.id)
      router.push('/golf')
    } catch (error) {
      console.error('Error deleting course:', error)
    }
  }

  if (loading || !user) return null

  return (
    <main data-section="golf" className="min-h-dvh bg-wash px-4 pb-32">
      <div className="mx-auto w-full max-w-md space-y-5 pt-5 md:max-w-2xl md:pt-24">
        <Link
          href="/golf"
          className="inline-flex min-h-[44px] items-center gap-1.5 text-sm font-medium text-ink-soft"
        >
          <ArrowLeft className="size-4" />
          Golf
        </Link>

        {isLoading ? (
          <div className="space-y-3" role="status" aria-label="Loading course">
            <div className="h-10 w-3/5 animate-pulse rounded-full bg-surface-2" />
            <div className="h-4 w-4/5 animate-pulse rounded-full bg-surface-2" />
          </div>
        ) : !course ? (
          <p className="py-16 text-center text-ink-soft">
            That course isn&apos;t here anymore.
          </p>
        ) : (
          <>
            <header className="space-y-2">
              <h1 className="font-display text-[2.5rem] font-bold leading-none tracking-tight text-hue-deep">
                {course.name}
                <span className="text-hue-strong">.</span>
              </h1>

              <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-ink-soft">
                <span>{ACCESS_TYPE_LABELS[course.accessType]}</span>
                {course.costBand && (
                  <>
                    <span aria-hidden>·</span>
                    <span title={COST_BAND_LABELS[course.costBand]}>
                      {course.costBand}
                    </span>
                  </>
                )}
                <span aria-hidden>·</span>
                <span>
                  {course.holes} holes
                  {course.par ? `, par ${course.par}` : ''}
                </span>
              </p>

              {course.address && (
                <p className="flex items-start gap-2 text-sm text-ink-soft">
                  <MapPin className="mt-0.5 size-4 shrink-0 text-hue" />
                  {course.address}
                </p>
              )}

              <div className="flex flex-wrap gap-3 pt-1 text-sm">
                {course.website && (
                  <a
                    href={course.website}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex min-h-[44px] items-center gap-1.5 font-medium text-hue"
                  >
                    <Globe className="size-4" />
                    Website
                  </a>
                )}
                {course.phoneNumber && (
                  <a
                    href={`tel:${course.phoneNumber}`}
                    className="inline-flex min-h-[44px] items-center gap-1.5 font-medium text-hue"
                  >
                    <Phone className="size-4" />
                    Call
                  </a>
                )}
              </div>
            </header>

            {course.notes && (
              <p className="card p-4 text-[15px] leading-relaxed text-ink-soft">
                {course.notes}
              </p>
            )}

            {/* Want to Play is independent of Played — a course you've played can
                still be on the wishlist, which is the whole point of the flag. */}
            <button
              onClick={toggleWants}
              aria-pressed={course.wantsPlay}
              className={`flex min-h-[44px] w-full items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm transition-colors duration-150 ${
                course.wantsPlay
                  ? 'bg-hue-strong font-semibold text-on-hue shadow-pop'
                  : 'border border-line bg-surface font-medium text-ink-soft'
              }`}
            >
              <Target className="size-4" />
              {course.wantsPlay ? 'On the want-to-play list' : 'Want to play'}
            </button>

            <section className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-display text-xl font-bold text-ink">
                  Rounds
                </h2>
                <button
                  onClick={() => setIsLogging(true)}
                  className="inline-flex min-h-[36px] items-center gap-1.5 rounded-full bg-surface-2 px-3.5 py-1.5 text-sm font-medium text-ink-soft"
                >
                  <Plus className="size-4" />
                  Log a round
                </button>
              </div>

              {!isPlayed(course) ? (
                <p className="card p-4 text-sm text-ink-soft">
                  Never played. Log a round when you do — good day or bad.
                </p>
              ) : (
                <ul className="space-y-3">
                  {course.rounds.map((round) => {
                    const differential = scoreDifferential(course, round)
                    return (
                      <li key={round.id} className="card p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 space-y-1">
                            <p className="text-[15px] font-semibold text-ink">
                              {format(round.playedOn, 'MMM d, yyyy')}
                            </p>
                            <p className="text-sm text-ink-soft">
                              {round.score != null ? (
                                <>
                                  {round.score}
                                  {differential && ` (${differential})`}
                                </>
                              ) : (
                                'No score'
                              )}
                              {round.holesPlayed !== course.holes &&
                                ` · ${round.holesPlayed} holes`}
                            </p>
                            {round.notes && (
                              <p className="text-sm leading-relaxed text-ink-soft">
                                {round.notes}
                              </p>
                            )}
                          </div>

                          <div className="flex shrink-0 items-center gap-2">
                            {round.rating === 'up' && (
                              <ThumbsUp
                                className="size-4 text-emerald-500"
                                aria-label="Thumbs up"
                              />
                            )}
                            {round.rating === 'down' && (
                              <ThumbsDown
                                className="size-4 text-rose-500"
                                aria-label="Thumbs down"
                              />
                            )}
                            <button
                              onClick={() => removeRound(round.id)}
                              aria-label="Delete round"
                              className="flex size-9 items-center justify-center rounded-full text-ink-faint hover:text-rose-500"
                            >
                              <Trash2 className="size-4" />
                            </button>
                          </div>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              )}
            </section>

            <button
              onClick={removeCourse}
              className="inline-flex min-h-[44px] items-center gap-1.5 text-sm font-medium text-ink-faint hover:text-rose-500"
            >
              <Trash2 className="size-4" />
              Delete course
            </button>

            {isLogging && (
              <LogRoundModal
                course={course}
                onClose={() => setIsLogging(false)}
                onLogged={load}
              />
            )}
          </>
        )}
      </div>
    </main>
  )
}
