'use client'

import { UrlList } from '@/components/UrlList'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { SHARED_LIST_ID } from '@/lib/constants'
import { PlaceMap } from '@/components/PlaceMap'
import { Place } from '@/types/url-list'
import { getUrlItems } from '@/lib/supabase/url-items'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Star, Link as LinkIcon, Phone, Map, List, Edit2, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function LocalList() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [places, setPlaces] = useState<Place[]>([])
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
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

  const handlePlaceClick = (place: Place) => {
    setSelectedPlace(place)
    setIsDialogOpen(true)
  }

  if (loading || !user) {
    return null
  }

  return (
    <main className="bg-slate-100 h-[100dvh]">
      <div className="p-4 space-y-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-purple-900">Local Places</h1>
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
              <PlaceMap places={places} onPlaceClick={handlePlaceClick} />
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-500">No places with coordinates found</p>
              </div>
            )}
          </div>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50">
          {selectedPlace && (
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold">{selectedPlace.name}</h3>
                  <p className="text-sm text-gray-500">{selectedPlace.address}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      // TODO: Implement edit functionality
                    }}
                    className="p-2 hover:bg-gray-100 rounded-full"
                  >
                    <Edit2 className="w-5 h-5 text-gray-400" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      // TODO: Implement delete functionality
                    }}
                    className="p-2 hover:bg-gray-100 rounded-full"
                  >
                    <Trash2 className="w-5 h-5 text-gray-400" />
                  </button>
                </div>
              </div>

              {selectedPlace.rating && (
                <div className="flex items-center gap-1">
                  <span className="text-yellow-500">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${i < Math.round(selectedPlace.rating!) ? 'fill-current' : ''}`}
                      />
                    ))}
                  </span>
                  <span className="text-sm text-gray-500">
                    ({selectedPlace.userRatingsTotal || 0})
                  </span>
                </div>
              )}

              <div className="space-y-2">
                {selectedPlace.website && (
                  <a
                    href={selectedPlace.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-blue-500 hover:underline"
                  >
                    <LinkIcon className="w-4 h-4" />
                    Visit Website
                  </a>
                )}
                {selectedPlace.phoneNumber && (
                  <a
                    href={`tel:${selectedPlace.phoneNumber}`}
                    className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
                  >
                    <Phone className="w-4 h-4" />
                    {selectedPlace.phoneNumber}
                  </a>
                )}
              </div>

              {selectedPlace.openingHours?.weekdayText && (
                <div className="space-y-1">
                  <h4 className="font-medium">Opening Hours</h4>
                  <div className="text-sm space-y-1">
                    {selectedPlace.openingHours.weekdayText.map((text, i) => (
                      <p key={i} className="text-gray-600">{text}</p>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex justify-end gap-2 pt-4">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    // TODO: Implement edit functionality
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Edit
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    // TODO: Implement delete functionality
                  }}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                >
                  Delete
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </main>
  )
} 