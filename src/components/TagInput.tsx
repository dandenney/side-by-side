import { useState, useRef, useEffect } from 'react'
import { Tag as TagIcon, X, Check } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

type TagInputProps = {
  value: string
  onChange: (value: string) => void
  existingTags: string[]
  placeholder?: string
}

export default function TagInput({ value, onChange, existingTags, placeholder = 'Add tag...' }: TagInputProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  // Filter existing tags based on input
  const filteredTags = existingTags.filter(tag => 
    tag.toLowerCase().includes(inputValue.toLowerCase())
  )

  // Handle tag selection
  const handleSelectTag = (tag: string) => {
    onChange(tag)
    setInputValue('')
    setIsOpen(false)
  }

  // Handle creating new tag
  const handleCreateTag = () => {
    if (inputValue.trim()) {
      onChange(inputValue.trim())
      setInputValue('')
      setIsOpen(false)
    }
  }

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  return (
    <div className="relative">
      <div className="flex items-center gap-2">
        <TagIcon className="w-4 h-4 text-gray-400" />
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value)
            setIsOpen(true)
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className="flex-1 bg-transparent border-none focus:outline-none text-sm"
        />
        {value && (
          <button
            onClick={() => onChange('')}
            className="p-1 hover:bg-gray-100 rounded-full"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        )}
      </div>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-40"
            />

            {/* Dropdown */}
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              className="absolute left-0 right-0 mt-1 bg-white rounded-lg shadow-lg border z-50 max-h-48 overflow-y-auto"
            >
              {filteredTags.length > 0 ? (
                <ul className="py-1">
                  {filteredTags.map((tag) => (
                    <li key={tag}>
                      <button
                        onClick={() => handleSelectTag(tag)}
                        className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-gray-50 ${
                          value === tag ? 'text-blue-500' : 'text-gray-700'
                        }`}
                      >
                        {value === tag && <Check className="w-4 h-4" />}
                        {tag}
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <button
                  onClick={handleCreateTag}
                  className="w-full px-3 py-2 text-left text-sm text-blue-500 hover:bg-gray-50"
                >
                  Create "{inputValue}"
                </button>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
} 