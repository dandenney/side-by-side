export interface GroceryItem {
  id: string
  name: string
  checked: boolean
  createdAt: Date
  updatedAt: Date
}

export interface GroceryList {
  items: GroceryItem[]
  archivedItems: GroceryItem[]
} 