'use client'

import { ShoppingList } from './ShoppingList'

export function GroceryList() {
  return (
    <ShoppingList
      title="Groceries"
      gradientFrom="from-green-700"
      gradientTo="to-green-600"
      textColor="text-green-800"
      titleColor="text-white"
      accentColor="text-green-600"
      iconColor="text-green-600"
      buttonGradientFrom="from-green-600"
      buttonGradientTo="to-green-700"
      buttonAccentColor="ring-green-800"
    />
  )
} 