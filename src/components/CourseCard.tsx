'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Flag, ImageIcon, ThumbsDown, ThumbsUp } from 'lucide-react'
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
      className="card flex flex-col overflow-hidden transition-shadow duration-150 hover:shadow-pop"
    >
      <div className="relative w-full overflow-hidden bg-surface-2" style={{ aspectRatio: '16/9' }}>
        {course.imageUrl ? (
          <Image
            src={course.imageUrl}
            alt={course.name}
            fill
            className="object-cover ring-1 ring-inset ring-black/10"
            sizes="(max-width: 768px) 100vw, 50vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-ink-faint/50">
            <ImageIcon className="size-8" />
          </div>
        )}

        {/* A played course in the wishlist needs to read as "been there, going
            back" at a glance, without losing its place on the list. */}
        {showPlayedMarker && played && (
          <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-surface/90 px-2 py-1 text-xs font-medium text-ink-soft backdrop-blur-sm">
            <Flag className="size-3" />
            Played
          </span>
        )}

        {played && recent && differential && (
          <span className="absolute right-2 top-2 inline-flex items-center gap-1.5 rounded-full bg-surface/90 px-2.5 py-1 backdrop-blur-sm">
            <span className="font-display text-sm font-bold leading-none text-hue-deep">
              {differential}
            </span>
            {recent.rating === 'up' && (
              <ThumbsUp className="size-3.5 text-emerald-500" aria-label="Thumbs up" />
            )}
            {recent.rating === 'down' && (
              <ThumbsDown className="size-3.5 text-rose-500" aria-label="Thumbs down" />
            )}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1 p-3">
        <p className="text-[15px] font-semibold leading-snug text-ink text-balance">
          {course.name}
        </p>

        {course.address && (
          <p className="truncate text-sm text-ink-soft">{course.address}</p>
        )}

        <p className="mt-auto flex flex-wrap items-center gap-x-2 gap-y-1 pt-1 text-xs text-ink-faint">
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
          {played && (
            <>
              <span aria-hidden>·</span>
              <span>
                {course.rounds.length}{' '}
                {course.rounds.length === 1 ? 'round' : 'rounds'}
              </span>
            </>
          )}
        </p>
      </div>
    </Link>
  )
}
