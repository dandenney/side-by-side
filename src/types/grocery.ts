export interface GroceryItem {
  id: string
  name: string
  checked: boolean
  store: 'Publix' | 'Costco' | 'Aldi'
  createdAt: Date
  updatedAt: Date
}

export interface GroceryList {
  items: GroceryItem[]
  archivedItems: GroceryItem[]
} 