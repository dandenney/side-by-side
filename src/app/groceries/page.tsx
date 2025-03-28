import { GroceryList } from '@/components/GroceryList'

export default function GroceriesPage() {
  return (
    <main className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-center text-md font-bold mb-4 uppercase">Groceries</h1>
        <GroceryList />
      </div>
    </main>
  )
} 