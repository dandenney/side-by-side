'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Link as LinkIcon, MapPin, ShoppingBasket } from 'lucide-react'
import Link from 'next/link'

type PageCardProps = {
  title: string
  description: string
  href: string
  icon: React.ReactNode
  gradientFrom: string
  gradientTo: string
}

function PageCard({ title, description, href, icon, gradientFrom, gradientTo }: PageCardProps) {
  return (
    <Link href={href}>
      <div className={`group relative overflow-hidden rounded-xl bg-gradient-to-br ${gradientFrom} ${gradientTo} p-6 transition-all hover:scale-[1.02]`}>
        <div className="absolute inset-0 bg-white/10 opacity-0 transition-opacity group-hover:opacity-100" />
        <div className="relative flex items-center gap-4">
          <div className="rounded-lg bg-white/10 p-3">
            {icon}
          </div>
          <div>
            <h2 className="text-xl font-semibold text-white">{title}</h2>
            <p className="mt-1 text-sm text-white/80">{description}</p>
          </div>
        </div>
      </div>
    </Link>
  )
}

export default function HomePage() {
  const { user, loading, signOut } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  if (loading || !user) {
    return null
  }

  const pages = [
    {
      title: 'Local',
      description: 'Your personal collection of links and resources',
      href: '/local',
      icon: <MapPin className="h-6 w-6 text-white" />,
      gradientFrom: 'from-purple-500',
      gradientTo: 'to-purple-600',
    },
    {
      title: 'Shares',
      description: 'Links and resources shared with you',
      href: '/shares',
      icon: <LinkIcon className="h-6 w-6 text-white" />,
      gradientFrom: 'from-blue-500',
      gradientTo: 'to-blue-600',
    },
    {
      title: 'Groceries',
      description: 'Manage your shopping lists',
      href: '/groceries',
      icon: <ShoppingBasket className="h-6 w-6 text-white" />,
      gradientFrom: 'from-green-500',
      gradientTo: 'to-green-600',
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold">Side by Side</h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-gray-700">{user.email}</span>
              <button
                onClick={() => signOut()}
                className="rounded-md bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-200"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Welcome back, {user.email}</h2>
          <p className="mt-2 text-gray-600">Choose a section to get started</p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {pages.map((page) => (
            <PageCard key={page.href} {...page} />
          ))}
        </div>
      </main>
    </div>
  )
}
