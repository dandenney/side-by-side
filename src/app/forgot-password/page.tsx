'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import Link from 'next/link'
import AuthShell from '@/components/AuthShell'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const { resetPassword } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await resetPassword(email)
      setSuccess(true)
    } catch (err) {
      setError('Failed to send reset email. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <AuthShell
        title="Check your email"
        subtitle={
          <>
            We&apos;ve sent a password reset link to <strong className="text-ink">{email}</strong>.
            Click the link in the email to reset your password.
          </>
        }
      >
        <Link href="/login" className="btn-quiet w-full">
          Back to sign in
        </Link>
      </AuthShell>
    )
  }

  return (
    <AuthShell
      title="Reset your password"
      subtitle="Enter your email address and we'll send you a link to reset your password."
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div>
          <label htmlFor="email" className="field-label">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            className="field"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        {error && <p className="text-sm font-medium text-rose-600">{error}</p>}

        <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-50">
          {loading ? 'Sending…' : 'Send reset link'}
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
