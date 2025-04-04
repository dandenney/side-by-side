import { useState, useRef, useEffect } from 'react'
import { Tag as TagIcon, X, Check } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Tag } from '@/types/url-list'

type TagInputProps = {
  existingTags: Tag[]
  onTagSelect: (tag: Tag) => void
  onTagRemove: (tagId: string) => void
  listType: 'local' | 'shared'
  listId: string
  placeholder?: string
}

export default function TagInput({ 
  existingTags, 
  onTagSelect, 
  onTagRemove,
  listType,
  listId,
  placeholder = 'Add tag...' 
}: TagInputProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  // Filter existing tags based on input
  const filteredTags = existingTags.filter(tag => 
    tag.name.toLowerCase().includes(inputValue.toLowerCase())
  )

  // Handle tag selection
  const handleSelectTag = (tag: Tag) => {
    onTagSelect(tag)
    setInputValue('')
    setIsOpen(false)
  }

  // Handle creating new tag
  const handleCreateTag = () => {
    if (inputValue.trim()) {
      const newTag: Tag = {
        id: crypto.randomUUID(),
        name: inputValue.trim(),
        listId,
        listType,
        createdAt: new Date()
      }
      onTagSelect(newTag)
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
          onChange={(e) => setInputValue(e.target.value)}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className="flex-1 bg-transparent border-none outline-none text-sm"
        />
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute z-10 w-full mt-2 bg-white rounded-lg shadow-lg border border-gray-200"
          >
            <div className="max-h-60 overflow-y-auto p-2">
              {filteredTags.length > 0 ? (
                filteredTags.map(tag => (
                  <div
                    key={tag.id}
                    onClick={() => handleSelectTag(tag)}
                    className="flex items-center justify-between p-2 hover:bg-gray-100 rounded-lg cursor-pointer"
                  >
                    <span className="text-sm">{tag.name}</span>
                    <Check className="w-4 h-4 text-green-500" />
                  </div>
                ))
              ) : (
                <div
                  onClick={handleCreateTag}
                  className="p-2 hover:bg-gray-100 rounded-lg cursor-pointer"
                >
                  <span className="text-sm text-gray-500">
                    Create "{inputValue}"
                  </span>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
} 