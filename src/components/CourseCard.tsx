'use client'

import Link from 'next/link'
import { Flag, ThumbsDown, ThumbsUp } from 'lucide-react'
import {
  ACCESS_TYPE_LABELS,
  Course,
  isPlayed,
  lastRound,
  scoreDifferential,
} from '@/types/golf'

interface CourseCardProps {
  course: Course
  /** In the Want to Play list, a course you've already played gets a marker —
   *  it's there because you'd go back, not because it's unplayed. */
  showPlayedMarker?: boolean
}

export function CourseCard({ course, showPlayedMarker }: CourseCardProps) {
  const played = isPlayed(course)
  const recent = lastRound(course)
  const differential = recent ? scoreDifferential(course, recent) : undefined

  return (
    <Link
      href={`/golf/${course.id}`}
      className="card flex items-start justify-between gap-3 p-4"
    >
      <div className="min-w-0 space-y-1">
        <p className="truncate text-[15px] font-semibold text-ink">
          {course.name}
        </p>

        {course.address && (
          <p className="truncate text-sm text-ink-soft">{course.address}</p>
        )}

        <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-ink-faint">
          <span>{ACCESS_TYPE_LABELS[course.accessType]}</span>
          {course.costBand && (
            <>
              <span aria-hidden>·</span>
              <span>{course.costBand}</span>
            </>
          )}
          {course.par && (
            <>
              <span aria-hidden>·</span>
              <span>
                {course.holes} holes, par {course.par}
              </span>
            </>
          )}
          {showPlayedMarker && played && (
            <>
              <span aria-hidden>·</span>
              <span className="inline-flex items-center gap-1 text-hue">
                <Flag className="size-3" />
                Played
              </span>
            </>
          )}
        </p>
      </div>

      {played && recent && (
        <div className="flex shrink-0 flex-col items-end gap-1">
          {differential && (
            <span className="font-display text-lg font-bold leading-none text-hue-deep">
              {differential}
            </span>
          )}
          {recent.rating === 'up' && (
            <ThumbsUp
              className="size-4 text-emerald-500"
              aria-label="Thumbs up"
            />
          )}
          {recent.rating === 'down' && (
            <ThumbsDown
              className="size-4 text-rose-500"
              aria-label="Thumbs down"
            />
          )}
          <span className="text-xs text-ink-faint">
            {course.rounds.length}{' '}
            {course.rounds.length === 1 ? 'round' : 'rounds'}
          </span>
        </div>
      )}
    </Link>
  )
}
