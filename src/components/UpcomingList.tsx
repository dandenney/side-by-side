'use client'

import { useState, useEffect } from 'react'
import { UpcomingItem, UpcomingItemForm } from '@/types/upcoming'
import { Plus, Trash2, Edit2, X, Link, Calendar as CalendarIcon, MapPin } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { getUpcomingEvents, createUpcomingEvent, updateUpcomingEvent, deleteUpcomingEvent } from '@/services/upcomingEvents'
import { Calendar } from '@/components/ui/calendar'
import { DateRange } from 'react-day-picker'
import Image from 'next/image'
import { logComponentError } from '@/lib/logger'
import { FeatureErrorBoundary, ComponentErrorBoundary } from './ErrorBoundaries'

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

const modalContentVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.4 } },
}

export default function UpcomingList() {
  const [items, setItems] = useState<UpcomingItem[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<UpcomingItem | null>(null)
  const [editingItem, setEditingItem] = useState<UpcomingItem | null>(null)
  const [formData, setFormData] = useState<UpcomingItemForm>(initialFormState)
  const [isFetchingMeta, setIsFetchingMeta] = useState(false)
  const [metaError, setMetaError] = useState<string | null>(null)
  const [inferredDateSource, setInferredDateSource] = useState<string | null>(null)
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined)
  const [calendarMonth, setCalendarMonth] = useState<Date>(new Date())
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadUpcomingEvents()
  }, [])

  // Lock body scroll when modals are open
  useEffect(() => {
    if (selectedItem || isModalOpen || isCalendarOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [selectedItem, isModalOpen, isCalendarOpen])

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
      logComponentError('Failed to load upcoming events', 'UpcomingList', error as Error)
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
      logComponentError('Failed to fetch metadata', 'UpcomingList', error as Error, { url })
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
        // Only suggest a date when the user hasn't already picked one.
        if (metaData.startDate && !formData.startDate) {
          applyInferredDates(metaData.startDate, metaData.endDate, metaData.dateSource)
        }
      }
      setIsFetchingMeta(false)
    }
  }

  const applyInferredDates = (startDate: string, endDate: string | null, source: string | null) => {
    const toLocalDate = (value: string) => {
      const [year, month, day] = value.split('-').map(Number)
      return new Date(year, month - 1, day)
    }

    const resolvedEnd = endDate || startDate
    setDateRange({ from: toLocalDate(startDate), to: toLocalDate(resolvedEnd) })
    setCalendarMonth(toLocalDate(startDate))
    setFormData(prev => ({ ...prev, startDate, endDate: resolvedEnd }))
    setInferredDateSource(source)
  }

  const handleDateSelect = (range: DateRange | undefined) => {
    // A hand-picked date is no longer a suggestion.
    setInferredDateSource(null)

    const formatDateForDb = (date: Date) => {
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    }

    if (range?.from && !range?.to) {
      // First click - set both start and end to the same date (single day event)
      const singleDayRange = {
        from: range.from,
        to: range.from
      }
      setDateRange(singleDayRange)
      setFormData(prev => ({
        ...prev,
        startDate: formatDateForDb(range.from!),
        endDate: formatDateForDb(range.from!),
      }))
    } else if (range?.from && range?.to) {
      // Second click - user wants a date range
      setDateRange(range)
      setFormData(prev => ({
        ...prev,
        startDate: formatDateForDb(range.from!),
        endDate: formatDateForDb(range.to!),
      }))
    } else {
      // Reset/clear
      setDateRange(range)
    }
  }

  // When opening the add modal, start with no date selected
  const openAddModal = () => {
    setDateRange(undefined) // No default date
    setCalendarMonth(new Date()) // Reset to current month
    setFormData(initialFormState) // Reset form
    setInferredDateSource(null)
    setEditingItem(null)
    setIsModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      // Ensure startDate and endDate are set
      let startDate = formData.startDate
      let endDate = formData.endDate
      if (!startDate || !endDate) {
        // If no date selected, default to today for both
        const today = new Date()
        startDate = today.toISOString().split('T')[0]
        endDate = today.toISOString().split('T')[0]
      }
      const submitData = { ...formData, startDate, endDate }
      if (editingItem) {
        const updatedItem = await updateUpcomingEvent(editingItem.id, submitData)
        setItems(prev => {
          const updated = prev.map(item => item.id === updatedItem.id ? updatedItem : item)
          return updated.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
        })
        if (selectedItem?.id === editingItem.id) {
          setSelectedItem(updatedItem)
        }
      } else {
        const newItem = await createUpcomingEvent(submitData)
        setItems(prev => {
          const updated = [...prev, newItem]
          return updated.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
        })
      }
      setIsModalOpen(false)
      setFormData(initialFormState)
      setEditingItem(null)
    } catch (error) {
      logComponentError('Failed to save event', 'UpcomingList', error as Error, { 
        action: editingItem ? 'update' : 'create',
        eventId: editingItem?.id,
        title: formData.title 
      })
    }
  }

  const handleEdit = (item: UpcomingItem) => {
    setEditingItem(item)
    setInferredDateSource(null)
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
      logComponentError('Failed to delete event', 'UpcomingList', error as Error, { eventId: id })
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
    <FeatureErrorBoundary featureName="Upcoming Events">
      <div className="mx-auto w-full max-w-md pb-32 md:max-w-2xl">
        <ComponentErrorBoundary>
          <section className="grid grid-cols-1 gap-3" role="list">
            {isLoading ? (
              <div className="col-span-full space-y-3" role="status" aria-live="polite" aria-label="Loading upcoming events">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="card animate-pulse overflow-hidden">
                    <div className="p-4 space-y-3">
                      <div className="flex justify-between">
                        <div className="h-3.5 w-20 bg-surface-2 rounded-full" />
                        <div className="h-5 w-16 bg-surface-2 rounded-full" />
                      </div>
                      <div className="h-5 w-3/4 bg-surface-2 rounded-lg" />
                      <div className="h-3.5 w-1/2 bg-surface-2 rounded-full" />
                    </div>
                  </div>
                ))}
              </div>
            ) : items.length === 0 ? (
              <div className="col-span-full flex flex-col items-center gap-4 py-20 text-center">
                <div className="flex size-16 items-center justify-center rounded-full bg-tint">
                  <CalendarIcon className="size-7 text-tint-ink" />
                </div>
                <div className="space-y-1">
                  <p className="font-display text-lg font-semibold text-ink">Nothing on the calendar</p>
                  <p className="text-sm text-ink-soft">Add the next thing you two are excited about.</p>
                </div>
              </div>
            ) : (
              items.map((item) => (
                <motion.div
                  key={item.id}
                  role="listitem"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="card cursor-pointer overflow-hidden transition-shadow duration-150 hover:shadow-pop"
                  onClick={() => handleCardClick(item)}
                >
                  <div className="flex items-start gap-3 p-4">
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold uppercase tracking-wide text-hue">
                          {formatDateDifference(item.startDate)}
                        </span>
                        <span
                          className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            item.status === 'tickets'
                              ? 'bg-hue-strong text-on-hue'
                              : item.status === 'definitely'
                                ? 'bg-tint text-tint-ink'
                                : 'border border-line bg-surface-2 text-ink-soft'
                          }`}
                        >
                          {item.status === 'tickets' ? 'Tickets!' : item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                        </span>
                      </div>
                      <h3 className="font-display text-lg font-semibold leading-snug text-ink text-balance">{item.title}</h3>
                      <p className="text-sm text-ink-faint tabular-nums">{formatDate(item.startDate)}</p>
                      {item.location && (
                        <div className="flex items-center gap-1.5 text-sm text-ink-faint">
                          <MapPin className="size-3.5 shrink-0" />
                          <span className="truncate">{item.location}</span>
                        </div>
                      )}
                    </div>
                    {item.imageUrl && (
                      <div className="relative size-20 shrink-0 overflow-hidden rounded-xl ring-1 ring-line">
                        <Image
                          src={item.imageUrl}
                          alt={item.title}
                          fill
                          className="object-cover"
                          sizes="80px"
                        />
                      </div>
                    )}
                  </div>
                </motion.div>
              ))
            )}
          </section>
        </ComponentErrorBoundary>

      {/* Add Item Button */}
      <motion.button
        onClick={openAddModal}
        whileTap={{ scale: 0.92 }}
        className="fixed bottom-24 right-4 z-30 flex size-14 items-center justify-center rounded-full bg-hue-strong text-on-hue shadow-pop md:bottom-8 md:right-8"
        aria-label="Add new event"
      >
        <Plus className="size-6" />
      </motion.button>

      {/* Event Detail Modal */}
      <AnimatePresence>
        {selectedItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={handleCloseModal}
          >
            <motion.div
              variants={modalContentVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="mx-auto flex max-h-[90vh] w-full max-w-4xl flex-col rounded-3xl bg-surface shadow-pop"
              layoutId={`card-${selectedItem.id}`}
              style={{ width: '100%', maxWidth: '56rem' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex flex-col min-h-0 flex-1">
                {selectedItem.imageUrl && (
                  <div className="relative w-full overflow-hidden rounded-t-3xl" style={{ aspectRatio: '16/9' }}>
                    <Image
                      src={selectedItem.imageUrl}
                      alt={selectedItem.title}
                      fill
                      className="object-cover ring-1 ring-inset ring-black/10"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                  </div>
                )}
                <div className="flex-1 overflow-y-auto p-6 space-y-4 min-h-0">
                  <div className="flex justify-between items-start gap-4">
                    <div className="space-y-1">
                      <span className="text-xs font-bold uppercase tracking-wide text-hue">{formatDateDifference(selectedItem.startDate)}</span>
                      <h2 className="font-display text-2xl font-semibold text-ink text-balance">{selectedItem.title}</h2>
                    </div>
                    <button
                      onClick={handleCloseModal}
                      className="flex size-10 shrink-0 items-center justify-center rounded-full text-ink-faint hover:bg-surface-2 hover:text-ink-soft"
                      aria-label="Close"
                    >
                      <X className="size-4" />
                    </button>
                  </div>

                  <div className="space-y-3">
                    {selectedItem.description && (
                      <p className="text-sm text-ink-soft text-pretty">{selectedItem.description}</p>
                    )}

                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-ink-soft">
                        <CalendarIcon className="size-4 shrink-0 text-hue" />
                        <span className="tabular-nums">
                          {formatDate(selectedItem.startDate)}
                          {selectedItem.startDate !== selectedItem.endDate && (
                            <> – {formatDate(selectedItem.endDate)}</>
                          )}
                        </span>
                      </div>

                      {selectedItem.location && (
                        <div className="flex items-center gap-2 text-sm text-ink-soft">
                          <MapPin className="size-4 shrink-0 text-hue" />
                          <span>{selectedItem.location}</span>
                        </div>
                      )}

                      {selectedItem.url && (
                        <div className="flex items-center gap-2 text-sm">
                          <Link className="size-4 shrink-0 text-hue" />
                          <a
                            href={selectedItem.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-medium text-hue hover:underline"
                          >
                            Visit website
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <nav className="flex items-center justify-between rounded-b-3xl border-t border-line-soft bg-surface-2/60 p-3">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(selectedItem.id);
                      handleCloseModal();
                    }}
                    className="flex size-11 items-center justify-center rounded-full text-ink-faint hover:bg-surface-2 hover:text-red-600"
                    aria-label="Delete"
                  >
                    <Trash2 className="size-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEdit(selectedItem);
                    }}
                    className="flex size-11 items-center justify-center rounded-full text-ink-faint hover:bg-surface-2 hover:text-ink"
                    aria-label="Edit"
                  >
                    <Edit2 className="size-4" />
                  </button>
                  {selectedItem.url && (
                    <a
                      href={selectedItem.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex size-11 items-center justify-center rounded-full text-hue hover:bg-surface-2"
                      aria-label="Visit website"
                    >
                      <Link className="size-4" />
                    </a>
                  )}
                  <button
                    onClick={handleCloseModal}
                    className="flex size-11 items-center justify-center rounded-full text-ink-faint hover:bg-surface-2 hover:text-ink"
                    aria-label="Close"
                  >
                    <X className="size-4" />
                  </button>
                </nav>
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
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={handleCloseModal}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-3xl bg-surface p-6 shadow-pop"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-5 flex items-center justify-between">
                <h2 className="font-display text-xl font-semibold text-ink">
                  {editingItem ? 'Edit event' : 'Add an event'}
                </h2>
                <button
                  onClick={handleCloseModal}
                  aria-label="Close"
                  className="flex size-10 items-center justify-center rounded-full text-ink-faint hover:bg-surface-2 hover:text-ink-soft"
                >
                  <X className="size-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="title" className="field-label">
                    Title *
                  </label>
                  <input
                    id="title"
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    required
                    className="field"
                  />
                </div>

                <div>
                  <label htmlFor="description" className="field-label">
                    Description
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    className="field"
                    rows={3}
                  />
                </div>

                <div>
                  <label htmlFor="url" className="field-label">
                    URL
                  </label>
                  <div className="relative">
                    <input
                      id="url"
                      type="url"
                      name="url"
                      value={formData.url}
                      onChange={handleInputChange}
                      className="field"
                      placeholder="https://example.com"
                    />
                    {isFetchingMeta && (
                      <div className="absolute right-3 top-2">
                        <div className="size-5 animate-spin rounded-full border-b-2 border-hue"></div>
                      </div>
                    )}
                  </div>
                  {metaError && (
                    <p className="mt-1 text-sm text-red-500">{metaError}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="imageUrl" className="field-label">
                    Image URL
                  </label>
                  <input
                    id="imageUrl"
                    type="url"
                    name="imageUrl"
                    value={formData.imageUrl}
                    onChange={handleInputChange}
                    className="field"
                  />
                </div>

                <div>
                  <label htmlFor="location" className="field-label">
                    Location
                  </label>
                  <input
                    id="location"
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    className="field"
                  />
                </div>

                <div>
                  <label className="field-label">
                    Date *
                  </label>
                  
                  <button
                    type="button"
                    onClick={() => setIsCalendarOpen(true)}
                    className="field text-left"
                  >
                    <CalendarIcon className="inline mr-2 h-4 w-4" />
                    {dateRange?.from ? (
                      dateRange?.to && dateRange.from.getTime() !== dateRange.to.getTime() ? (
                        <>
                          {formatDate(dateRange.from.toISOString().split('T')[0])} -{" "}
                          {formatDate(dateRange.to.toISOString().split('T')[0])}
                        </>
                      ) : (
                        formatDate(dateRange.from.toISOString().split('T')[0])
                      )
                    ) : (
                      <span className="text-ink-faint">Tap to pick a date</span>
                    )}
                  </button>

                  {inferredDateSource && (
                    <p className="mt-1 text-sm text-ink-soft">
                      {inferredDateSource === 'text'
                        ? 'Guessed from the page text — double-check it.'
                        : 'Found on the linked page — tap to change.'}
                    </p>
                  )}

                  {/* Calendar Modal */}
                  {isCalendarOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setIsCalendarOpen(false)}>
                      <div className="flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden rounded-3xl bg-surface shadow-pop" onClick={(e) => e.stopPropagation()}>
                        <div className="border-b border-line-soft p-4">
                          <div className="mb-3 flex items-center justify-between">
                            <h3 className="font-display font-semibold text-ink">Pick a date</h3>
                            <button
                              type="button"
                              onClick={() => setIsCalendarOpen(false)}
                              aria-label="Close calendar"
                              className="flex size-10 items-center justify-center rounded-full text-ink-faint hover:bg-surface-2"
                            >
                              <X className="size-4" />
                            </button>
                          </div>
                          <p className="mb-3 text-sm text-ink-soft">
                            Tap once for a single day, tap a second date for a range.
                          </p>
                          {/* Quick month jumps */}
                          <div className="flex gap-1 text-xs">
                            <button
                              type="button"
                              onClick={() => {
                                const nextMonth = new Date(calendarMonth)
                                nextMonth.setMonth(nextMonth.getMonth() + 1)
                                setCalendarMonth(nextMonth)
                              }}
                              className="rounded-full bg-surface-2 px-3 py-1.5 font-medium text-ink-soft hover:text-ink"
                            >
                              Next Month
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const nextQuarter = new Date(calendarMonth)
                                nextQuarter.setMonth(nextQuarter.getMonth() + 3)
                                setCalendarMonth(nextQuarter)
                              }}
                              className="rounded-full bg-surface-2 px-3 py-1.5 font-medium text-ink-soft hover:text-ink"
                            >
                              +3 Months
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const nextYear = new Date(calendarMonth)
                                nextYear.setFullYear(nextYear.getFullYear() + 1)
                                setCalendarMonth(nextYear)
                              }}
                              className="rounded-full bg-surface-2 px-3 py-1.5 font-medium text-ink-soft hover:text-ink"
                            >
                              Next Year
                            </button>
                          </div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4">
                          <Calendar
                            mode="range"
                            month={calendarMonth}
                            onMonthChange={setCalendarMonth}
                            selected={dateRange}
                            onSelect={(range) => {
                              handleDateSelect(range)
                              if (range?.from && (!range?.to || range.from.getTime() === range.to.getTime())) {
                                // Auto-close for single date selection
                                setTimeout(() => setIsCalendarOpen(false), 200)
                              }
                            }}
                            numberOfMonths={1}
                            className="w-full [&_thead_tr]:grid [&_thead_tr]:grid-cols-7 [&_tbody_tr]:grid [&_tbody_tr]:grid-cols-7 [&_table]:w-full"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label htmlFor="status" className="field-label">
                    Status
                  </label>
                  <select
                    id="status"
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="field"
                  >
                    <option value="tickets">Tickets</option>
                    <option value="definitely">Definitely</option>
                    <option value="maybe">Maybe</option>
                  </select>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="btn-primary"
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
    </FeatureErrorBoundary>
  )
} 