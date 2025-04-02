'use client'

import { useState, useMemo, useRef } from 'react'
import { UrlListItem } from '@/types/url-list'
import { Plus, Trash2, Edit2, X, Link, Tag, Calendar, StickyNote } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'

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
  const [editingItem, setEditingItem] = useState<UrlListItem | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<UrlListItem | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const itemVariants = {
    initial: { opacity: 0, y: 20, scale: 0.95 },
    animate: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, x: -100, scale: 0.95 },
    tap: { 
      scale: 0.98,
      transition: { 
        type: "spring",
        stiffness: 400,
        damping: 17
      }
    }
  }

  const modalVariants = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  }

  const modalContentVariants = {
    initial: { scale: 0.95 },
    animate: { scale: 1 },
    exit: { scale: 0.95 },
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

  const startEdit = (e: React.MouseEvent, item: UrlListItem) => {
    e.stopPropagation()
    setEditingItem(item)
  }

  const saveEdit = (updatedItem: UrlListItem) => {
    setItems(items.map(item =>
      item.id === updatedItem.id
        ? { ...updatedItem, updatedAt: new Date() }
        : item
    ))
    setEditingItem(null)
  }

  const deleteItem = (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    setItems(items.filter(item => item.id !== id))
  }

  const handleCardClick = (item: UrlListItem) => {
    setSelectedItem(item)
  }

  const handleCloseModal = () => {
    setSelectedItem(null)
    setEditingItem(null)
  }

  return (
    <div className={`bg-gradient-to-b ${gradientFrom} ${gradientTo} h-full flex flex-col`}>
      {/* List Items */}
      <div className="flex-1 overflow-y-auto px-4 pb-24">
        <div className="max-w-lg mx-auto space-y-2 pt-4">
          <h1 className={`opacity-40 text-center ${titleColor} uppercase font-bold`}>{title}</h1>
          <AnimatePresence mode="popLayout">
            {items.map(item => (
              <motion.div
                key={item.id}
                variants={itemVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                whileTap="tap"
                layout
                className="flex items-center bg-white rounded-lg shadow-xl border hover:bg-gray-50 overflow-hidden h-12"
                layoutId={`card-${item.id}`}
              >
                {item.imageUrl && (
                  <motion.div 
                    className="relative w-20 h-full flex-shrink-0"
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
                <div className="flex-1 min-w-0 px-3">
                  <div 
                    className="cursor-pointer"
                    onClick={() => handleCardClick(item)}
                  >
                    <motion.h3 
                      className={`font-semibold ${textColor} truncate`}
                      layoutId={`title-${item.id}`}
                    >
                      {item.title}
                    </motion.h3>
                  </div>
                </div>
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
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-white to-transparent">
        <div className="max-w-lg mx-auto">
          <button
            onClick={() => setIsModalOpen(true)}
            className={`w-full py-3 rounded-lg ${buttonGradientFrom} ${buttonGradientTo} text-white flex items-center justify-center gap-2`}
          >
            <Plus className="w-5 h-5" />
            Add URL
          </button>
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
                <div className="p-6 space-y-2">
                  <input
                    type="text"
                    value={editingItem.title}
                    onChange={(e) => setEditingItem({ ...editingItem, title: e.target.value })}
                    className="w-full px-2 py-1 border rounded"
                    placeholder="Title"
                  />
                  <input
                    type="text"
                    value={editingItem.description}
                    onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                    className="w-full px-2 py-1 border rounded"
                    placeholder="Description"
                  />
                  <input
                    type="text"
                    value={editingItem.tag || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, tag: e.target.value })}
                    className="w-full px-2 py-1 border rounded"
                    placeholder="Tag (optional)"
                  />
                  <textarea
                    value={editingItem.notes || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, notes: e.target.value })}
                    className="w-full px-2 py-1 border rounded"
                    placeholder="Notes (optional)"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => saveEdit(editingItem)}
                      className={`px-4 py-2 rounded ${buttonGradientFrom} ${buttonGradientTo} text-white`}
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingItem(null)}
                      className="px-4 py-2 rounded bg-gray-200"
                    >
                      Cancel
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
                        className="flex justify-end gap-2 pt-4"
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
                            deleteItem(e, selectedItem.id)
                            handleCloseModal()
                          }}
                          className="px-4 py-2 text-gray-600 hover:text-red-500 rounded-lg hover:bg-gray-100"
                        >
                          <Trash2 className="w-4 h-4" />
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
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-lg p-6 w-full max-w-lg"
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Add URL</h2>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1 hover:bg-gray-100 rounded-full"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={addItem} className="space-y-4">
                <div>
                  <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-1">
                    URL
                  </label>
                  <input
                    type="url"
                    id="url"
                    value={newUrl}
                    onChange={(e) => setNewUrl(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="https://example.com"
                    required
                    disabled={isLoading}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className={`px-4 py-2 ${buttonGradientFrom} ${buttonGradientTo} text-white rounded-lg flex items-center gap-2`}
                  >
                    {isLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Loading...
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4" />
                        Add
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
} 