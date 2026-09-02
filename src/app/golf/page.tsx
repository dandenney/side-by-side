'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Flag, Map, Plus, Target } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { getCourses } from '@/lib/supabase/golf'
import {
  ACCESS_TYPES,
  ACCESS_TYPE_LABELS,
  AccessType,
  Course,
  isPlayed,
  lastRound,
} from '@/types/golf'
import { CourseCard } from '@/components/CourseCard'
import { AddCourseModal } from '@/components/AddCourseModal'
import { PlaceMap } from '@/components/PlaceMap'
import { Place } from '@/types/url-list'
import PageHeader from '@/components/PageHeader'

type View = 'wants' | 'played' | 'map'

const VIEWS = [
  { key: 'wants', label: 'Want to Play', icon: Target },
  { key: 'played', label: 'Played', icon: Flag },
  { key: 'map', label: 'Map', icon: Map },
] as const

export default function GolfPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  const [courses, setCourses] = useState<Course[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [view, setView] = useState<View>('wants')
  const [accessFilter, setAccessFilter] = useState<AccessType[]>([])
  const [isAdding, setIsAdding] = useState(false)

  useEffect(() => {
    if (!loading && !user) router.push('/login')
  }, [user, loading, router])

  const load = () => {
    setIsLoading(true)
    getCourses()
      .then(setCourses)
      .catch((error) => console.error('Error loading courses:', error))
      .finally(() => setIsLoading(false))
  }

  useEffect(() => {
    if (user) load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  // Want to Play and Played deliberately DO NOT partition: a course you loved
  // and want to return to appears in both. See CONTEXT.md.
  const visible = useMemo(() => {
    const byAccess = (course: Course) =>
      accessFilter.length === 0 || accessFilter.includes(course.accessType)

    if (view === 'played') {
      return courses
        .filter((c) => isPlayed(c) && byAccess(c))
        .sort((a, b) => {
          const aDate = lastRound(a)?.playedOn.getTime() ?? 0
          const bDate = lastRound(b)?.playedOn.getTime() ?? 0
          return bDate - aDate
        })
    }

    return courses.filter((c) => c.wantsPlay && byAccess(c))
  }, [courses, view, accessFilter])

  // Only courses with coordinates can be pinned; hand-made ones often have none.
  const mapPlaces = useMemo<Place[]>(
    () =>
      courses
        .filter((c) => c.lat != null && c.lng != null)
        .map((c) => ({
          placeId: c.placeId ?? c.id,
          name: c.name,
          address: c.address ?? '',
          lat: c.lat!,
          lng: c.lng!,
          types: ['golf_course'],
          website: c.website,
        })),
    [courses]
  )

  const toggleAccess = (type: AccessType) =>
    setAccessFilter((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    )

  if (loading || !user) return null

  const unmapped = courses.length - mapPlaces.length

  return (
    <main data-section="golf" className="min-h-dvh bg-wash px-4 pb-32">
      <PageHeader title="Golf" note="Courses we'd like to play" />

      <div className="mx-auto w-full max-w-md space-y-4 md:max-w-2xl">
        <div className="flex rounded-full bg-surface-2 p-1" role="group" aria-label="View">
          {VIEWS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setView(key)}
              aria-pressed={view === key}
              className={`flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-full px-3 py-2 text-sm transition-colors duration-150 ${
                view === key
                  ? 'bg-tint font-semibold text-tint-ink'
                  : 'font-medium text-ink-faint hover:text-ink-soft'
              }`}
            >
              <Icon className="size-4 shrink-0" />
              <span className="truncate">{label}</span>
            </button>
          ))}
        </div>

        {view !== 'map' && (
          <div className="flex flex-wrap gap-2">
            {ACCESS_TYPES.map((type) => {
              const active = accessFilter.includes(type)
              return (
                <button
                  key={type}
                  onClick={() => toggleAccess(type)}
                  aria-pressed={active}
                  className={`min-h-[36px] rounded-full px-3.5 py-1 text-sm transition-colors duration-150 ${
                    active
                      ? 'bg-hue-strong font-semibold text-on-hue'
                      : 'border border-line bg-surface font-medium text-ink-soft hover:text-ink'
                  }`}
                >
                  {ACCESS_TYPE_LABELS[type]}
                </button>
              )
            })}
          </div>
        )}

        {view === 'map' ? (
          <div className="space-y-2">
            <PlaceMap places={mapPlaces} />
            {unmapped > 0 && (
              <p className="text-xs text-ink-faint">
                {unmapped} {unmapped === 1 ? 'course has' : 'courses have'} no
                location yet — added by hand.
              </p>
            )}
          </div>
        ) : isLoading ? (
          <div
            className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-4"
            role="status"
            aria-live="polite"
            aria-label="Loading courses"
          >
            {[...Array(4)].map((_, i) => (
              <div key={i} className="card animate-pulse overflow-hidden">
                <div className="w-full bg-surface-2" style={{ aspectRatio: '16/9' }} />
                <div className="space-y-2 p-3">
                  <div className="h-4 w-3/5 rounded-full bg-surface-2" />
                  <div className="h-3 w-4/5 rounded-full bg-surface-2" />
                </div>
              </div>
            ))}
          </div>
        ) : visible.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-16 text-center">
            <div className="flex size-16 items-center justify-center rounded-full bg-tint">
              {view === 'played' ? (
                <Flag className="size-7 text-tint-ink" />
              ) : (
                <Target className="size-7 text-tint-ink" />
              )}
            </div>
            <div className="space-y-1">
              <p className="font-display text-lg font-semibold text-ink">
                {view === 'played' ? 'No rounds logged' : 'Nothing on the list'}
              </p>
              <p className="text-sm text-ink-soft">
                {view === 'played'
                  ? 'Play something, then log the round — good day or bad.'
                  : accessFilter.length > 0
                    ? 'No courses match those filters.'
                    : 'Add the course you keep thinking about.'}
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-4">
            {visible.map((course) => (
              <CourseCard
                key={course.id}
                course={course}
                showPlayedMarker={view === 'wants'}
              />
            ))}
          </div>
        )}
      </div>

      <button
        onClick={() => setIsAdding(true)}
        aria-label="Add a course"
        className="fixed bottom-24 right-4 z-30 flex size-14 items-center justify-center rounded-full bg-hue-strong text-on-hue shadow-pop md:bottom-8 md:right-8"
      >
        <Plus className="size-6" />
      </button>

      {isAdding && (
        <AddCourseModal onClose={() => setIsAdding(false)} onAdded={load} />
      )}
    </main>
  )
}
