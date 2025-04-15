'use client'

import { useState, useEffect } from 'react'
import { UpcomingItem, UpcomingItemForm } from '@/types/upcoming'
import { Plus, Trash2, Edit2, X, Link, Calendar as CalendarIcon, MapPin } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { getUpcomingEvents, createUpcomingEvent, updateUpcomingEvent, deleteUpcomingEvent } from '@/services/upcomingEvents'
import { Calendar } from '@/components/ui/calendar'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { DateRange } from 'react-day-picker'

const formatDate = (dateStr: string) => {
  const [year, month, day] = dateStr.split('-')
  const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

const formatDateDifference = (dateStr: string) => {
  const [year, month, day] = dateStr.split('-')
  const eventDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const diffTime = eventDate.getTime() - today.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  if (diffDays < 0) return 'Past event'
  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Tomorrow'
  if (diffDays < 7) return `In ${diffDays} days`
  if (diffDays < 14) return 'Next week'
  if (diffDays < 21) return 'In two weeks'
  if (diffDays < 28) return 'In three weeks'
  if (diffDays < 60) return 'Next month'
  return formatDate(dateStr)
}

const initialFormState: UpcomingItemForm = {
  title: '',
  description: '',
  url: '',
  imageUrl: '',
  location: '',
  startDate: '',
  endDate: '',
  status: 'definitely'
}

export default function UpcomingList() {
  const [items, setItems] = useState<UpcomingItem[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<UpcomingItem | null>(null)
  const [editingItem, setEditingItem] = useState<UpcomingItem | null>(null)
  const [formData, setFormData] = useState<UpcomingItemForm>(initialFormState)
  const [isFetchingMeta, setIsFetchingMeta] = useState(false)
  const [metaError, setMetaError] = useState<string | null>(null)
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadUpcomingEvents()
  }, [])

  const loadUpcomingEvents = async () => {
    try {
      setIsLoading(true)
      const events = await getUpcomingEvents()
      // Sort events by start date
      const sortedEvents = events.sort((a, b) => {
        const dateA = new Date(a.startDate)
        const dateB = new Date(b.startDate)
        return dateA.getTime() - dateB.getTime()
      })
      setItems(sortedEvents)
    } catch (error) {
      console.error('Error loading upcoming events:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchMetaData = async (url: string) => {
    try {
      setMetaError(null)
      const response = await fetch(`/api/meta?url=${encodeURIComponent(url)}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to fetch metadata')
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error('Error fetching metadata:', error)
      setMetaError(error instanceof Error ? error.message : 'Failed to fetch metadata')
      return null
    }
  }

  const handleInputChange = async (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))

    // If URL is changed, fetch metadata
    if (name === 'url' && value) {
      setIsFetchingMeta(true)
      const metaData = await fetchMetaData(value)
      if (metaData) {
        setFormData(prev => ({
          ...prev,
          title: metaData.title || prev.title,
          description: metaData.description || prev.description,
          imageUrl: metaData.image || prev.imageUrl,
        }))
      }
      setIsFetchingMeta(false)
    }
  }

  const handleDateSelect = (range: DateRange | undefined) => {
    setDateRange(range)
    if (range?.from && range?.to) {
      const formatDateForDb = (date: Date) => {
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const day = String(date.getDate()).padStart(2, '0')
        return `${year}-${month}-${day}`
      }
      setFormData(prev => ({
        ...prev,
        startDate: formatDateForDb(range.from!),
        endDate: formatDateForDb(range.to!),
      }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingItem) {
        const updatedItem = await updateUpcomingEvent(editingItem.id, formData)
        setItems(prev => {
          const updated = prev.map(item => item.id === updatedItem.id ? updatedItem : item)
          return updated.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
        })
      } else {
        const newItem = await createUpcomingEvent(formData)
        setItems(prev => {
          const updated = [...prev, newItem]
          return updated.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
        })
      }
      setIsModalOpen(false)
      setFormData(initialFormState)
    } catch (error) {
      console.error('Error saving event:', error)
    }
  }

  const handleEdit = (item: UpcomingItem) => {
    setEditingItem(item)
    setFormData({
      title: item.title,
      description: item.description || '',
      url: item.url || '',
      imageUrl: item.imageUrl || '',
      location: item.location || '',
      startDate: item.startDate,
      endDate: item.endDate,
      status: item.status,
    })
    // Set the date range for the calendar
    const [startYear, startMonth, startDay] = item.startDate.split('-')
    const [endYear, endMonth, endDay] = item.endDate.split('-')
    setDateRange({
      from: new Date(parseInt(startYear), parseInt(startMonth) - 1, parseInt(startDay)),
      to: new Date(parseInt(endYear), parseInt(endMonth) - 1, parseInt(endDay))
    })
    setIsModalOpen(true)
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteUpcomingEvent(id)
      setItems(prev => prev.filter(item => item.id !== id))
    } catch (error) {
      console.error('Error deleting event:', error)
    }
  }

  const handleCardClick = (item: UpcomingItem) => {
    setSelectedItem(item)
  }

  const handleCloseModal = () => {
    setSelectedItem(null)
    setEditingItem(null)
    setIsModalOpen(false)
    setDateRange(undefined)
  }

  return (
    <div className="space-y-6">
      {items.length > 0 && (
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center gap-2 text-blue-800">
            <CalendarIcon className="w-5 h-5" />
            <span className="font-medium">{items[0].title}</span>
            <span className="text-blue-600">{formatDateDifference(items[0].startDate)}</span>
          </div>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          <div className="col-span-full flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : items.length === 0 ? (
          <div className="col-span-full text-center text-gray-500">
            No upcoming events found. Add your first event!
          </div>
        ) : (
          items.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-lg shadow-sm border p-4 hover:bg-gray-50 cursor-pointer"
              onClick={() => handleCardClick(item)}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-medium text-gray-900">{item.title}</h3>
                  <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                    <CalendarIcon className="w-4 h-4" />
                    <span>{formatDate(item.startDate)}</span>
                  </div>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  item.status === 'tickets' ? 'bg-green-100 text-green-800' :
                  item.status === 'definitely' ? 'bg-blue-100 text-blue-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                </span>
              </div>
            </motion.div>
          ))
        )}
      </div>

      <div className="flex justify-between items-center">
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Event
        </button>
      </div>

      {/* Event Detail Modal */}
      <AnimatePresence>
        {selectedItem && (
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
              className="bg-white rounded-lg p-6 w-full max-w-md"
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">{selectedItem.title}</h2>
                <button
                  onClick={handleCloseModal}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                {selectedItem.imageUrl && (
                  <div className="relative w-full h-48 rounded-lg overflow-hidden">
                    <img
                      src={selectedItem.imageUrl}
                      alt={selectedItem.title}
                      className="object-cover w-full h-full"
                    />
                  </div>
                )}
                {selectedItem.description && (
                  <p className="text-gray-600">{selectedItem.description}</p>
                )}

                <div className="space-y-2 text-sm text-gray-500">
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="w-4 h-4" />
                    <span>
                      {formatDate(selectedItem.startDate)} -{' '}
                      {formatDate(selectedItem.endDate)}
                    </span>
                  </div>

                  {selectedItem.location && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      <span>{selectedItem.location}</span>
                    </div>
                  )}

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

                <div className="flex justify-end gap-2 pt-4">
                  <button
                    onClick={() => handleEdit(selectedItem)}
                    className="px-3 py-1 text-gray-600 hover:text-gray-800"
                  >
                    <Edit2 className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(selectedItem.id)}
                    className="px-3 py-1 text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add/Edit Event Modal */}
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
              className="bg-white rounded-lg p-6 w-full max-w-md"
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">
                  {editingItem ? 'Edit Event' : 'Add Event'}
                </h2>
                <button
                  onClick={handleCloseModal}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title *
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    URL
                  </label>
                  <div className="relative">
                    <input
                      type="url"
                      name="url"
                      value={formData.url}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="https://example.com"
                    />
                    {isFetchingMeta && (
                      <div className="absolute right-3 top-2">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
                      </div>
                    )}
                  </div>
                  {metaError && (
                    <p className="mt-1 text-sm text-red-500">{metaError}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Image URL
                  </label>
                  <input
                    type="url"
                    name="imageUrl"
                    value={formData.imageUrl}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Location
                  </label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date Range *
                  </label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !dateRange?.from && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateRange?.from ? (
                          dateRange?.to ? (
                            <>
                              {formatDate(dateRange.from.toISOString().split('T')[0])} -{" "}
                              {formatDate(dateRange.to.toISOString().split('T')[0])}
                            </>
                          ) : (
                            formatDate(dateRange.from.toISOString().split('T')[0])
                          )
                        ) : (
                          <span>Pick a date range</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        initialFocus
                        mode="range"
                        defaultMonth={dateRange?.from}
                        selected={dateRange}
                        onSelect={handleDateSelect}
                        numberOfMonths={2}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="tickets">Tickets</option>
                    <option value="definitely">Definitely</option>
                    <option value="maybe">Maybe</option>
                  </select>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    {editingItem ? 'Update' : 'Add'} Event
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