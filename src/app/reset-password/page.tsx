'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import AuthShell from '@/components/AuthShell'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [isValidSession, setIsValidSession] = useState(false)
  const [checkingSession, setCheckingSession] = useState(true)
  const { updatePassword } = useAuth()
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()

    // Listen for the PASSWORD_RECOVERY event which fires when user clicks reset link
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsValidSession(true)
        setCheckingSession(false)
      } else if (event === 'SIGNED_IN' && session) {
        // User might already have a session from the recovery token
        setIsValidSession(true)
        setCheckingSession(false)
      }
    })

    // Also check if there's already a valid session (in case the event already fired)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setIsValidSession(true)
      }
      setCheckingSession(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!isValidSession) {
      setError('Invalid or expired reset link. Please request a new password reset.')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setLoading(true)
    try {
      await updatePassword(password)
      setSuccess(true)
      setTimeout(() => {
        router.push('/login')
      }, 2000)
    } catch (err) {
      setError('Failed to update password. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (checkingSession) {
    return (
      <AuthShell title="Verifying reset link…">
        <p className="text-sm text-ink-soft">One moment.</p>
      </AuthShell>
    )
  }

  if (!isValidSession) {
    return (
      <AuthShell
        title="Invalid reset link"
        subtitle="This password reset link is invalid or has expired."
      >
        <p className="text-center text-sm">
          <Link href="/forgot-password" className="font-medium text-hue hover:underline">
            Request a new password reset
          </Link>
        </p>
      </AuthShell>
    )
  }

  if (success) {
    return (
      <AuthShell
        title="Password updated!"
        subtitle="Your password has been successfully updated. Redirecting to login…"
      >
        <></>
      </AuthShell>
    )
  }

  return (
    <AuthShell title="Set new password" subtitle="Enter your new password below.">
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div>
          <label htmlFor="password" className="field-label">
            New password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            className="field"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="confirm-password" className="field-label">
            Confirm new password
          </label>
          <input
            id="confirm-password"
            name="confirm-password"
            type="password"
            autoComplete="new-password"
            required
            className="field"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </div>

        {error && <p className="text-sm font-medium text-rose-600">{error}</p>}

        <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-50">
          {loading ? 'Updating…' : 'Update password'}
        </button>

        <p className="text-center text-sm">
          <Link href="/login" className="font-medium text-hue hover:underline">
            Back to sign in
          </Link>
        </p>
      </form>
    </AuthShell>
  )
}
