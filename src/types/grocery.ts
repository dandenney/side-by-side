export const STORES = ['Publix', 'Costco', 'Aldi', 'K&S'] as const
export type Store = (typeof STORES)[number]

export interface GroceryItem {
  id: string
  name: string
  checked: boolean
  store: Store
  createdAt: Date
  updatedAt: Date
}

export interface GroceryList {
  items: GroceryItem[]
  archivedItems: GroceryItem[]
} 