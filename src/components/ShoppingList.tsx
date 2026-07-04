'use client'

import { useState, useMemo, useEffect } from 'react'
import { GroceryItem } from '@/types/grocery'
import { Plus, Trash2, Edit2, X, Check, ShoppingBasket, MoreVertical } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/contexts/AuthContext'
import AnimatedStoreSelector from './AnimatedStoreSelector'
import { FeatureErrorBoundary, ComponentErrorBoundary } from './ErrorBoundaries'
import {
  getGroceryItems,
  getArchivedGroceryItems,
  createGroceryItem,
  updateGroceryItem,
  deleteGroceryItem,
  archiveGroceryItem,
  ArchivedGroceryItem
} from '@/services/groceryService'
import { logComponentError } from '@/lib/logger'

const STORE_ORDER = ['Publix', 'Costco', 'Aldi'] as const

export function ShoppingList() {
  const [items, setItems] = useState<GroceryItem[]>([])
  const [archivedItems, setArchivedItems] = useState<ArchivedGroceryItem[]>([])
  const [newItem, setNewItem] = useState('')
  const [editingItem, setEditingItem] = useState<GroceryItem | null>(null)
  const [editText, setEditText] = useState('')
  const [editStore, setEditStore] = useState<'Publix' | 'Costco' | 'Aldi'>('Publix')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [showEditControls, setShowEditControls] = useState<string | null>(null)
  const [selectedStore, setSelectedStore] = useState<'Publix' | 'Costco' | 'Aldi'>('Publix')
  const [loading, setLoading] = useState(true)

  const { user } = useAuth()

  const hasCheckedItems = useMemo(() => items.some(item => item.checked), [items])
  const checkedCount = useMemo(() => items.filter(item => item.checked).length, [items])

  const storeOptions = [
    { value: 'Publix', color: 'green' },
    { value: 'Costco', color: 'blue' },
    { value: 'Aldi', color: 'orange' }
  ] as const

  const groupedItems = useMemo(() => {
    const groups = items.reduce((acc, item) => {
      if (!acc[item.store]) {
        acc[item.store] = []
      }
      acc[item.store].push(item)
      return acc
    }, {} as Record<string, GroceryItem[]>)

    // Sort items within each store group
    Object.keys(groups).forEach(store => {
      groups[store].sort((a, b) => a.name.localeCompare(b.name))
    })

    return groups
  }, [items])

  useEffect(() => {
    if (!user) return
    loadGroceryData()
  }, [user])

  const loadGroceryData = async () => {
    try {
      setLoading(true)
      const [groceryItems, archived] = await Promise.all([
        getGroceryItems(),
        getArchivedGroceryItems()
      ])

      setItems(groceryItems)
      setArchivedItems(archived)
    } catch (error) {
      logComponentError('Failed to load grocery data', 'ShoppingList', error as Error)
    } finally {
      setLoading(false)
    }
  }

  const addItem = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newItem.trim() || !user) return

    try {
      const newItemData = await createGroceryItem({
        name: newItem.trim(),
        store: selectedStore,
        checked: false
      })

      setItems(prev => [...prev, newItemData])
      setNewItem('')
      setIsModalOpen(false)
    } catch (error) {
      logComponentError('Failed to add grocery item', 'ShoppingList', error as Error)
    }
  }

  const toggleCheck = async (id: string) => {
    if (!user) return

    try {
      const item = items.find(i => i.id === id)
      if (!item) return

      const updatedItem = await updateGroceryItem(id, { checked: !item.checked })

      setItems(prev => prev.map(item =>
        item.id === id ? updatedItem : item
      ))
    } catch (error) {
      logComponentError('Failed to toggle grocery item', 'ShoppingList', error as Error)
    }
  }

  const startEdit = (e: React.MouseEvent, item: GroceryItem) => {
    e.stopPropagation()
    setEditingItem(item)
    setEditText(item.name)
    setEditStore(item.store)
  }

  const saveEdit = async () => {
    if (!editingItem || !editText.trim() || !user) return

    try {
      const updatedItem = await updateGroceryItem(editingItem.id, {
        name: editText.trim(),
        store: editStore
      })

      setItems(prev => prev.map(item =>
        item.id === editingItem.id ? updatedItem : item
      ))
      setEditingItem(null)
      setEditText('')
    } catch (error) {
      logComponentError('Failed to save grocery item edit', 'ShoppingList', error as Error)
    }
  }

  const deleteItem = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    if (!user) return

    try {
      await deleteGroceryItem(id)
      setItems(prev => prev.filter(item => item.id !== id))
    } catch (error) {
      logComponentError('Failed to delete grocery item', 'ShoppingList', error as Error)
    }
  }

  const archiveChecked = async () => {
    if (!user) return

    const checkedItems = items.filter(item => item.checked)
    if (checkedItems.length === 0) return

    try {
      // Archive items one by one using the service
      for (const item of checkedItems) {
        await archiveGroceryItem(item)
      }

      // Refresh data to get updated lists
      await loadGroceryData()
    } catch (error) {
      logComponentError('Failed to archive grocery items', 'ShoppingList', error as Error)
    }
  }

  const itemVariants = {
    initial: { opacity: 0, y: 20, scale: 0.95 },
    animate: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, x: -100, scale: 0.95 },
  }

  const orderedStores = STORE_ORDER.filter(store => groupedItems[store]?.length)

  return (
    <FeatureErrorBoundary featureName="Shopping List">
      <div className="mx-auto w-full max-w-md pb-36 md:max-w-2xl">
        <ComponentErrorBoundary>
          {loading ? (
            <div className="space-y-3" role="status" aria-live="polite" aria-label="Loading groceries">
              {[...Array(2)].map((_, g) => (
                <div key={g} className="space-y-2">
                  <div className="h-4 w-20 animate-pulse rounded-full bg-surface-2" />
                  <div className="card animate-pulse divide-y divide-line-soft overflow-hidden">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="flex items-center gap-3 p-4">
                        <div className="size-6 rounded-full bg-surface-2" />
                        <div className="h-4 w-2/5 rounded-full bg-surface-2" />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center gap-4 py-20 text-center">
              <div className="flex size-16 items-center justify-center rounded-full bg-tint">
                <ShoppingBasket className="size-7 text-tint-ink" />
              </div>
              <div className="space-y-1">
                <p className="font-display text-lg font-semibold text-ink">All stocked up</p>
                <p className="text-sm text-ink-soft">Add whatever we&apos;re out of and it shows up here.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {orderedStores.map(store => (
                <section key={store}>
                  <h2 className="mb-2 flex items-baseline gap-2 px-1">
                    <span className="font-display text-sm font-bold uppercase tracking-wider text-hue">{store}</span>
                    <span className="text-xs tabular-nums text-ink-faint">{groupedItems[store].length}</span>
                  </h2>
                  <div className="card divide-y divide-line-soft overflow-hidden">
                    <AnimatePresence mode="popLayout">
                      {groupedItems[store].map(item => (
                        <motion.div
                          key={item.id}
                          variants={itemVariants}
                          initial="initial"
                          animate="animate"
                          exit="exit"
                          layout
                          className="flex items-center gap-1 pr-2"
                          style={{ touchAction: 'manipulation' }}
                        >
                          {editingItem?.id === item.id ? (
                            <div className="flex flex-1 flex-col gap-2 p-3" onClick={(e) => e.stopPropagation()}>
                              <input
                                type="text"
                                value={editText}
                                onChange={(e) => setEditText(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
                                className="field"
                                autoFocus
                              />
                              <AnimatedStoreSelector
                                value={editStore}
                                onChange={setEditStore}
                                storeOptions={storeOptions}
                              />
                              <div className="flex justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingItem(null)
                                    setEditText('')
                                  }}
                                  className="btn-quiet px-4 py-2 text-sm"
                                >
                                  Cancel
                                </button>
                                <button
                                  type="button"
                                  onClick={saveEdit}
                                  className="btn-primary px-4 py-2 text-sm"
                                >
                                  Save
                                </button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <button
                                onClick={() => toggleCheck(item.id)}
                                className="flex min-h-[52px] flex-1 items-center gap-3 px-4 py-2 text-left"
                                style={{ touchAction: 'manipulation' }}
                                aria-pressed={item.checked}
                              >
                                <motion.span
                                  animate={item.checked ? { scale: [1, 1.25, 1] } : { scale: 1 }}
                                  transition={{ duration: 0.25, ease: 'easeOut' }}
                                  className={`flex size-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors duration-150 ${
                                    item.checked
                                      ? 'border-hue-strong bg-hue-strong'
                                      : 'border-line bg-transparent'
                                  }`}
                                >
                                  {item.checked && <Check className="size-4 text-on-hue" strokeWidth={3} />}
                                </motion.span>
                                <span
                                  className={`text-[15px] transition-colors duration-150 ${
                                    item.checked ? 'text-ink-faint line-through' : 'font-medium text-ink'
                                  }`}
                                >
                                  {item.name}
                                </span>
                              </button>

                              <AnimatePresence>
                                {showEditControls === item.id && (
                                  <motion.div
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.8 }}
                                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                                    className="flex gap-1"
                                  >
                                    <motion.button
                                      whileTap={{ scale: 0.9 }}
                                      onClick={(e) => startEdit(e, item)}
                                      aria-label={`Edit ${item.name}`}
                                      className="flex size-10 items-center justify-center rounded-full text-ink-faint hover:bg-surface-2 hover:text-ink"
                                      style={{ touchAction: 'manipulation' }}
                                    >
                                      <Edit2 className="size-4" />
                                    </motion.button>
                                    <motion.button
                                      whileTap={{ scale: 0.9 }}
                                      onClick={(e) => deleteItem(e, item.id)}
                                      aria-label={`Delete ${item.name}`}
                                      className="flex size-10 items-center justify-center rounded-full text-ink-faint hover:bg-surface-2 hover:text-red-600"
                                      style={{ touchAction: 'manipulation' }}
                                    >
                                      <Trash2 className="size-4" />
                                    </motion.button>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                              <motion.button
                                whileTap={{ scale: 0.9 }}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setShowEditControls(showEditControls === item.id ? null : item.id)
                                }}
                                aria-label={`More options for ${item.name}`}
                                className="flex size-10 items-center justify-center rounded-full text-ink-faint hover:bg-surface-2 hover:text-ink"
                                style={{ touchAction: 'manipulation' }}
                              >
                                <MoreVertical className="size-4" />
                              </motion.button>
                            </>
                          )}
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </section>
              ))}
            </div>
          )}
        </ComponentErrorBoundary>

        {/* Clear checked pill */}
        <AnimatePresence>
          {hasCheckedItems && (
            <motion.button
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 16 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              onClick={archiveChecked}
              className="btn-primary fixed bottom-24 left-1/2 z-30 -translate-x-1/2 md:bottom-8"
            >
              <Check className="size-4" strokeWidth={3} />
              Got {checkedCount === 1 ? 'it' : `${checkedCount} things`}
            </motion.button>
          )}
        </AnimatePresence>

        {/* Add button */}
        <motion.button
          onClick={() => setIsModalOpen(true)}
          whileTap={{ scale: 0.92 }}
          className="fixed bottom-24 right-4 z-30 flex size-14 items-center justify-center rounded-full bg-hue-strong text-on-hue shadow-pop md:bottom-8 md:right-8"
          aria-label="Add grocery item"
        >
          <Plus className="size-6" />
        </motion.button>

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
                className="fixed inset-0 z-40 bg-black/50"
              />

              {/* Modal */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -20 }}
                className="fixed left-4 right-4 top-1/4 z-50 mx-auto max-h-[80vh] max-w-md overflow-y-auto rounded-3xl bg-surface p-4 shadow-pop"
              >
                <form onSubmit={addItem} className="flex flex-col gap-4" onClick={(e) => e.stopPropagation()}>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newItem}
                      onChange={(e) => setNewItem(e.target.value)}
                      placeholder="What are we out of?"
                      className="field flex-1"
                      autoFocus
                    />
                    <button type="submit" className="btn-primary shrink-0">
                      Add
                    </button>
                  </div>
                  <div className="flex justify-between gap-2" onClick={(e) => e.stopPropagation()}>
                    <AnimatedStoreSelector
                      className="grow"
                      value={selectedStore}
                      onChange={setSelectedStore}
                      storeOptions={storeOptions}
                    />
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      aria-label="Close"
                      className="flex size-11 shrink-0 items-center justify-center rounded-full text-ink-faint hover:bg-surface-2 hover:text-ink"
                    >
                      <X className="size-5" />
                    </button>
                  </div>
                </form>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </FeatureErrorBoundary>
  )
}
