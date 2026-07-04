'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, useReducedMotion } from 'framer-motion'
import {
  BellElectric,
  ShoppingBasket,
  MapPin,
  Link as LinkIcon,
  ChefHat,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

const TABS = [
  { section: 'upcoming', label: 'Upcoming', href: '/', icon: BellElectric },
  { section: 'groceries', label: 'Groceries', href: '/groceries', icon: ShoppingBasket },
  { section: 'local', label: 'Local', href: '/local', icon: MapPin },
  { section: 'shares', label: 'Shares', href: '/shares', icon: LinkIcon },
  { section: 'recipes', label: 'Recipes', href: '/recipes', icon: ChefHat },
] as const

const AUTH_ROUTES = ['/login', '/signup', '/forgot-password', '/reset-password']

export default function TabBar() {
  const pathname = usePathname()
  const { user } = useAuth()
  const shouldReduceMotion = useReducedMotion()

  if (!user || AUTH_ROUTES.some((route) => pathname.startsWith(route))) {
    return null
  }

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' || pathname === '/upcoming' : pathname.startsWith(href)

  return (
    <nav
      aria-label="Sections"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line-soft bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-sm md:inset-x-auto md:bottom-auto md:left-1/2 md:top-4 md:-translate-x-1/2 md:rounded-full md:border md:border-line-soft md:pb-0 md:shadow-soft"
    >
      <ul className="mx-auto flex max-w-md items-stretch justify-between px-2 md:max-w-none md:gap-1 md:px-2 md:py-1.5">
        {TABS.map(({ section, label, href, icon: Icon }) => {
          const active = isActive(href)
          return (
            <li key={href} data-section={section} className="flex-1 md:flex-none">
              <Link
                href={href}
                aria-current={active ? 'page' : undefined}
                className="relative flex min-h-[56px] flex-col items-center justify-center gap-0.5 px-1 py-1.5 md:min-h-[44px] md:flex-row md:gap-2 md:rounded-full md:px-4"
              >
                {active && (
                  <motion.span
                    layoutId="tab-glow"
                    transition={
                      shouldReduceMotion
                        ? { duration: 0 }
                        : { type: 'spring', stiffness: 500, damping: 38 }
                    }
                    className="absolute inset-x-1 inset-y-1 rounded-2xl bg-tint md:inset-0 md:rounded-full"
                    aria-hidden
                  />
                )}
                <Icon
                  className={`relative size-6 transition-colors duration-150 md:size-5 ${
                    active ? 'text-tint-ink' : 'text-ink-faint'
                  }`}
                  strokeWidth={active ? 2.25 : 2}
                />
                <span
                  className={`relative text-[11px] font-medium leading-tight transition-colors duration-150 md:text-sm ${
                    active ? 'text-tint-ink' : 'text-ink-faint'
                  }`}
                >
                  {label}
                </span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
