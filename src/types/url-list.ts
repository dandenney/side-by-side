export interface DateRange {
  start: string
  end: string
}

export interface Place {
  placeId: string
  name: string
  address: string
  lat: number
  lng: number
  types: string[]
  rating?: number
  userRatingsTotal?: number
  priceLevel?: number
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
}

export interface UrlListItem {
  id: string
  url?: string
  place?: Place
  imageUrl?: string
  title: string
  description?: string
  notes?: string
  dateRange?: DateRange
  listType: 'local' | 'shared'
  listId: string
  createdAt: Date
  updatedAt: Date
  archived?: boolean
  tags?: Tag[]  // Will be populated when fetching items
}

export interface Tag {
  id: string
  name: string
  listId: string
  listType: 'local' | 'shared'
  createdAt: Date
}

export interface UrlList {
  items: UrlListItem[]
  archivedItems: UrlListItem[]
} 