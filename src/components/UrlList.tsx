'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import { UrlListItem, Tag } from '@/types/url-list'
import { Plus, Trash2, Edit2, X, Link, Tag as TagIcon, StickyNote, Archive, Search, Calendar, MapPin, Phone } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import AppDrawer from './AppDrawer'
import TagInput from './TagInput'
import { createUrlItem, getUrlItems, updateUrlItem, deleteUrlItem, archiveUrlItem } from '@/lib/supabase/url-items'
import { getTags, createTag, deleteTag, addTagToItem, removeTagFromItem, getItemTags } from '@/lib/supabase/tags'
import { ImageIcon } from 'lucide-react'
import { PlaceSearchResult } from '@/lib/google/places'
import debounce from 'lodash/debounce'
import { StarRating } from "@/components/ui/star-rating"
import { FeatureErrorBoundary, ComponentErrorBoundary } from './ErrorBoundaries'

type UrlListProps = {
  title: string
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
  const [mounted, setMounted] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTag, setSelectedTag] = useState<string | null>(null)

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
      <div className={`relative flex justify-end font-medium rounded-2xl bg-gray-100 ${className}`}>
        {inputTypeOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            className={`relative z-10 flex-1 px-3 py-1.5 rounded-md text-gray-400 transition-all ease-in-out hover:text-gray-700 ${value === option.value ? 'bg-gray-200 text-gray-700' : ''
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

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setNewUrl(value)
    setSearchQuery(value)
  }

  const handlePlaceSearch = async () => {
    if (!searchQuery.trim() || searchQuery.length < 4) {
      setSearchResults([])
      return
    }

    setIsSearching(true)
    try {
      const response = await fetch(`/api/places?query=${encodeURIComponent(searchQuery)}`)
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

        const createdItem = await createUrlItem(newItem)
        setItems([...items, createdItem])
      } else {
        // If we have search results and a selected place, use handlePlaceSelect
        if (searchResults.length > 0 && selectedPlace) {
          await handlePlaceSelect(selectedPlace)
        } else {
          setError('Please select a place from the search results')
          return
        }
      }

      setNewUrl('')
      setSearchQuery('')
      setSearchResults([])
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
        const updatedItem = await updateUrlItem(editingItem) as UrlListItem
        
        // Refresh the items list to get the latest data with tags
        const refreshedItems = await getUrlItems(listType, listId)
        setItems(refreshedItems)
        
        // Update the selected item if it's the one being edited
        const refreshedItem = refreshedItems.find(item => item.id === updatedItem.id)
        if (refreshedItem) {
          setSelectedItem(refreshedItem)
        }
        
        setEditingItem(null)
        
        // If we're in a tag filter view and the item's tags changed,
        // we need to close the modal to prevent the broken animation
        const shouldCloseModal = selectedTag && 
          ((selectedTag === 'untagged' && editingItem.tags?.length) ||
          (selectedTag !== 'untagged' && !editingItem.tags?.some((tag: Tag) => tag.name === selectedTag)))
        
        if (shouldCloseModal) {
          setSelectedItem(null)
        }
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
      setSelectedItem(null)
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

  // Sort items by tag, with untagged items last
  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => {
      // If both items have tags, sort by first tag name
      if (a.tags?.length && b.tags?.length) {
        return a.tags[0].name.localeCompare(b.tags[0].name)
      }
      // If only one has tags, put the tagged one first
      if (a.tags?.length) return -1
      if (b.tags?.length) return 1
      // If neither has tags, maintain original order
      return 0
    })
  }, [items])

  // Filter items by selected tag
  const filteredItems = useMemo(() => {
    if (!selectedTag) return sortedItems
    if (selectedTag === 'untagged') {
      return sortedItems.filter(item => !item.tags?.length)
    }
    return sortedItems.filter(item => 
      item.tags?.some(tag => tag.name === selectedTag)
    )
  }, [sortedItems, selectedTag])

  return (
    <FeatureErrorBoundary featureName="URL List">
      <div className={`h-full flex flex-col`}>
        {/* List Items */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-lg mx-auto space-y-2 pt-4 lg:max-w-7xl">
            <h1 className={`opacity-40 text-center ${titleColor} uppercase font-bold`}>{title}</h1>

          {/* Tag Filter */}
          <div className="flex flex-wrap gap-2 px-4 justify-center">
            <button
              onClick={() => setSelectedTag(null)}
              className={`flex items-center gap-1 px-2 py-1 rounded-full text-sm ${
                selectedTag === null
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-white/50 text-gray-600 hover:bg-gray-100'
              }`}
            >
              <TagIcon className="w-3 h-3" />
              <span>All</span>
            </button>
            <button
              onClick={() => setSelectedTag('untagged')}
              className={`flex items-center gap-1 px-2 py-1 rounded-full text-sm ${
                selectedTag === 'untagged'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-white/50 text-gray-600 hover:bg-gray-100'
              }`}
            >
              <TagIcon className="w-3 h-3" />
              <span>Untagged</span>
            </button>
            {existingTags.map(tag => (
              <button
                key={tag}
                onClick={() => setSelectedTag(tag)}
                className={`flex items-center gap-1 px-2 py-1 rounded-full text-sm ${
                  selectedTag === tag
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-white/50 text-gray-600 hover:bg-gray-100'
                }`}
              >
                <TagIcon className="w-3 h-3" />
                <span>{tag}</span>
              </button>
            ))}
          </div>

          <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <AnimatePresence mode="popLayout">
              {filteredItems.filter(item => !item.archived).map(item => (
                <motion.div
                  key={item.id}
                  variants={itemVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  whileTap="tap"
                  layout
                  className={`flex gap-2 items-center bg-white rounded-2xl shadow-sm border overflow-hidden p-2 hover:bg-gray-50 ${selectedItem?.id === item.id ? 'opacity-0' : ''}`}
                  layoutId={`card-${item.id}`}
                >
                  {item.imageUrl ? (
                    <motion.div
                      className="bg-gray-100 h-16 w-16 flex-shrink-0 overflow-hidden relative rounded-2xl"
                      layoutId={`image-${item.id}`}
                      style={{ aspectRatio: '1/1' }}
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
                      className="bg-gray-100 h-16 w-16 flex-shrink-0 relative rounded-2xl"
                      layoutId={`image-${item.id}`}
                      style={{ aspectRatio: '1/1' }}
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
                        className={`font-semibold ${textColor} line-clamp-1 mb-1`}
                        layoutId={`title-${item.id}`}
                      >
                        {item.title}
                      </motion.h3>
                      <motion.div
                        className="flex flex-wrap gap-1"
                        layoutId={`tags-${item.id}`}
                      >
                        {item.tags?.length ? (
                          item.tags.map(tag => (
                            <span
                              key={tag.id}
                              className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-full text-xs text-gray-600"
                            >
                              <TagIcon className="w-3 h-3" />
                              {tag.name}
                            </span>
                          ))
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-full text-xs text-gray-400">
                            <TagIcon className="w-3 h-3" />
                            Untagged
                          </span>
                        )}
                      </motion.div>
                    </div>
                  </div>
                  <div className="flex">
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center h-10 w-10 hover:bg-gray-100 rounded-full"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Link className="w-5 h-5 text-gray-400" />
                    </a>
                  </div>
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
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={handleCloseModal}
          >
            <motion.div
              variants={modalContentVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="w-full max-w-4xl mx-auto bg-white rounded-2xl overflow-hidden max-h-[90vh] flex flex-col"
              layoutId={`card-${selectedItem.id}`}
              style={{ width: '100%', maxWidth: '56rem', height: '90vh' }}
              onClick={(e) => e.stopPropagation()}
            >
              {editingItem?.id === selectedItem.id ? (
                <div className="flex flex-col h-full">
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Image URL
                      </label>
                      <input
                        type="url"
                        value={editingItem.imageUrl}
                        onChange={(e) => setEditingItem({ ...editingItem, imageUrl: e.target.value })}
                        className="w-full px-3 py-2 border rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                        className="w-full px-3 py-2 border rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                        className="w-full px-3 py-2 border rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                        className="w-full px-3 py-2 border rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                        rows={3}
                        placeholder="Notes (optional)"
                      />
                    </div>

                    <div className="flex gap-2 pt-4">
                      <button
                        onClick={handleSaveEdit}
                        className="flex-1 bg-blue-500 text-white px-4 py-2 rounded-2xl hover:bg-blue-600 transition-colors"
                      >
                        Save
                      </button>
                      <button
                        onClick={handleCloseModal}
                        className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-2xl hover:bg-gray-300 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col h-full">
                  {/* Header with close button - always visible */}
                  <div className="flex justify-between items-start p-4 border-b border-gray-200 flex-shrink-0">
                    <motion.h2 
                      className="text-xl font-semibold pr-4"
                      layoutId={`title-${selectedItem.id}`}
                    >
                      {selectedItem.title}
                    </motion.h2>
                    <button
                      onClick={handleCloseModal}
                      className="text-gray-500 hover:text-gray-700 p-2 hover:bg-gray-100 rounded-full flex-shrink-0"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Scrollable content area */}
                  <div className="flex-1 overflow-y-auto">
                    {selectedItem.imageUrl && (
                      <motion.div 
                        className="relative w-full" 
                        style={{ aspectRatio: '16/9', maxHeight: '40vh' }}
                        layoutId={`image-${selectedItem.id}`}
                      >
                        <Image
                          src={selectedItem.imageUrl}
                          alt={selectedItem.title}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        />
                      </motion.div>
                    )}
                    
                    <div className="p-6 space-y-4 pb-20">
                      <div className="space-y-4">
                        {selectedItem.description && (
                          <p className="text-gray-600">{selectedItem.description}</p>
                        )}

                        <motion.div 
                          className="flex flex-wrap gap-2"
                          layoutId={`tags-${selectedItem.id}`}
                        >
                          {selectedItem.tags && selectedItem.tags.length > 0 ? (
                            selectedItem.tags.map(tag => (
                              <span
                                key={tag.id}
                                className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-full text-xs text-gray-600"
                              >
                                <TagIcon className="w-3 h-3" />
                                {tag.name}
                              </span>
                            ))
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-full text-xs text-gray-400">
                              <TagIcon className="w-3 h-3" />
                              Untagged
                            </span>
                          )}
                        </motion.div>

                        {selectedItem.notes && (
                          <div>
                            <h3 className="text-sm font-medium text-gray-700 mb-1">Notes</h3>
                            <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-2xl">
                              {selectedItem.notes}
                            </p>
                          </div>
                        )}

                        <div className="space-y-2 text-sm text-gray-500">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            <span>
                              Added {formatDate(selectedItem.createdAt.toISOString().split('T')[0])}
                            </span>
                          </div>

                          {selectedItem.url && (
                            <div className="flex items-center gap-2">
                              <Link className="w-4 h-4" />
                              <a
                                href={selectedItem.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-500 hover:underline"
                              >
                                Visit Website
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Footer navigation - always visible */}
                  <nav className="bg-slate-100 border-t border-slate-200 flex justify-between rounded-b-2xl p-2 flex-shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteItem(e, selectedItem.id);
                      }}
                      className="p-3 hover:bg-gray-100 rounded-full"
                    >
                      <Trash2 className="w-5 h-5 text-gray-400" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        startEdit(e, selectedItem);
                      }}
                      className="p-3 hover:bg-gray-100 rounded-full"
                    >
                      <Edit2 className="w-5 h-5 text-gray-400" />
                    </button>
                    {selectedItem.url && (
                      <a
                        href={selectedItem.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:underline inline-flex items-center gap-2 p-3"
                      >
                        <Link className="w-4 h-4" />
                      </a>
                    )}
                    <button
                      onClick={handleCloseModal}
                      className="p-3"
                    >
                      <X className="w-5 h-5 text-gray-400" />
                    </button>
                  </nav>
                </div>
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
              className="fixed left-4 right-4 top-1/4 w-[calc(100%-2rem)] lg:max-w-md lg:left-1/2 lg:-translate-x-1/2 bg-white rounded-2xl shadow-xl p-4 z-50 max-h-[80vh] overflow-y-auto"
              style={{ maxWidth: '28rem' }}
            >
              <form onSubmit={addItem} className="flex flex-col gap-4 relative">
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <input
                      type={inputType === 'url' ? 'url' : 'text'}
                      value={newUrl}
                      onChange={handleSearchInputChange}
                      placeholder={inputType === 'url' ? 'Add a URL...' : 'Search for a place...'}
                      className={`w-full px-4 py-2 border rounded-2xl focus:outline-none focus:ring-2 focus:ring-${accentColor}`}
                      autoFocus
                      disabled={isLoading || isSearching}
                    />
                    {isSearching && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                      </div>
                    )}
                    {inputType === 'place' && newUrl.length < 4 && newUrl.length > 0 && (
                      <div className="absolute z-[60] w-full mt-1 bg-white border rounded-2xl shadow-lg p-3 text-sm text-gray-500">
                        Please enter at least 4 characters to search...
                      </div>
                    )}
                    {inputType === 'place' && searchResults.length > 0 && (
                      <div className="absolute z-[60] w-full mt-1 bg-white border rounded-2xl shadow-lg max-h-60 overflow-y-auto top-full">
                        {searchResults.map((place) => (
                          <button
                            key={place.placeId}
                            type="button"
                            onClick={() => {
                              setSelectedPlace(place)
                              handlePlaceSelect(place)
                            }}
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
                  {inputType === 'place' ? (
                    <button
                      type="button"
                      onClick={handlePlaceSearch}
                      disabled={isLoading || isSearching || newUrl.length < 4}
                      className={`bg-gradient-to-b ${buttonGradientFrom} ${buttonGradientTo} px-4 py-2 text-white rounded-2xl active:${buttonGradientTo} active:${buttonGradientFrom} focus:outline-none focus:ring-2 focus:ring-${buttonAccentColor} disabled:opacity-50`}
                    >
                      {isSearching ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Search className="w-5 h-5" />
                      )}
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={isLoading || !newUrl.trim()}
                      className={`bg-gradient-to-b ${buttonGradientFrom} ${buttonGradientTo} px-4 py-2 text-white rounded-2xl active:${buttonGradientTo} active:${buttonGradientFrom} focus:outline-none focus:ring-2 focus:ring-${buttonAccentColor} disabled:opacity-50`}
                    >
                      {isLoading ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        'Add'
                      )}
                    </button>
                  )}
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
    </FeatureErrorBoundary>
  )
}