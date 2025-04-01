'use client'

import { ShoppingList } from './ShoppingList'

export function CostcoList() {
  return (
    <ShoppingList
      title="Costco"
      gradientFrom="from-blue-700"
      gradientTo="to-blue-600"
      textColor="text-blue-800"
      accentColor="text-blue-600"
      iconColor="text-blue-600"
      buttonGradientFrom="from-blue-600"
      buttonGradientTo="to-blue-700"
      buttonAccentColor="ring-blue-800"
    />
  )
} 