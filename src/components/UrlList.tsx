'use client'

import { useState, useMemo } from 'react'
import { UrlListItem } from '@/types/url-list'
import { Plus, Trash2, Edit2, X, Link, Tag, StickyNote, Archive, Search } from 'lucide-react'
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

  const hasArchivedItems = useMemo(() => items.some(item => item.archived), [items])

  // Get unique tags from all items
  const existingTags = useMemo(() => {
    const tags = new Set<string>()
    items.forEach(item => {
      if (item.tag) tags.add(item.tag)
    })
    return Array.from(tags)
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
      alert('Failed to fetch meta data for the URL')
      return
    }

    const item: UrlListItem = {
      id: crypto.randomUUID(),
      url: newUrl.trim(),
      imageUrl: metaData.image || '',
      title: metaData.title || 'Untitled',
      description: metaData.description || '',
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    setItems([...items, item])
    setNewUrl('')
    setIsModalOpen(false)
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
      saveEdit(updatedItem)
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

  const saveEdit = (updatedItem: UrlListItem) => {
    setItems(items.map(item =>
      item.id === updatedItem.id
        ? { ...updatedItem, updatedAt: new Date() }
        : item
    ))
  }

  return (
    <div className={`bg-gradient-to-b ${gradientFrom} ${gradientTo} h-full flex flex-col`}>
      {/* List Items */}
      <div className="flex-1 overflow-y-auto px-4 pb-24">
        <div className="max-w-lg mx-auto space-y-2 pt-4">
          <h1 className={`opacity-40 text-center ${titleColor} uppercase font-bold`}>{title}</h1>

          {/* Tag Display */}
          {existingTags.length > 0 && (
            <div className="flex flex-wrap gap-2 px-4 justify-center">
              {existingTags.map(tag => (
                <div
                  key={tag}
                  className="flex items-center gap-1 px-2 py-1 bg-white/50 rounded-full text-sm text-gray-600"
                >
                  <Tag className="w-3 h-3" />
                  <span>{tag}</span>
                </div>
              ))}
            </div>
          )}

          <AnimatePresence mode="popLayout">
            {items.filter(item => !item.archived).map(item => (
              <motion.div
                key={item.id}
                variants={itemVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                whileTap="tap"
                layout
                className={`flex items-center bg-white rounded-lg shadow-xl border hover:bg-gray-50 overflow-hidden ${selectedItem?.id === item.id ? 'opacity-0' : ''}`}
                layoutId={`card-${item.id}`}
              >
                {item.imageUrl && (
                  <motion.div
                    className="bg-gray-100 relative w-20 aspect-[1200/630] flex-shrink-0 ml-2"
                    layoutId={`image-${item.id}`}
                  >
                    <Image
                      src={item.imageUrl}
                      alt={item.title}
                      fill
                      className="object-cover"
                      sizes="80px"
                    />
                  </motion.div>
                )}
                <div className="flex-1 min-w-0 px-3 py-4">
                  <div
                    className="cursor-pointer"
                    onClick={() => handleCardClick(item)}
                  >
                    <motion.h3
                      className={`font-semibold ${textColor} line-clamp-2`}
                      layoutId={`title-${item.id}`}
                    >
                      {item.title}
                    </motion.h3>
                  </div>
                </div>
                <button
                  onClick={(e) => archiveItem(e, item.id)}
                  className="p-1 hover:bg-gray-100 rounded-full mr-3"
                >
                  <Archive className="w-5 h-5 text-gray-400" />
                </button>
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1 hover:bg-gray-100 rounded-full mr-3"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Link className="w-5 h-5 text-gray-400" />
                </a>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Add Item Button */}
      <div className="bg-white fixed bottom-0 left-0 mx-auto max-w-md py-1 right-0 rounded-t-full shadow-[0_-4px_20px_rgba(0,0,0,0.15)]">
        <div className="grid grid-cols-3 gap-8 px-4 items-center justify-items-center">
          <div className="justify-self-end">
            <AppDrawer />
          </div>
          <div>
            <motion.button
              onClick={() => setIsModalOpen(true)}
              whileTap={{ y: 4 }}
              className={`w-20 h-20 bg-gradient-to-b ${buttonGradientFrom} ${buttonGradientTo} border-8 border-white -mt-12 text-white rounded-full shadow-[0_-4px_20px_rgba(0,0,0,0.15)] active:${buttonGradientTo} active:${buttonGradientFrom} active:-translate-y-2 focus:outline-none focus:ring-2 focus:ring-${buttonAccentColor} flex items-center justify-center`}
            >
              <Plus className="w-8 h-8" />
            </motion.button>
          </div>
        </div>
      </div>

      {/* Item Detail Modal */}
      <AnimatePresence>
        {selectedItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4"
          >
            <motion.div
              variants={modalContentVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="bg-white rounded-lg w-full max-w-lg overflow-hidden"
              layoutId={`card-${selectedItem.id}`}
            >
              {editingItem?.id === selectedItem.id ? (
                <div className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Image URL
                    </label>
                    <input
                      type="url"
                      value={editingItem.imageUrl}
                      onChange={(e) => setEditingItem({ ...editingItem, imageUrl: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Image URL"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Title
                    </label>
                    <input
                      type="text"
                      value={editingItem.title}
                      onChange={(e) => setEditingItem({ ...editingItem, title: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Title"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <input
                      type="text"
                      value={editingItem.description}
                      onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Description"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tag
                    </label>
                    <TagInput
                      value={editingItem.tag || ''}
                      onChange={(value) => setEditingItem({ ...editingItem, tag: value })}
                      existingTags={existingTags}
                      placeholder="Add tag..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Notes
                    </label>
                    <textarea
                      value={editingItem.notes || ''}
                      onChange={(e) => setEditingItem({ ...editingItem, notes: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={3}
                      placeholder="Notes (optional)"
                    />
                  </div>

                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setEditingItem(null)}
                      className="px-4 py-2 text-gray-600 hover:text-gray-800"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleSaveEdit()}
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                    >
                      Save
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex flex-col">
                    {selectedItem.imageUrl && (
                      <motion.div
                        className="relative w-full aspect-[1200/630]"
                        layoutId={`image-${selectedItem.id}`}
                      >
                        <Image
                          src={selectedItem.imageUrl}
                          alt={selectedItem.title}
                          fill
                          className="object-cover"
                        />
                      </motion.div>
                    )}
                    <div className="p-6 space-y-4">
                      <div className="flex justify-between items-start">
                        <motion.h3
                          className={`font-semibold ${textColor} text-lg`}
                          layoutId={`title-${selectedItem.id}`}
                        >
                          {selectedItem.title}
                        </motion.h3>
                        <button
                          onClick={handleCloseModal}
                          className="p-1 hover:bg-gray-100 rounded-full"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                      <motion.p
                        className="text-gray-600"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                      >
                        {selectedItem.description}
                      </motion.p>
                      <motion.div
                        className="flex items-center gap-2 text-sm text-gray-500"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                      >
                        <a
                          href={selectedItem.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 hover:text-blue-500"
                        >
                          <Link className="w-4 h-4" />
                          <span>Open Article</span>
                        </a>
                      </motion.div>
                      {(selectedItem.tag || selectedItem.notes) && (
                        <motion.div
                          className="flex flex-col gap-2 text-sm text-gray-500"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.4 }}
                        >
                          {selectedItem.tag && (
                            <div className="flex items-center gap-1">
                              <Tag className="w-4 h-4" />
                              <span>{selectedItem.tag}</span>
                            </div>
                          )}
                          {selectedItem.notes && (
                            <div className="flex items-start gap-1">
                              <StickyNote className="w-4 h-4 mt-1" />
                              <span>{selectedItem.notes}</span>
                            </div>
                          )}
                        </motion.div>
                      )}
                      <motion.div
                        className="flex justify-end gap-2"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                      >
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            startEdit(e, selectedItem)
                          }}
                          className="px-4 py-2 text-gray-600 hover:text-blue-500 rounded-lg hover:bg-gray-100"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            archiveItem(e, selectedItem.id)
                            handleCloseModal()
                          }}
                          className="px-4 py-2 text-gray-600 hover:text-yellow-500 rounded-lg hover:bg-gray-100"
                        >
                          <Archive className="w-4 h-4" />
                        </button>
                      </motion.div>
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Item Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="fixed inset-0 bg-black bg-opacity-50 z-40"
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              className="fixed left-4 right-4 top-1/4 bg-white rounded-lg shadow-xl p-4 z-50 max-w-md mx-auto"
            >
              <form onSubmit={addItem} className="flex gap-2">
                <input
                  type="url"
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  placeholder="Add a URL..."
                  className={`flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-${accentColor}`}
                  autoFocus
                  disabled={isLoading}
                />
                <button
                  type="submit"
                  disabled={isLoading}
                  className={`bg-gradient-to-b ${buttonGradientFrom} ${buttonGradientTo} px-4 py-2 text-white rounded-lg active:${buttonGradientTo} active:${buttonGradientFrom} focus:outline-none focus:ring-2 focus:ring-${buttonAccentColor}`}
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    'Add'
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-2 py-2 text-gray-600 hover:text-gray-800 focus:outline-none"
                >
                  <X className="w-5 h-5" />
                </button>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}