'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, useReducedMotion } from 'framer-motion'

interface AnimatedStoreSelectorProps {
  value: 'Publix' | 'Costco' | 'Aldi'
  onChange: (value: 'Publix' | 'Costco' | 'Aldi') => void
  className?: string
  storeOptions?: ReadonlyArray<{ readonly value: 'Publix' | 'Costco' | 'Aldi'; readonly color: string }>
}

const AnimatedStoreSelector = ({
  value,
  onChange,
  className,
  storeOptions = [
    { value: 'Publix', color: 'green' },
    { value: 'Costco', color: 'blue' },
    { value: 'Aldi', color: 'orange' }
  ]
}: AnimatedStoreSelectorProps) => {
  // Track position of the active element
  const [activeButtonData, setActiveButtonData] = useState<{ left: number; width: number } | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)
  const shouldReduceMotion = useReducedMotion()

  // Create refs for measuring button positions
  const containerRef = useRef<HTMLDivElement>(null)
  const buttonRefs = useRef<Record<string, HTMLButtonElement | null>>({})

  // Initial setup and position updates
  useEffect(() => {
    // Function to calculate and set active button position
    const updateActiveButtonPosition = () => {
      if (!containerRef.current || !buttonRefs.current[value]) return

      const containerRect = containerRef.current.getBoundingClientRect()
      const buttonRect = buttonRefs.current[value].getBoundingClientRect()

      setActiveButtonData({
        left: buttonRect.left - containerRect.left,
        width: buttonRect.width
      })

      if (!isInitialized) {
        setIsInitialized(true)
      }
    }

    // Update positions on mount and when value changes
    updateActiveButtonPosition()

    // Also update on resize to handle responsive layouts
    window.addEventListener('resize', updateActiveButtonPosition)
    return () => window.removeEventListener('resize', updateActiveButtonPosition)
  }, [value, isInitialized])

  return (
    <div
      ref={containerRef}
      className={`relative flex justify-between overflow-hidden rounded-full bg-surface-2 p-1 font-medium ${className}`}
    >
      {/* Background indicator - using layout animation instead of entry/exit */}
      {activeButtonData && (
        <motion.div
          layout
          initial={false}
          className="absolute bottom-1 top-1 z-0 rounded-full bg-tint"
          animate={{
            x: activeButtonData.left,
            width: activeButtonData.width
          }}
          transition={shouldReduceMotion ? { duration: 0 } : {
            type: "spring",
            stiffness: 500,
            damping: 40,
            mass: 1
          }}
        />
      )}

      {/* Store options */}
      {storeOptions.map((option) => (
        <button
          key={option.value}
          ref={el => { buttonRefs.current[option.value] = el }}
          onClick={() => onChange(option.value)}
          className={`relative z-10 flex-1 rounded-full px-3 py-1.5 text-sm transition-colors duration-200 ${
            value === option.value ? 'font-semibold text-tint-ink' : 'text-ink-faint hover:text-ink-soft'
          }`}
        >
          {option.value}
        </button>
      ))}
    </div>
  )
}

export default AnimatedStoreSelector