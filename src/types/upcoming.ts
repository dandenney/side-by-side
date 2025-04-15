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
  listId: string
  createdAt: Date
  updatedAt: Date
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