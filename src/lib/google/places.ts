import { Client } from '@googlemaps/google-maps-services-js'

const client = new Client({})

export interface PlaceSearchResult {
  placeId: string
  name: string
  address: string
  lat: number
  lng: number
  types: string[]
  rating?: number
  userRatingsTotal?: number
  priceLevel?: number
}

export interface PlaceDetailsResult extends PlaceSearchResult {
  website?: string
  phoneNumber?: string
  openingHours?: {
    openNow: boolean
    periods?: {
      open: { day: number; time: string }
      close: { day: number; time: string }
    }[]
    weekdayText?: string[]
  }
  photoUrl?: string
}

export async function searchPlaces(query: string): Promise<PlaceSearchResult[]> {
  if (!process.env.GOOGLE_MAPS_API_KEY) {
    throw new Error('Google Maps API key is not configured')
  }

  try {
    const response = await client.textSearch({
      params: {
        query,
        key: process.env.GOOGLE_MAPS_API_KEY,
      },
    })

    if (response.data.status === 'REQUEST_DENIED') {
      throw new Error('Google Places API request was denied. Please check your API key configuration.')
    }

    if (response.data.status === 'ZERO_RESULTS') {
      return []
    }

    if (response.data.status !== 'OK') {
      throw new Error(`Google Places API error: ${response.data.status}`)
    }

    return response.data.results
      .filter(place => place.place_id && place.name && place.formatted_address && place.geometry?.location)
      .map(place => ({
        placeId: place.place_id!,
        name: place.name!,
        address: place.formatted_address!,
        lat: place.geometry!.location.lat,
        lng: place.geometry!.location.lng,
        types: place.types || [],
        rating: place.rating,
        userRatingsTotal: place.user_ratings_total,
        priceLevel: place.price_level,
      }))
  } catch (error) {
    console.error('Error searching places:', error)
    throw error
  }
}

export async function getPlaceDetails(placeId: string): Promise<PlaceDetailsResult> {
  if (!process.env.GOOGLE_MAPS_API_KEY) {
    throw new Error('Google Maps API key is not configured')
  }

  console.log('Fetching place details with params:', {
    placeId,
    apiKey: process.env.GOOGLE_MAPS_API_KEY?.substring(0, 5) + '...'
  })

  try {
    const response = await client.placeDetails({
      params: {
        place_id: placeId,
        key: process.env.GOOGLE_MAPS_API_KEY,
        fields: ['name', 'formatted_address', 'geometry', 'website', 'formatted_phone_number', 'opening_hours', 'photos']
      },
    })

    if (response.data.status !== 'OK' || !response.data.result) {
      throw new Error(`Google Places API error: ${response.data.status}`)
    }

    const place = response.data.result
    const photoUrl = place.photos?.[0]?.photo_reference 
      ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference=${place.photos[0].photo_reference}&key=${process.env.GOOGLE_MAPS_API_KEY}`
      : undefined

    return {
      placeId: place.place_id!,
      name: place.name!,
      address: place.formatted_address!,
      lat: place.geometry!.location.lat,
      lng: place.geometry!.location.lng,
      types: place.types || [],
      rating: place.rating,
      userRatingsTotal: place.user_ratings_total,
      priceLevel: place.price_level,
      website: place.website,
      phoneNumber: place.formatted_phone_number,
      openingHours: place.opening_hours ? {
        openNow: place.opening_hours.open_now,
        periods: place.opening_hours.periods?.filter(period => period.open && period.close).map(period => ({
          open: { 
            day: period.open.day, 
            time: period.open.time || '0000' 
          },
          close: { 
            day: period.close!.day, 
            time: period.close!.time || '0000' 
          }
        })),
        weekdayText: place.opening_hours.weekday_text
      } : undefined,
      photoUrl
    }
  } catch (error) {
    console.error('Error getting place details:', error)
    throw error
  }
} 