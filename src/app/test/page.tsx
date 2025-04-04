'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function TestPage() {
  const [status, setStatus] = useState<'loading' | 'connected' | 'error'>('loading')
  const [error, setError] = useState<string | null>(null)
  const [config, setConfig] = useState<{
    url: string | null
    hasAnonKey: boolean
  }>({
    url: null,
    hasAnonKey: false
  })

  useEffect(() => {
    // First check if environment variables are properly loaded
    setConfig({
      url: process.env.NEXT_PUBLIC_SUPABASE_URL || null,
      hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    })

    async function testConnection() {
      try {
        // Test basic client initialization
        if (!supabase) {
          throw new Error('Supabase client not initialized')
        }

        // Test the connection with a simple health check
        const { data, error } = await supabase.auth.getSession()

        if (error) {
          console.error('Supabase error:', error)
          throw error
        }

        setStatus('connected')
      } catch (e) {
        console.error('Connection error:', e)
        setStatus('error')
        setError(e instanceof Error ? e.message : 'Unknown error')
      }
    }

    testConnection()
  }, [])

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Supabase Connection Test</h1>
      <div className="space-y-4">
        <div className="space-y-2">
          <h2 className="text-lg font-semibold">Environment Configuration:</h2>
          <p>Supabase URL: {config.url ? '✅ Present' : '❌ Missing'}</p>
          <p>Anon Key: {config.hasAnonKey ? '✅ Present' : '❌ Missing'}</p>
        </div>
        <div className="space-y-2">
          <h2 className="text-lg font-semibold">Connection Status:</h2>
          <p>Status: {status}</p>
          {error && (
            <div className="text-red-500">
              <p>Error: {error}</p>
              <p className="text-sm mt-2">Check the browser console for more details.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 