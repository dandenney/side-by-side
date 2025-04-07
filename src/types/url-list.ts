export interface DateRange {
  start: string
  end: string
}

export interface UrlListItem {
  id: string
  url: string
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