'use client'

import { UrlList } from '@/components/UrlList'
import PageHeader from '@/components/PageHeader'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { SHARED_LIST_ID } from '@/lib/constants'
import { PlaceMap } from '@/components/PlaceMap'
import { Place } from '@/types/url-list'
import { getUrlItems } from '@/lib/supabase/url-items'
import { Map, List } from 'lucide-react'

export default function LocalList() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [places, setPlaces] = useState<Place[]>([])
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list')

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  useEffect(() => {
    const loadPlaces = async () => {
      try {
        const items = await getUrlItems('local', SHARED_LIST_ID)
        const placesWithCoords = items
          .filter(item => item.place?.lat && item.place?.lng)
          .map(item => item.place!)
        setPlaces(placesWithCoords)
      } catch (error) {
        console.error('Error loading places:', error)
      }
    }

    if (user) {
      loadPlaces()
    }
  }, [user])

  if (loading || !user) {
    return null
  }

  const viewOptions = [
    { key: 'list', label: 'List', icon: List },
    { key: 'map', label: 'Map', icon: Map },
  ] as const

  return (
    <main data-section="local" className="min-h-[100dvh] bg-wash px-4 pb-24">
      <PageHeader
        title="Local"
        note="Places we want to check out"
        actions={
          <div className="flex rounded-full bg-surface-2 p-1" role="group" aria-label="View mode">
            {viewOptions.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setViewMode(key)}
                aria-pressed={viewMode === key}
                className={`flex min-h-[36px] items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm transition-colors duration-150 ${
                  viewMode === key
                    ? 'bg-tint font-semibold text-tint-ink'
                    : 'font-medium text-ink-faint hover:text-ink-soft'
                }`}
              >
                <Icon className="size-4" />
                {label}
              </button>
            ))}
          </div>
        }
      />

      {viewMode === 'list' ? (
        <UrlList listType="local" listId={SHARED_LIST_ID} />
      ) : (
        <div className="mx-auto h-[calc(100dvh-14rem)] w-full max-w-md overflow-hidden rounded-3xl border border-line-soft shadow-soft md:max-w-2xl lg:max-w-4xl">
          {places.length > 0 ? (
            <PlaceMap places={places} />
          ) : (
            <div className="flex h-full items-center justify-center bg-surface">
              <p className="text-sm text-ink-soft">No places with map pins yet</p>
            </div>
          )}
        </div>
      )}
    </main>
  )
}
