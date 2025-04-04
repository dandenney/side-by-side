'use client'

import { useState, useMemo } from 'react'
import { UrlListItem, Tag } from '@/types/url-list'
import { Plus, Trash2, Edit2, X, Link, Tag as LucideTag, StickyNote, Archive, Search } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import AppDrawer from './AppDrawer'
import TagInput from './TagInput'

type UrlListProps = {
  title: string
  gradientFrom: string
  gradientTo: string
  textColor: string
  titleColor: string
  accentColor: string
  iconColor: string
  buttonGradientFrom: string
  buttonGradientTo: string
  buttonAccentColor: string
}

export function UrlList({
  title,
  gradientFrom,
  gradientTo,
  textColor,
  titleColor,
  accentColor,
  iconColor,
  buttonGradientFrom,
  buttonGradientTo,
  buttonAccentColor,
}: UrlListProps) {
  const [items, setItems] = useState<UrlListItem[]>([])
  const [newUrl, setNewUrl] = useState('')
  const [selectedItem, setSelectedItem] = useState<UrlListItem | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [editingItem, setEditingItem] = useState<UrlListItem | null>(null)
  const [editForm, setEditForm] = useState<Partial<UrlListItem>>({})
  const [selectedTags, setSelectedTags] = useState<Tag[]>([])

  const hasArchivedItems = useMemo(() => items.some(item => item.archived), [items])

  // Get unique tags from all items
  const existingTags = useMemo(() => {
    const tags = new Map<string, Tag>()
    items.forEach(item => {
      if (item.tags) {
        item.tags.forEach(tag => {
          if (!tags.has(tag.id)) {
            tags.set(tag.id, tag)
          }
        })
      }
    })
    return Array.from(tags.values())
  }, [items])

  const itemVariants = {
    initial: { opacity: 0, y: 20, scale: 0.95 },
    animate: { opacity: 1, y: 0, scale: 1 },
    exit: { 
      opacity: 0, 
      y: -10, 
      scale: 0.95, 
      filter: "blur(2px)",
      transition: { duration: 0 }
    },
    tap: { 
      scale: 0.98,
      transition: { 
        type: "spring",
        stiffness: 400,
        damping: 17
      }
    }
  }

  const modalContentVariants = {
    initial: { opacity: 0 },
    animate: { opacity: 1, transition: { duration: 0.2 } },
    exit: { opacity: 0, transition: { duration: 0.4 } },
  }

  const fetchMetaData = async (url: string) => {
    try {
      const response = await fetch(`/api/meta?url=${encodeURIComponent(url)}`)
      const data = await response.json()
      return data
    } catch (error) {
      console.error('Error fetching meta data:', error)
      return null
    }
  }

  const addItem = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newUrl.trim()) return

    setIsLoading(true)
    const metaData = await fetchMetaData(newUrl)
    setIsLoading(false)

    if (!metaData) {
      return
    }

    const newItem: UrlListItem = {
      id: crypto.randomUUID(),
      url: newUrl,
      imageUrl: metaData.image,
      title: metaData.title,
      description: metaData.description,
      listType: 'local',
      listId: 'default',
      createdAt: new Date(),
      updatedAt: new Date(),
      tags: selectedTags
    }

    setItems(prev => [...prev, newItem])
    setNewUrl('')
    setSelectedTags([])
  }

  const updateItem = async (itemId: string, updates: Partial<UrlListItem>) => {
    setItems(prev => prev.map(item => {
      if (item.id === itemId) {
        return {
          ...item,
          ...updates,
          updatedAt: new Date()
        }
      }
      return item
    }))
  }

  const handleTagSelect = (tag: Tag) => {
    setSelectedTags(prev => {
      const exists = prev.some(t => t.id === tag.id)
      if (exists) {
        return prev.filter(t => t.id !== tag.id)
      }
      return [...prev, tag]
    })
  }

  const handleTagRemove = (tagId: string) => {
    setSelectedTags(prev => prev.filter(tag => tag.id !== tagId))
  }

  const handleCardClick = (item: UrlListItem) => {
    setSelectedItem(item)
  }

  const handleCloseModal = () => {
    setSelectedItem(null)
    setEditingItem(null)
  }

  const startEdit = (e: React.MouseEvent, item: UrlListItem) => {
    e.stopPropagation()
    setEditingItem(item)
  }

  const handleSaveEdit = () => {
    if (editingItem) {
      const updatedItem = { ...editingItem, updatedAt: new Date() }
      updateItem(editingItem.id, updatedItem)
      setEditingItem(null)
    }
  }

  const deleteItem = (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    setItems(items.filter(item => item.id !== id))
  }

  const archiveItem = (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    setItems(items.map(item =>
      item.id === id
        ? { ...item, archived: true, updatedAt: new Date() }
        : item
    ))
  }

  const archiveAll = () => {
    if (!hasArchivedItems) return
    const archivedItems = items.filter(item => item.archived)
    setItems(items.filter(item => !item.archived))
    // In a real app, we would save these to an archived list
    console.log('Archived items:', archivedItems)
  }

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (editingItem) {
      const updatedItem = { 
        ...editingItem, 
        ...editForm,
        tags: selectedTags,
        updatedAt: new Date() 
      }
      updateItem(editingItem.id, updatedItem)
      setEditingItem(null)
      setEditForm({})
      setSelectedTags([])
    }
  }

  const handleEditStart = (item: UrlListItem) => {
    setEditingItem(item)
    setEditForm({
      title: item.title,
      description: item.description,
      notes: item.notes
    })
    setSelectedTags(item.tags || [])
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      <form onSubmit={addItem} className="mb-6">
        <div className="flex gap-4">
          <input
            type="url"
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
            placeholder="Enter URL..."
            className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
          >
            {isLoading ? 'Adding...' : 'Add'}
          </button>
        </div>
      </form>

      <div className="mt-4">
        <TagInput
          existingTags={existingTags}
          onTagSelect={handleTagSelect}
          onTagRemove={handleTagRemove}
          listType="local"
          listId="default"
        />
      </div>

      <div className="mt-6 space-y-4">
        {items.map(item => (
          <motion.div
            key={item.id}
            variants={itemVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            whileTap="tap"
            className="bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start gap-4">
              {item.imageUrl && (
                <div className="relative w-16 h-16 flex-shrink-0">
                  <Image
                    src={item.imageUrl}
                    alt={item.title}
                    fill
                    className="object-cover rounded-lg"
                  />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-medium text-gray-900 truncate">
                  {item.title}
                </h3>
                {item.description && (
                  <p className="mt-1 text-sm text-gray-500 line-clamp-2">
                    {item.description}
                  </p>
                )}
                {item.tags && item.tags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {item.tags.map(tag => (
                      <span
                        key={tag.id}
                        className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-700"
                      >
                        {tag.name}
                      </span>
                    ))}
                  </div>
                )}
                <div className="mt-2 flex items-center gap-2">
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-500 hover:text-blue-600"
                  >
                    {new URL(item.url).hostname}
                  </a>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => handleEditStart(item)}
                  className="p-2 hover:bg-gray-100 rounded-full"
                >
                  <Edit2 className="w-4 h-4 text-gray-500" />
                </button>
                <button
                  onClick={(e) => updateItem(item.id, { archived: true })}
                  className="p-2 hover:bg-gray-100 rounded-full"
                >
                  <Archive className="w-4 h-4 text-gray-500" />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {editingItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-lg p-6 w-full max-w-md"
          >
            <h2 className="text-xl font-semibold mb-4">Edit Item</h2>
            <form onSubmit={handleEditSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Title
                  </label>
                  <input
                    type="text"
                    value={editForm.title || ''}
                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Description
                  </label>
                  <textarea
                    value={editForm.description || ''}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Notes
                  </label>
                  <textarea
                    value={editForm.notes || ''}
                    onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Tags
                  </label>
                  <TagInput
                    existingTags={existingTags}
                    onTagSelect={handleTagSelect}
                    onTagRemove={handleTagRemove}
                    listType="local"
                    listId="default"
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setEditingItem(null)
                    setEditForm({})
                    setSelectedTags([])
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-md hover:bg-blue-600"
                >
                  Save
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  )
}