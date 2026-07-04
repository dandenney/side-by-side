'use client'

import { useState, useRef, useEffect } from 'react'
import { Tag as TagIcon, X, Check } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Tag } from '@/types/url-list'

type TagInputProps = {
  existingTags: Tag[]
  selectedTags?: Tag[]
  onTagSelect: (tag: Tag) => void
  onTagRemove: (tagId: string) => void
  onCreateTag?: (name: string) => Promise<Tag>
  listType: 'local' | 'shared'
  listId: string
  placeholder?: string
}

export default function TagInput({ 
  existingTags, 
  selectedTags = [],
  onTagSelect, 
  onTagRemove,
  onCreateTag,
  listType,
  listId,
  placeholder = 'Add tag...' 
}: TagInputProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  // Filter existing tags based on input
  const filteredTags = existingTags.filter(tag => 
    tag.name.toLowerCase().includes(inputValue.toLowerCase()) &&
    !selectedTags.some(selected => selected.id === tag.id)
  )

  // Handle tag selection
  const handleSelectTag = (tag: Tag) => {
    onTagSelect(tag)
    setInputValue('')
    setIsOpen(false)
  }

  // Handle creating new tag
  const handleCreateTag = async () => {
    if (inputValue.trim()) {
      if (onCreateTag) {
        try {
          const newTag = await onCreateTag(inputValue.trim())
          onTagSelect(newTag)
        } catch (error) {
          console.error('Error creating tag:', error)
        }
      } else {
        const newTag: Tag = {
          id: crypto.randomUUID(),
          name: inputValue.trim(),
          listId,
          listType,
          createdAt: new Date()
        }
        onTagSelect(newTag)
      }
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
    <div className="space-y-2">
      {/* Selected Tags */}
      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedTags.map(tag => (
            <div
              key={tag.id}
              className="flex items-center gap-1 rounded-full bg-tint py-1 pl-2.5 pr-1.5 text-sm font-medium text-tint-ink"
            >
              <span>{tag.name}</span>
              <button
                onClick={() => onTagRemove(tag.id)}
                aria-label={`Remove ${tag.name}`}
                className="flex size-6 items-center justify-center rounded-full text-tint-ink/70 hover:text-tint-ink"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Tag Input */}
      <div className="relative">
        <div className="flex items-center gap-2">
          <TagIcon className="size-4 text-ink-faint" />
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onFocus={() => setIsOpen(true)}
            placeholder={placeholder}
            className="flex-1 border-none bg-transparent text-base text-ink outline-none placeholder:text-ink-faint"
          />
        </div>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute z-10 mt-2 max-h-60 w-full overflow-y-auto rounded-2xl border border-line bg-surface shadow-soft"
            >
              <div className="p-2">
                {filteredTags.length > 0 ? (
                  filteredTags.map(tag => (
                    <div
                      key={tag.id}
                      onClick={() => handleSelectTag(tag)}
                      className="flex cursor-pointer items-center justify-between rounded-2xl p-3 hover:bg-surface-2"
                    >
                      <span className="text-base text-ink">{tag.name}</span>
                      <Check className="size-4 text-hue" />
                    </div>
                  ))
                ) : (
                  <div
                    onClick={handleCreateTag}
                    className="cursor-pointer rounded-2xl p-3 hover:bg-surface-2"
                  >
                    <span className="text-base text-ink-soft">
                      Create &ldquo;{inputValue}&rdquo;
                    </span>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
} 