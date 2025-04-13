'use client'

import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'

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
      className={`relative flex justify-between font-medium rounded-lg bg-gray-100 overflow-hidden ${className}`}
    >
      {/* Background indicator - using layout animation instead of entry/exit */}
      {activeButtonData && (
        <motion.div
          layout
          initial={false}
          className="absolute top-0 bottom-0 bg-gray-200 rounded-md z-0"
          animate={{
            x: activeButtonData.left,
            width: activeButtonData.width
          }}
          transition={{
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
          className={`relative z-10 flex-1 px-3 py-1.5 rounded-md transition-colors duration-200 ${value === option.value ? 'text-gray-700' : 'text-gray-400 hover:text-gray-500'
            }`}
        >
          {option.value}
        </button>
      ))}
    </div>
  )
}

export default AnimatedStoreSelector