export interface UpcomingItem {
  id: string
  title: string
  description?: string
  url?: string
  imageUrl?: string
  location?: string
  startDate: string
  endDate: string
  status: 'tickets' | 'definitely' | 'maybe'
  createdAt: string
  updatedAt: string
}

export interface UpcomingItemForm {
  title: string
  description?: string
  url?: string
  imageUrl?: string
  location?: string
  startDate: string
  endDate: string
  status: 'tickets' | 'definitely' | 'maybe'
} 