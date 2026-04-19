'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import { UrlListItem, Tag } from '@/types/url-list'
import { Plus, Trash2, Edit2, X, Link, Tag as TagIcon, StickyNote, Archive, Search, Calendar, MapPin, Phone, Film } from 'lucide-react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import Image from 'next/image'
import AppDrawer from './AppDrawer'
import TagInput from './TagInput'
import { createUrlItem, getUrlItems, updateUrlItem, deleteUrlItem, archiveUrlItem } from '@/lib/supabase/url-items'
import { getTags, createTag, deleteTag, addTagToItem, removeTagFromItem, getItemTags } from '@/lib/supabase/tags'
import { ImageIcon } from 'lucide-react'
import { PlaceSearchResult } from '@/lib/google/places'
import { MovieSearchResult } from '@/lib/movies'
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
  const [inputType, setInputType] = useState<'url' | 'place' | 'movie'>('url')
  const [searchResults, setSearchResults] = useState<PlaceSearchResult[]>([])
  const [selectedPlace, setSelectedPlace] = useState<PlaceSearchResult | null>(null)
  const [movieSearchResults, setMovieSearchResults] = useState<MovieSearchResult[]>([])
  const [selectedMovie, setSelectedMovie] = useState<MovieSearchResult | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTag, setSelectedTag] = useState<string | null>(null)
  const [isCreatingNewItem, setIsCreatingNewItem] = useState(false)
  const shouldReduceMotion = useReducedMotion()

  const inputTypeOptions = [
    { value: 'url', icon: Link, label: 'URL' },
    { value: 'place', icon: MapPin, label: 'Place' },
    { value: 'movie', icon: Film, label: 'Movie' }
  ] as const

  const InputTypeSelector = ({
    value,
    onChange,
    className,
  }: {
    value: 'url' | 'place' | 'movie',
    onChange: (value: 'url' | 'place' | 'movie') => void,
    className?: string
  }) => {
    return (
      <div className={`relative flex justify-end font-medium rounded-2xl bg-gray-100 ${className}`}>
        {inputTypeOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            className={`relative z-10 flex-1 px-3 py-1.5 rounded-md text-gray-400 transition-colors ease-in-out hover:text-gray-700 ${value === option.value ? 'bg-gray-200 text-gray-700' : ''
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
    initial: shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 20, scale: 0.95 },
    animate: shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 },
    exit: {
      opacity: 0,
      ...(shouldReduceMotion ? {} : { y: -10, scale: 0.95 }),
      transition: { duration: 0 }
    },
    tap: shouldReduceMotion ? {} : {
      scale: 0.96,
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 17
      }
    }
  }

  const modalContentVariants = {
    initial: { opacity: 0 },
    animate: { opacity: 1, transition: { duration: shouldReduceMotion ? 0 : 0.2 } },
    exit: { opacity: 0, transition: { duration: shouldReduceMotion ? 0 : 0.4 } },
  }

  // Shared layout transition for card-to-modal animation
  const layoutTransition = shouldReduceMotion
    ? { duration: 0 }
    : {
        type: "spring",
        stiffness: 300,
        damping: 30,
        mass: 1,
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

  // Clear search results when input type changes
  useEffect(() => {
    setSearchResults([])
    setMovieSearchResults([])
    setSelectedPlace(null)
    setSelectedMovie(null)
    setSearchQuery('')
    setNewUrl('')
  }, [inputType])

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setNewUrl(value)
    setSearchQuery(value)
    // Clear search results when input changes
    if (inputType === 'place') {
      setSearchResults([])
      setSelectedPlace(null)
    } else if (inputType === 'movie') {
      setMovieSearchResults([])
      setSelectedMovie(null)
    }
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

  const handleMovieSearch = async () => {
    if (!searchQuery.trim() || searchQuery.length < 3) {
      setMovieSearchResults([])
      return
    }

    setIsSearching(true)
    try {
      const response = await fetch(`/api/movies?query=${encodeURIComponent(searchQuery)}`)
      if (!response.ok) throw new Error('Failed to search movies')
      const results = await response.json()
      setMovieSearchResults(results)
    } catch (error) {
      console.error('Error searching movies:', error)
      setError('Failed to search movies. Please try again.')
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

        // Create a draft item instead of creating immediately
        const draftItem: UrlListItem = {
          id: 'new-item-' + Date.now(), // Temporary ID for new items
          url: newUrl.trim(),
          imageUrl: metaData.image || '',
          title: metaData.title || 'Untitled',
          description: metaData.description || '',
          listType,
          listId,
          archived: false,
          tags: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        }

        setIsCreatingNewItem(true)
        setEditingItem(draftItem)
        setSelectedItem(draftItem)
        setNewUrl('')
        setSearchQuery('')
        setSearchResults([])
        setMovieSearchResults([])
        setIsModalOpen(false)
      } else if (inputType === 'place') {
        // If we have search results and a selected place, use handlePlaceSelect
        if (searchResults.length > 0 && selectedPlace) {
          await handlePlaceSelectForForm(selectedPlace)
        } else {
          setError('Please select a place from the search results')
          return
        }
      } else if (inputType === 'movie') {
        // If we have search results and a selected movie, use handleMovieSelect
        if (movieSearchResults.length > 0 && selectedMovie) {
          await handleMovieSelectForForm(selectedMovie)
        } else {
          setError('Please select a movie from the search results')
          return
        }
      }
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
    setIsCreatingNewItem(false)
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
        if (isCreatingNewItem) {
          // Creating a new item
          const itemToCreate = {
            url: editingItem.url,
            imageUrl: editingItem.imageUrl || '',
            title: editingItem.title,
            description: editingItem.description || '',
            notes: editingItem.notes || '',
            dateRange: editingItem.dateRange,
            place: editingItem.place,
            listType: editingItem.listType,
            listId: editingItem.listId,
            archived: editingItem.archived || false,
          }

          const createdItem = await createUrlItem(itemToCreate)
          
          // Add tags if any were selected
          if (editingItem.tags && editingItem.tags.length > 0) {
            for (const tag of editingItem.tags) {
              await addTagToItem(createdItem.id, tag.id)
            }
          }

          // Refresh the items list to get the latest data with tags
          const refreshedItems = await getUrlItems(listType, listId)
          setItems(refreshedItems)
          
          setIsCreatingNewItem(false)
          setEditingItem(null)
          setSelectedItem(null)
        } else {
          // Updating an existing item
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
        }
      } catch (error) {
        alert('Failed to save item. Please try again.')
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
    
    // If creating a new item, just update the state
    if (isCreatingNewItem) {
      const currentTags = editingItem.tags || [];
      if (!currentTags.some(t => t.id === tag.id)) {
        setEditingItem({ ...editingItem, tags: [...currentTags, tag] });
      }
      return;
    }

    // For existing items, update in the database
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
    
    // If creating a new item, just update the state
    if (isCreatingNewItem) {
      const currentTags = editingItem.tags || [];
      setEditingItem({ ...editingItem, tags: currentTags.filter(t => t.id !== tagId) });
      return;
    }

    // For existing items, update in the database
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

  const handlePlaceSelectForForm = async (place: PlaceSearchResult) => {
    setIsSearching(true)
    setError(null)
    try {
      const response = await fetch(`/api/places?placeId=${encodeURIComponent(place.placeId)}`)
      if (!response.ok) throw new Error('Failed to get place details')
      const placeDetails = await response.json()

      // Generate Google Maps URL for the place
      const placeUrl = `https://www.google.com/maps/place/?q=place_id:${place.placeId}`

      // Create a draft item instead of creating immediately
      const draftItem: UrlListItem = {
        id: 'new-item-' + Date.now(), // Temporary ID for new items
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
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      setIsCreatingNewItem(true)
      setEditingItem(draftItem)
      setSelectedItem(draftItem)
      setNewUrl('')
      setSearchQuery('')
      setSearchResults([])
      setSelectedPlace(null)
      setIsModalOpen(false)
      setIsSearching(false)
    } catch (error) {
      console.error('Error in handlePlaceSelectForForm:', error)
      setError('Failed to add place. Please try again.')
      setIsSearching(false)
    }
  }

  const handleMovieSelectForForm = async (movie: MovieSearchResult) => {
    setIsSearching(true)
    setError(null)
    try {
      const response = await fetch(`/api/movies?imdbId=${encodeURIComponent(movie.imdbId)}`)
      if (!response.ok) throw new Error('Failed to get movie details')
      const movieDetails = await response.json()

      // Find or create "movie" tag
      let movieTag = tags.find(t => t.name.toLowerCase() === 'movie')
      if (!movieTag) {
        try {
          movieTag = await handleCreateTag('movie')
        } catch (error) {
          console.error('Error creating movie tag:', error)
          // Continue without the tag if creation fails
        }
      }

      // Create a draft item instead of creating immediately
      const draftItem: UrlListItem = {
        id: 'new-item-' + Date.now(), // Temporary ID for new items
        url: movieDetails.imdbUrl,
        title: movieDetails.title,
        description: movieDetails.plot || (movieDetails.year ? `${movieDetails.year}` : undefined),
        listType,
        listId,
        archived: false,
        tags: movieTag ? [movieTag] : [],
        imageUrl: movieDetails.poster || '',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      setIsCreatingNewItem(true)
      setEditingItem(draftItem)
      setSelectedItem(draftItem)
      setNewUrl('')
      setSearchQuery('')
      setMovieSearchResults([])
      setSelectedMovie(null)
      setIsModalOpen(false)
      setIsSearching(false)
    } catch (error) {
      console.error('Error in handleMovieSelectForForm:', error)
      setError('Failed to add movie. Please try again.')
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
            <h1 className="mb-1 text-center text-sm font-semibold text-gray-400">{title}</h1>

          {/* Tag Filter */}
          <div className="flex flex-wrap gap-2 px-4 justify-center">
            {[null, 'untagged', ...existingTags].map((tag) => (
              <button
                key={tag ?? '__all__'}
                onClick={() => setSelectedTag(tag)}
                className={`flex items-center gap-1 py-1 pr-2 pl-1.5 rounded-full text-sm font-medium ${
                  selectedTag === tag
                    ? 'bg-purple-50 text-purple-700 ring-1 ring-purple-600/20'
                    : 'bg-white/70 text-gray-500 ring-1 ring-gray-950/5'
                }`}
              >
                <TagIcon className="size-3" />
                <span>{tag === null ? 'All' : tag === 'untagged' ? 'Untagged' : tag}</span>
              </button>
            ))}
          </div>

          <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
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
                  transition={layoutTransition}
                  className={`flex flex-col bg-white rounded-2xl border border-gray-950/10 overflow-hidden hover:bg-gray-50/80 cursor-pointer ${selectedItem?.id === item.id ? 'pointer-events-none opacity-0' : ''}`}
                  layoutId={`card-${item.id}`}
                  onClick={() => handleCardClick(item)}
                  style={{ originX: 0.5, originY: 0.5 }}
                >
                  <motion.div
                    className="bg-gray-100 w-full overflow-hidden relative"
                    layoutId={`image-${item.id}`}
                    transition={layoutTransition}
                    style={{ aspectRatio: '16/9' }}
                  >
                    {item.imageUrl ? (
                      <Image
                        src={item.imageUrl}
                        alt={item.title}
                        fill
                        className="object-cover ring-1 ring-inset ring-black/10"
                        sizes="(max-width: 768px) 50vw, (max-width: 1280px) 25vw, 20vw"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-gray-300">
                        <ImageIcon className="size-8" />
                      </div>
                    )}
                  </motion.div>
                  <div className="p-3 flex-1 flex flex-col gap-2">
                    <motion.h3
                      className={`font-semibold text-sm text-balance ${textColor}`}
                      layoutId={`title-${item.id}`}
                      transition={layoutTransition}
                    >
                      {item.title}
                    </motion.h3>
                    <motion.div
                      className="flex flex-wrap gap-1"
                      layoutId={`tags-${item.id}`}
                      transition={layoutTransition}
                    >
                      {item.tags?.length ? (
                        item.tags.slice(0, 2).map(tag => (
                          <span
                            key={tag.id}
                            className="inline-flex items-center gap-1 py-0.5 pr-2 pl-1.5 bg-gray-100 rounded-full text-xs text-gray-500"
                          >
                            <TagIcon className="size-3" />
                            {tag.name}
                          </span>
                        ))
                      ) : (
                        <span className="inline-flex items-center gap-1 py-0.5 pr-2 pl-1.5 bg-gray-50 rounded-full text-xs text-gray-400">
                          <TagIcon className="size-3" />
                          Untagged
                        </span>
                      )}
                    </motion.div>
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
              whileTap={shouldReduceMotion ? undefined : { y: 4 }}
              aria-label="Add new item"
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
            transition={{ duration: shouldReduceMotion ? 0 : 0.2 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={handleCloseModal}
          >
            <motion.div
              layout
              transition={layoutTransition}
              className="w-full max-w-4xl mx-auto bg-white rounded-2xl overflow-hidden max-h-[90vh] flex flex-col"
              layoutId={isCreatingNewItem ? 'new-item' : `card-${selectedItem.id}`}
              style={{ width: '100%', maxWidth: '56rem', height: '90vh', originX: 0.5, originY: 0.5 }}
              onClick={(e) => e.stopPropagation()}
            >
              {editingItem && (editingItem.id === selectedItem.id || isCreatingNewItem) ? (
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
                        className="flex-1 bg-blue-500 text-white px-4 py-2 rounded-2xl font-medium text-sm hover:bg-blue-600"
                      >
                        Save
                      </button>
                      <button
                        onClick={handleCloseModal}
                        className="flex-1 bg-gray-100 text-gray-600 px-4 py-2 rounded-2xl font-medium text-sm hover:bg-gray-200"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col h-full">
                  {/* Scrollable content area */}
                  <div className="flex-1 overflow-y-auto">
                    {/* Image with overlaid close button */}
                    <div className="relative">
                      {selectedItem.imageUrl ? (
                        <motion.div
                          className="bg-gray-100 w-full overflow-hidden relative"
                          style={{ aspectRatio: '16/9' }}
                          layoutId={`image-${selectedItem.id}`}
                          transition={layoutTransition}
                        >
                          <Image
                            src={selectedItem.imageUrl}
                            alt={selectedItem.title}
                            fill
                            className="object-cover ring-1 ring-inset ring-black/10"
                            sizes="(max-width: 768px) 100vw, 56rem"
                          />
                        </motion.div>
                      ) : (
                        <motion.div
                          className="bg-gray-100 w-full overflow-hidden relative"
                          style={{ aspectRatio: '16/9' }}
                          layoutId={`image-${selectedItem.id}`}
                          transition={layoutTransition}
                        >
                          <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                            <ImageIcon className="w-12 h-12" />
                          </div>
                        </motion.div>
                      )}
                    </div>

                    <div className="p-6 space-y-4 pb-20">
                      {/* Title */}
                      <motion.h2
                        className="text-xl font-semibold text-balance"
                        layoutId={`title-${selectedItem.id}`}
                        transition={layoutTransition}
                      >
                        {selectedItem.title}
                      </motion.h2>

                      <div className="space-y-4">
                        {selectedItem.description && (
                          <p className="text-sm text-gray-600 text-pretty break-words overflow-wrap-anywhere">{selectedItem.description}</p>
                        )}

                        <motion.div
                          className="flex flex-wrap gap-1.5"
                          layoutId={`tags-${selectedItem.id}`}
                          transition={layoutTransition}
                        >
                          {selectedItem.tags && selectedItem.tags.length > 0 ? (
                            selectedItem.tags.map(tag => (
                              <span
                                key={tag.id}
                                className="inline-flex items-center gap-1 py-0.5 pr-2 pl-1.5 bg-gray-100 rounded-full text-xs text-gray-500"
                              >
                                <TagIcon className="size-3" />
                                {tag.name}
                              </span>
                            ))
                          ) : (
                            <span className="inline-flex items-center gap-1 py-0.5 pr-2 pl-1.5 bg-gray-50 rounded-full text-xs text-gray-400">
                              <TagIcon className="size-3" />
                              Untagged
                            </span>
                          )}
                        </motion.div>

                        {selectedItem.notes && (
                          <div className="space-y-1">
                            <h3 className="text-xs font-semibold text-gray-400">Notes</h3>
                            <p className="text-sm text-gray-600 text-pretty bg-gray-50 p-3 rounded-xl break-words overflow-wrap-anywhere">
                              {selectedItem.notes}
                            </p>
                          </div>
                        )}

                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm text-gray-400">
                            <Calendar className="size-4 shrink-0" />
                            <span className="tabular-nums">
                              Added {formatDate(selectedItem.createdAt.toISOString().split('T')[0])}
                            </span>
                          </div>

                          {selectedItem.url && (
                            <a
                              href={selectedItem.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 text-sm text-blue-500 hover:underline"
                            >
                              <Link className="size-4 shrink-0 text-gray-400" />
                              Visit Website
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Footer navigation - always visible */}
                  <nav className="flex items-center justify-between border-t border-gray-950/5 bg-gray-50/80 rounded-b-2xl p-3 shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteItem(e, selectedItem.id);
                      }}
                      aria-label="Delete item"
                      className="size-10 flex items-center justify-center rounded-full hover:bg-gray-100"
                    >
                      <Trash2 className="size-4 text-gray-400" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        startEdit(e, selectedItem);
                      }}
                      aria-label="Edit item"
                      className="size-10 flex items-center justify-center rounded-full hover:bg-gray-100"
                    >
                      <Edit2 className="size-4 text-gray-400" />
                    </button>
                    {selectedItem.url && (
                      <a
                        href={selectedItem.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="Visit website"
                        className="size-10 flex items-center justify-center rounded-full hover:bg-gray-100"
                      >
                        <Link className="size-4 text-blue-400" />
                      </a>
                    )}
                    <button
                      onClick={handleCloseModal}
                      aria-label="Close modal"
                      className="size-10 flex items-center justify-center rounded-full hover:bg-gray-100"
                    >
                      <X className="size-4 text-gray-400" />
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
              transition={{ duration: shouldReduceMotion ? 0 : 0.2 }}
              onClick={() => setIsModalOpen(false)}
              className="fixed inset-0 bg-black bg-opacity-50 z-40"
            />

            {/* Modal */}
            <motion.div
              initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.95, y: -20 }}
              animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 }}
              exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.95, y: -20 }}
              transition={{ duration: shouldReduceMotion ? 0 : 0.2 }}
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
                      placeholder={
                        inputType === 'url' ? 'Add a URL...' :
                        inputType === 'place' ? 'Search for a place...' :
                        'Search for a movie...'
                      }
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
                    {inputType === 'movie' && newUrl.length < 3 && newUrl.length > 0 && (
                      <div className="absolute z-[60] w-full mt-1 bg-white border rounded-2xl shadow-lg p-3 text-sm text-gray-500">
                        Please enter at least 3 characters to search...
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
                              handlePlaceSelectForForm(place)
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
                    {inputType === 'movie' && movieSearchResults.length > 0 && (
                      <div className="absolute z-[60] w-full mt-1 bg-white border rounded-2xl shadow-lg max-h-60 overflow-y-auto top-full">
                        {movieSearchResults.map((movie) => (
                          <button
                            key={movie.imdbId}
                            type="button"
                            onClick={() => {
                              setSelectedMovie(movie)
                              handleMovieSelectForForm(movie)
                            }}
                            className="w-full px-4 py-2 text-left hover:bg-gray-100 focus:outline-none focus:bg-gray-100 flex items-center gap-2"
                          >
                            {movie.poster ? (
                              <img
                                src={movie.poster}
                                alt={movie.title}
                                className="w-10 h-14 object-cover rounded flex-shrink-0"
                              />
                            ) : (
                              <Film className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="font-medium truncate">{movie.title}</div>
                              {movie.year && (
                                <div className="text-sm text-gray-500">{movie.year}</div>
                              )}
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
                  ) : inputType === 'movie' ? (
                    <button
                      type="button"
                      onClick={handleMovieSearch}
                      disabled={isLoading || isSearching || newUrl.length < 3}
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
                    aria-label="Close"
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