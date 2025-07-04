'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MapPin, Menu, X, ShoppingBasket, Link as LinkIcon, BellElectric } from 'lucide-react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'

export default function AppDrawer() {
  const [isOpen, setIsOpen] = useState(false)
  const { signOut } = useAuth()

  const menuItems = [
    { icon: ShoppingBasket, label: 'Groceries', href: '/groceries' },
    { icon: BellElectric, label: 'Upcoming', href: '/' },
    { icon: MapPin, label: 'Local', href: '/local' },
    { icon: LinkIcon, label: 'Shares', href: '/shares' },
  ]

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="p-2 hover:bg-gray-100 rounded-2xl"
      >
        <Menu className="w-6 h-6 text-gray-600" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/20 z-40"
            />

            {/* Drawer */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 20 }}
              className="fixed left-0 bottom-0 right-0 bg-white max-w-md mx-auto rounded-t-2xl shadow-xl z-50 max-h-[80vh] overflow-y-auto"
            >
              <div className="p-4 border-b">
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => signOut()}
                    className="rounded-md bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-200"
                  >
                    Sign out
                  </button>
                  <h2 className="text-lg font-semibold">Side by Side</h2>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-2 hover:bg-gray-100 rounded-2xl"
                  >
                    <X className="w-5 h-5 text-gray-600" />
                  </button>
                </div>
              </div>

              <nav className="p-4">
                <ul className="space-y-2">
                  {menuItems.map((item) => (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={() => setIsOpen(false)}
                        className="flex items-center gap-3 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-2xl"
                      >
                        <item.icon className="w-5 h-5" />
                        <span>{item.label}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
} 