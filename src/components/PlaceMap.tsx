import { useEffect, useState } from 'react'
import { Place } from '@/types/url-list'
import { MapPin, Link, Star } from 'lucide-react'

interface PlaceMapProps {
  places: Place[]
  className?: string
  onPlaceClick?: (place: Place) => void
}

export function PlaceMap({ places, className = '', onPlaceClick }: PlaceMapProps) {
  const [mapLoaded, setMapLoaded] = useState(false)
  const [mapError, setMapError] = useState<string | null>(null)

  useEffect(() => {
    // Load Google Maps script
    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`
    script.async = true
    script.onload = () => {
      setMapLoaded(true)
      initializeMap()
    }
    script.onerror = () => {
      setMapError('Failed to load Google Maps')
    }
    document.head.appendChild(script)

    return () => {
      document.head.removeChild(script)
    }
  }, [])

  const initializeMap = () => {
    if (typeof google === 'undefined') return

    const mapElement = document.getElementById('map')
    if (!mapElement) return

    const map = new google.maps.Map(mapElement, {
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
    })

    // Calculate bounds to fit all markers
    const bounds = new google.maps.LatLngBounds()
    const markers: google.maps.Marker[] = []
    const infoWindows: google.maps.InfoWindow[] = []

    places.forEach(place => {
      // Verify coordinates are valid
      if (Math.abs(place.lat) > 90 || Math.abs(place.lng) > 180) {
        console.warn(`Invalid coordinates for place ${place.name}: ${place.lat}, ${place.lng}`)
        return
      }

      const position = { lat: place.lat, lng: place.lng }
      bounds.extend(position)

      // Create marker
      const marker = new google.maps.Marker({
        position,
        map,
        title: place.name,
        animation: google.maps.Animation.DROP,
      })

      // Create info window content
      const content = `
        <div class="p-2 max-w-xs">
          <h3 class="font-semibold text-lg mb-1">${place.name}</h3>
          <p class="text-sm text-gray-600 mb-2">${place.address}</p>
          ${place.rating ? `
            <div class="flex items-center gap-1 mb-2">
              <span class="text-yellow-500">${'★'.repeat(Math.round(place.rating))}${'☆'.repeat(5 - Math.round(place.rating))}</span>
              <span class="text-sm text-gray-500">(${place.userRatingsTotal || 0} reviews)</span>
            </div>
          ` : ''}
          ${place.website ? `
            <a href="${place.website}" target="_blank" class="text-blue-500 hover:underline text-sm flex items-center gap-1">
              <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
              </svg>
              Visit Website
            </a>
          ` : ''}
        </div>
      `

      // Create info window
      const infoWindow = new google.maps.InfoWindow({
        content,
        maxWidth: 300,
      })

      // Add click handlers
      marker.addListener('click', () => {
        // Close all other info windows
        infoWindows.forEach(window => window.close())
        // Open this info window
        infoWindow.open(map, marker)
        // Call the onPlaceClick callback if provided
        if (onPlaceClick) {
          onPlaceClick(place)
        }
      })

      markers.push(marker)
      infoWindows.push(infoWindow)
    })

    // Fit map to show all markers
    if (markers.length > 0) {
      map.fitBounds(bounds)
    } else {
      // Default to a reasonable center if no valid markers
      map.setCenter({ lat: 0, lng: 0 })
      map.setZoom(2)
    }
  }

  if (mapError) {
    return (
      <div className={`bg-gray-100 rounded-lg p-4 text-center ${className}`}>
        <p className="text-red-500">{mapError}</p>
      </div>
    )
  }

  return (
    <div className={`relative ${className}`}>
      <div id="map" className="w-full h-[500px] rounded-lg" />
    </div>
  )
} 