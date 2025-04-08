'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import { UrlListItem, Tag } from '@/types/url-list'
import { Plus, Trash2, Edit2, X, Link, Tag as TagIcon, StickyNote, Archive, Search, Calendar, MapPin } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import AppDrawer from './AppDrawer'
import TagInput from './TagInput'
import { createUrlItem, getUrlItems, updateUrlItem, deleteUrlItem, archiveUrlItem } from '@/lib/supabase/url-items'
import { getTags, createTag, deleteTag, addTagToItem, removeTagFromItem, getItemTags } from '@/lib/supabase/tags'
import { ImageIcon } from 'lucide-react'
import { PlaceSearchResult } from '@/lib/google/places'
import debounce from 'lodash/debounce'

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
  listType: 'local' | 'shared'
  listId: string
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
  listType,
  listId,
}: UrlListProps) {
  const [items, setItems] = useState<UrlListItem[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [newUrl, setNewUrl] = useState('')
  const [selectedItem, setSelectedItem] = useState<UrlListItem | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [editingItem, setEditingItem] = useState<UrlListItem | null>(null)
  const [editForm, setEditForm] = useState<Partial<UrlListItem>>({})
  const [error, setError] = useState<string | null>(null)
  const [inputType, setInputType] = useState<'url' | 'place'>('url')
  const [searchResults, setSearchResults] = useState<PlaceSearchResult[]>([])
  const [selectedPlace, setSelectedPlace] = useState<PlaceSearchResult | null>(null)
  const [isSearching, setIsSearching] = useState(false)

  const inputTypeOptions = [
    { value: 'url', icon: Link, label: 'URL' },
    { value: 'place', icon: MapPin, label: 'Place' }
  ] as const

  const InputTypeSelector = ({ 
    value, 
    onChange, 
    className,
  }: { 
    value: 'url' | 'place', 
    onChange: (value: 'url' | 'place') => void,
    className?: string
  }) => {
    return (
      <div className={`relative flex justify-end font-medium rounded-lg bg-gray-100 ${className}`}>
        {inputTypeOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            className={`relative z-10 flex-1 px-3 py-1.5 rounded-md text-gray-400 transition-all ease-in-out hover:text-gray-700 ${
              value === option.value ? 'bg-gray-200 text-gray-700' : ''
            }`}
          >
            <div className="flex items-center justify-center gap-1">
              <option.icon className="w-4 h-4" />
              <span>{option.label}</span>
            </div>
          </button>
        ))}
      </div>
    )
  }

  const hasArchivedItems = useMemo(() => items.some(item => item.archived), [items])

  // Get unique tags from all items
  const existingTags = useMemo(() => {
    const tags = new Set<string>()
    items.forEach(item => {
      if (item.tags) item.tags.forEach(tag => tags.add(tag.name))
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
      const response = await fetch(`/api/meta?url=${encodeURIComponent(url)}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        return null
      }
      
      const data = await response.json()
      return data
    } catch (error) {
      return null
    }
  }

  useEffect(() => {
    async function loadData() {
      try {
        const [itemsData, tagsData] = await Promise.all([
          getUrlItems(listType, listId),
          getTags(listType, listId)
        ])
        setItems(itemsData)
        setTags(tagsData)
      } catch (error) {
        console.error('Error loading data:', error)
      }
    }
    loadData()
  }, [listType, listId])

  const addItem = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newUrl.trim()) return

    setIsLoading(true)
    setError(null)
    try {
      if (inputType === 'url') {
        const metaData = await fetchMetaData(newUrl)
        
        if (!metaData) {
          setError('Failed to retrieve URL information. Please try again or add manually.')
          return
        }

        const newItem = {
          url: newUrl.trim(),
          imageUrl: metaData.image || '',
          title: metaData.title || 'Untitled',
          description: metaData.description || '',
          listType,
          listId,
          archived: false
        }
        console.log('Creating new URL item:', newItem)

        const createdItem = await createUrlItem(newItem)
        console.log('URL item created:', createdItem)
        setItems([...items, createdItem])
      } else {
        // TODO: Implement place lookup and addition
        setError('Place lookup not implemented yet')
        return
      }
      
      setNewUrl('')
      setIsModalOpen(false)
    } catch (error) {
      console.error('Error in addItem:', error)
      setError('Failed to add item. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCardClick = (item: UrlListItem) => {
    setSelectedItem(item)
  }

  const handleCloseModal = () => {
    setSelectedItem(null)
    setEditingItem(null)
  }

  const startEdit = async (e: React.MouseEvent, item: UrlListItem) => {
    e.stopPropagation()
    try {
      // Get the latest item data with tags
      const updatedItems = await getUrlItems(listType, listId)
      const latestItem = updatedItems.find(i => i.id === item.id)
      if (latestItem) {
        setEditingItem(latestItem)
      }
    } catch (error) {
      // Fallback to the current item data if there's an error
      setEditingItem(item)
    }
  }

  const handleSaveEdit = async () => {
    if (editingItem) {
      try {
        const updatedItem = await updateUrlItem(editingItem)
        // Update the items list
        setItems(items.map(item => 
          item.id === updatedItem.id ? updatedItem : item
        ))
        // Update the selected item if it's the one being edited
        if (selectedItem?.id === updatedItem.id) {
          setSelectedItem(updatedItem)
        }
        setEditingItem(null)
      } catch (error) {
        alert('Failed to update item. Please try again.')
      }
    }
  }

  const deleteItem = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    try {
      await deleteUrlItem(id)
      setItems(items.filter(item => item.id !== id))
    } catch (error) {
      alert('Failed to delete item. Please try again.')
    }
  }

  const archiveItem = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    try {
      await archiveUrlItem(id)
      setItems(items.map(item =>
        item.id === id
          ? { ...item, archived: true, updatedAt: new Date() }
          : item
      ))
    } catch (error) {
      alert('Failed to archive item. Please try again.')
    }
  }

  const archiveAll = () => {
    if (!hasArchivedItems) return
    const archivedItems = items.filter(item => item.archived)
    setItems(items.filter(item => !item.archived))
  }

  const handleTagSelect = async (tag: Tag) => {
    if (!editingItem) return;
    try {
      await addTagToItem(editingItem.id, tag.id);
      const updatedItems = await getUrlItems(listType, listId);
      setItems(updatedItems);
      const updatedItem = updatedItems.find(item => item.id === editingItem.id);
      if (updatedItem) {
        setEditingItem(updatedItem);
        if (selectedItem?.id === updatedItem.id) {
          setSelectedItem(updatedItem);
        }
      }
    } catch (error) {
      console.error('Error adding tag:', error);
    }
  };

  const handleTagRemove = async (tagId: string) => {
    if (!editingItem) return;
    try {
      await removeTagFromItem(editingItem.id, tagId);
      const updatedItems = await getUrlItems(listType, listId);
      setItems(updatedItems);
      const updatedItem = updatedItems.find(item => item.id === editingItem.id);
      if (updatedItem) {
        setEditingItem(updatedItem);
        if (selectedItem?.id === updatedItem.id) {
          setSelectedItem(updatedItem);
        }
      }
    } catch (error) {
      console.error('Error removing tag:', error);
    }
  };

  const handleCreateTag = async (name: string) => {
    try {
      const newTag = await createTag({ name, listId, listType })
      setTags([...tags, newTag])
      return newTag
    } catch (error) {
      console.error('Error creating tag:', error)
      throw error
    }
  }

  const formatDate = (dateStr: string) => {
    const [year, month, day] = dateStr.split('-')
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
  }

  // Add debounced search function
  const debouncedSearch = useMemo(
    () =>
      debounce(async (value: string) => {
        if (value.length < 4) {
          setSearchResults([])
          setIsSearching(false)
          return
        }

        setIsSearching(true)
        try {
          const response = await fetch(`/api/places?query=${encodeURIComponent(value)}`)
          if (!response.ok) throw new Error('Failed to search places')
          const results = await response.json()
          setSearchResults(results)
        } catch (error) {
          console.error('Error searching places:', error)
          setError('Failed to search places. Please try again.')
        } finally {
          setIsSearching(false)
        }
      }, 300),
    []
  )

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      debouncedSearch.cancel()
    }
  }, [debouncedSearch])

  // Update the search input handling
  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setNewUrl(value)
    
    if (inputType === 'place') {
      if (value.length < 4) {
        setSearchResults([])
        setIsSearching(false)
      } else {
        debouncedSearch(value)
      }
    }
  }

  const handlePlaceSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([])
      return
    }

    setIsSearching(true)
    try {
      const response = await fetch(`/api/places?query=${encodeURIComponent(query)}`)
      if (!response.ok) throw new Error('Failed to search places')
      const results = await response.json()
      setSearchResults(results)
    } catch (error) {
      console.error('Error searching places:', error)
      setError('Failed to search places. Please try again.')
    } finally {
      setIsSearching(false)
    }
  }

  const handlePlaceSelect = async (place: PlaceSearchResult) => {
    setIsSearching(true)
    setError(null)
    try {
      const response = await fetch(`/api/places?placeId=${encodeURIComponent(place.placeId)}`)
      if (!response.ok) throw new Error('Failed to get place details')
      const placeDetails = await response.json()
      
      // Generate Google Maps URL for the place
      const placeUrl = `https://www.google.com/maps/place/?q=place_id:${place.placeId}`
      
      const newItem = {
        url: placeUrl,
        place: {
          placeId: place.placeId,
          name: place.name,
          address: place.address,
          lat: place.lat,
          lng: place.lng,
          types: place.types || [],
          rating: place.rating,
          userRatingsTotal: place.userRatingsTotal,
          priceLevel: place.priceLevel,
          website: placeDetails.website,
          phoneNumber: placeDetails.phoneNumber,
          openingHours: placeDetails.openingHours,
        },
        title: place.name,
        description: place.address,
        listType,
        listId,
        archived: false,
        imageUrl: placeDetails.photoUrl || '',
      }

      const createdItem = await createUrlItem(newItem)
      
      setItems(prevItems => [createdItem, ...prevItems])
      setNewUrl('')
      setSearchResults([])
      setSelectedPlace(null)
      setIsModalOpen(false)
      setIsSearching(false)
    } catch (error) {
      console.error('Error in handlePlaceSelect:', error)
      setError('Failed to add place. Please try again.')
      setIsSearching(false)
    }
  }

  return (
    <div className={`bg-gradient-to-b ${gradientFrom} ${gradientTo} h-full flex flex-col`}>
      {/* List Items */}
      <div className="flex-1 overflow-y-auto px-4 pb-24">
        <div className="max-w-lg mx-auto space-y-2 pt-4 lg:max-w-7xl">
          <h1 className={`opacity-40 text-center ${titleColor} uppercase font-bold`}>{title}</h1>

          {/* Tag Display */}
          {existingTags.length > 0 && (
            <div className="flex flex-wrap gap-2 px-4 justify-center">
              {existingTags.map(tag => (
                <div
                  key={tag}
                  className="flex items-center gap-1 px-2 py-1 bg-white/50 rounded-full text-sm text-gray-600"
                >
                  <TagIcon className="w-3 h-3" />
                  <span>{tag}</span>
                </div>
              ))}
            </div>
          )}
          <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
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
                  className={`flex gap-2 items-center bg-white rounded-lg shadow-xl border overflow-hidden p-2 hover:bg-gray-50 ${selectedItem?.id === item.id ? 'opacity-0' : ''}`}
                  layoutId={`card-${item.id}`}
                >
                  {item.imageUrl ? (
                    <motion.div
                      className="bg-gray-100 h-16 flex-shrink-0 overflow-hidden relative w-16"
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
                  ) : (
                    <motion.div
                      className="bg-gray-100 relative w-20 aspect-[1200/630] flex-shrink-0 ml-2"
                      layoutId={`image-${item.id}`}
                    >
                      <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                        <ImageIcon className="w-6 h-6" />
                      </div>
                    </motion.div>
                  )}
                  <div className="flex-1 min-w-0">
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
          </section>
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
                    <label className="block text-sm font-medium text-gray-700">Tags</label>
                    <TagInput
                      existingTags={tags}
                      selectedTags={editingItem.tags}
                      onTagSelect={handleTagSelect}
                      onTagRemove={handleTagRemove}
                      onCreateTag={handleCreateTag}
                      listType={listType}
                      listId={listId}
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

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={editingItem.dateRange?.start || ''}
                      onChange={(e) => {
                        const dateStr = e.target.value
                        console.log('Start date input value:', dateStr)
                        if (!dateStr) {
                          setEditingItem({
                            ...editingItem,
                            dateRange: undefined
                          })
                          return
                        }
                        setEditingItem({
                          ...editingItem,
                          dateRange: {
                            start: dateStr,
                            end: editingItem.dateRange?.end || dateStr
                          }
                        })
                      }}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      End Date
                    </label>
                    <input
                      type="date"
                      value={editingItem.dateRange?.end || ''}
                      onChange={(e) => {
                        const dateStr = e.target.value
                        console.log('End date input value:', dateStr)
                        if (!dateStr) {
                          setEditingItem({
                            ...editingItem,
                            dateRange: undefined
                          })
                          return
                        }
                        setEditingItem({
                          ...editingItem,
                          dateRange: {
                            start: editingItem.dateRange?.start || dateStr,
                            end: dateStr
                          }
                        })
                      }}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    {selectedItem.imageUrl ? (
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
                    ) : (
                      <motion.div
                        className="relative w-full aspect-[1200/630] bg-gray-100"
                        layoutId={`image-${selectedItem.id}`}
                      >
                        <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                          <ImageIcon className="w-12 h-12" />
                        </div>
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
                      {selectedItem.place && (
                        <motion.div
                          className="space-y-2"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.3 }}
                        >
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <MapPin className="w-4 h-4" />
                            <span>{selectedItem.place.address}</span>
                          </div>
                          {selectedItem.place.rating && (
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                              <span>⭐ {selectedItem.place.rating.toFixed(1)}</span>
                              {selectedItem.place.userRatingsTotal && (
                                <span>({selectedItem.place.userRatingsTotal} reviews)</span>
                              )}
                            </div>
                          )}
                          {selectedItem.place.priceLevel && (
                            <div className="text-sm text-gray-500">
                              {'$'.repeat(selectedItem.place.priceLevel)}
                            </div>
                          )}
                          {selectedItem.place.website && (
                            <a
                              href={selectedItem.place.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-blue-500 hover:underline"
                            >
                              Visit Website
                            </a>
                          )}
                          {selectedItem.place.phoneNumber && (
                            <a
                              href={`tel:${selectedItem.place.phoneNumber}`}
                              className="text-sm text-blue-500 hover:underline"
                            >
                              {selectedItem.place.phoneNumber}
                            </a>
                          )}
                          {selectedItem.place.openingHours && (
                            <div className="text-sm text-gray-500">
                              {selectedItem.place.openingHours.openNow ? 'Open Now' : 'Closed'}
                              {selectedItem.place.openingHours.weekdayText && (
                                <div className="mt-1">
                                  {selectedItem.place.openingHours.weekdayText.map((text, index) => (
                                    <div key={index}>{text}</div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </motion.div>
                      )}
                      {selectedItem.dateRange && (
                        <motion.div
                          className="flex items-center gap-2 text-sm text-gray-500"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.3 }}
                        >
                          <Calendar className="w-4 h-4" />
                          <span>
                            {formatDate(selectedItem.dateRange.start)}
                            {selectedItem.dateRange.end !== selectedItem.dateRange.start && (
                              <> - {formatDate(selectedItem.dateRange.end)}</>
                            )}
                          </span>
                        </motion.div>
                      )}
                      <motion.div
                        className="flex items-center gap-2 text-sm text-gray-500"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4 }}
                      >
                        {selectedItem.url && (
                          <a
                            href={selectedItem.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 hover:text-blue-500"
                          >
                            <Link className="w-4 h-4" />
                            <span>Open Article</span>
                          </a>
                        )}
                      </motion.div>
                      {(selectedItem.tags && selectedItem.tags.length > 0 || selectedItem.notes) && (
                        <motion.div
                          className="flex flex-col gap-2 text-sm text-gray-500"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.5 }}
                        >
                          {selectedItem.tags?.map(tag => (
                            <div key={tag.id} className="flex items-center gap-1">
                              <TagIcon className="w-4 h-4" />
                              <span>{tag.name}</span>
                            </div>
                          ))}
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
                        transition={{ delay: 0.6 }}
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
              <form onSubmit={addItem} className="flex flex-col gap-4">
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <input
                      type={inputType === 'url' ? 'url' : 'text'}
                      value={newUrl}
                      onChange={handleSearchInputChange}
                      placeholder={inputType === 'url' ? 'Add a URL...' : 'Search for a place (minimum 4 characters)...'}
                      className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-${accentColor}`}
                      autoFocus
                      disabled={isLoading || isSearching}
                    />
                    {isSearching && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                      </div>
                    )}
                    {inputType === 'place' && newUrl.length < 4 && newUrl.length > 0 && (
                      <div className="absolute z-50 w-full mt-1 bg-white border rounded-lg shadow-lg p-3 text-sm text-gray-500">
                        Please enter at least 4 characters to search...
                      </div>
                    )}
                    {inputType === 'place' && searchResults.length > 0 && (
                      <div className="absolute z-50 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {searchResults.map((place) => (
                          <button
                            key={place.placeId}
                            type="button"
                            onClick={() => handlePlaceSelect(place)}
                            className="w-full px-4 py-2 text-left hover:bg-gray-100 focus:outline-none focus:bg-gray-100 flex items-center gap-2"
                          >
                            <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            <div>
                              <div className="font-medium">{place.name}</div>
                              <div className="text-sm text-gray-500 truncate">{place.address}</div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <button
                    type="submit"
                    disabled={isLoading || isSearching || (inputType === 'url' && !newUrl.trim())}
                    className={`bg-gradient-to-b ${buttonGradientFrom} ${buttonGradientTo} px-4 py-2 text-white rounded-lg active:${buttonGradientTo} active:${buttonGradientFrom} focus:outline-none focus:ring-2 focus:ring-${buttonAccentColor} disabled:opacity-50`}
                  >
                    {isLoading || isSearching ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      'Add'
                    )}
                  </button>
                </div>
                <div className="flex gap-2 justify-between">
                  <InputTypeSelector className="grow" value={inputType} onChange={setInputType} />
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-5 py-2 text-gray-600 shrink-0 hover:text-gray-800 focus:outline-none"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                {error && (
                  <div className="text-red-500 text-sm">
                    {error}
                  </div>
                )}
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}