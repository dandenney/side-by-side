'use client'

import { useEffect, useState } from 'react'
import { getUrlItems } from '@/lib/supabase/url-items'

export function UrlListTest() {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchItems() {
      try {
        const data = await getUrlItems()
        setItems(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchItems()
  }, [])

  if (loading) return <div>Loading...</div>
  if (error) return <div>Error: {error}</div>

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">URL Items from Database</h2>
      <pre className="bg-gray-100 p-4 rounded overflow-auto">
        {JSON.stringify(items, null, 2)}
      </pre>
    </div>
  )
} 