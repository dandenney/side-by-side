'use client'

import { UrlList } from '@/components/UrlList'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { SHARED_LIST_ID } from '@/lib/constants'
import { PlaceMap } from '@/components/PlaceMap'
import { Place } from '@/types/url-list'
import { getUrlItems } from '@/lib/supabase/url-items'
import { Map, List } from 'lucide-react'
import { Button } from '@/components/ui/button'

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

  return (
    <main className="bg-purple-100 min-h-[100dvh] pb-24">
      <div className="p-4 space-y-4">
        <div className="flex justify-between items-center">
          <div className="flex gap-2">
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              onClick={() => setViewMode('list')}
              className="flex items-center gap-2"
            >
              <List className="w-4 h-4" />
              List View
            </Button>
            <Button
              variant={viewMode === 'map' ? 'default' : 'outline'}
              onClick={() => setViewMode('map')}
              className="flex items-center gap-2"
            >
              <Map className="w-4 h-4" />
              Map View
            </Button>
          </div>
        </div>

        {viewMode === 'list' ? (
          <UrlList
            title="Local"
            textColor="text-purple-900"
            titleColor="text-purple-900"
            accentColor="text-purple-500"
            iconColor="text-purple-500"
            buttonGradientFrom="from-purple-500"
            buttonGradientTo="to-purple-600"
            buttonAccentColor="text-purple-500"
            listType="local"
            listId={SHARED_LIST_ID}
          />
        ) : (
          <div className="h-[calc(100dvh-8rem)]">
            {places.length > 0 ? (
              <PlaceMap places={places} />
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-500">No places with coordinates found</p>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  )
} 