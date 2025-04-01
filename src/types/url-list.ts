export interface UrlListItem {
  id: string
  url: string
  imageUrl: string
  title: string
  description: string
  tag?: string
  notes?: string
  dateRange?: {
    start: Date
    end: Date
  }
  createdAt: Date
  updatedAt: Date
}

export interface UrlList {
  items: UrlListItem[]
  archivedItems: UrlListItem[]
} 