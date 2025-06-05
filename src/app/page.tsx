'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Link as LinkIcon, MapPin, ShoppingBasket } from 'lucide-react'
import Link from 'next/link'
import UpcomingList from '@/components/UpcomingList'

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
          <div className="rounded-2xl bg-white/10 p-3">
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
  const { user, loading } = useAuth()
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
    <main className="bg-blue-50 pb-20 px-4 min-h-[100dvh]">
      <UpcomingList />
    </main>
  )
}
