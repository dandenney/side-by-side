'use client'

import { useState, useMemo, useEffect } from 'react'
import { GroceryItem } from '@/types/grocery'
import { Plus, Trash2, Edit2, X, BadgeDollarSign, ShoppingBasket, MoreVertical} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import AppDrawer from './AppDrawer'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { SHARED_LIST_ID } from '@/lib/constants'
import AnimatedStoreSelector from './AnimatedStoreSelector'

type ShoppingListProps = {
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

export function ShoppingList({
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
}: ShoppingListProps) {
  const [items, setItems] = useState<GroceryItem[]>([])
  const [archivedItems, setArchivedItems] = useState<GroceryItem[]>([])
  const [newItem, setNewItem] = useState('')
  const [editingItem, setEditingItem] = useState<GroceryItem | null>(null)
  const [editText, setEditText] = useState('')
  const [editStore, setEditStore] = useState<'Publix' | 'Costco' | 'Aldi'>('Publix')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [showEditControls, setShowEditControls] = useState<string | null>(null)
  const [selectedStore, setSelectedStore] = useState<'Publix' | 'Costco' | 'Aldi'>('Publix')
  const [loading, setLoading] = useState(true)

  const { user } = useAuth()
  const supabase = createClient()

  const hasCheckedItems = useMemo(() => items.some(item => item.checked), [items])

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

    const initializeList = async () => {
      try {
        const { data: items, error: itemsError } = await supabase
          .from('grocery_items')
          .select('*')
          .eq('list_id', SHARED_LIST_ID)

        if (itemsError) {
          console.error('Error fetching items:', itemsError)
          throw itemsError
        }

        setItems(items?.map(item => ({
          ...item,
          checked: item.checked,
          createdAt: new Date(item.created_at),
          updatedAt: new Date(item.updated_at)
        })) || [])

        const { data: archived, error: archivedError } = await supabase
          .from('archived_items')
          .select('*')
          .eq('list_id', SHARED_LIST_ID)

        if (archivedError) {
          console.error('Error fetching archived items:', archivedError)
          throw archivedError
        }

        setArchivedItems(archived?.map(item => ({
          ...item,
          checked: false,
          createdAt: new Date(item.created_at),
          updatedAt: new Date(item.archived_at)
        })) || [])
      } catch (error) {
        console.error('Error initializing list:', error)
      } finally {
        setLoading(false)
      }
    }

    initializeList()
  }, [user])

  const addItem = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newItem.trim() || !user) return

    try {
      const itemToAdd = {
        name: newItem.trim(),
        store: selectedStore,
        checked: false,
        list_id: SHARED_LIST_ID
      } as const
      
      const { data, error } = await supabase
        .from('grocery_items')
        .insert(itemToAdd)
        .select()
        .single()

      if (error) {
        console.error('Error adding item to database:', error)
        throw error
      }

      const newItemObj: GroceryItem = {
        ...data,
        checked: data.checked,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at)
      }

      setItems(prev => [...prev, newItemObj])
      setNewItem('')
      setIsModalOpen(false)
    } catch (error) {
      console.error('Error in addItem:', error)
    }
  }

  const toggleCheck = async (id: string) => {
    if (!user) return

    try {
      const item = items.find(i => i.id === id)
      if (!item) return

      const { error } = await supabase
        .from('grocery_items')
        .update({ checked: !item.checked })
        .eq('id', id)
        .eq('list_id', SHARED_LIST_ID)

      if (error) {
        console.error('Error toggling check in database:', error)
        throw error
      }

      setItems(prev => prev.map(item =>
        item.id === id ? { ...item, checked: !item.checked } : item
      ))
    } catch (error) {
      console.error('Error in toggleCheck:', error)
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
      const updates = {
        name: editText.trim(),
        store: editStore
      }
      
      const { error } = await supabase
        .from('grocery_items')
        .update(updates)
        .eq('id', editingItem.id)
        .eq('list_id', SHARED_LIST_ID)

      if (error) {
        console.error('Error saving edit to database:', error)
        throw error
      }

      setItems(prev => prev.map(item =>
        item.id === editingItem.id
          ? { ...item, name: editText.trim(), store: editStore }
          : item
      ))
      setEditingItem(null)
      setEditText('')
    } catch (error) {
      console.error('Error in saveEdit:', error)
    }
  }

  const handleEditBlur = (e: React.FocusEvent) => {
    // Only save if the blur event is not caused by clicking on the store selector
    if (!e.relatedTarget || !e.relatedTarget.closest('.store-selector')) {
      saveEdit()
    }
  }

  const deleteItem = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    if (!user) return

    try {
      const { error } = await supabase
        .from('grocery_items')
        .delete()
        .eq('id', id)
        .eq('list_id', SHARED_LIST_ID)

      if (error) {
        console.error('Error deleting item from database:', error)
        throw error
      }

      setItems(prev => prev.filter(item => item.id !== id))
    } catch (error) {
      console.error('Error in deleteItem:', error)
    }
  }

  const archiveChecked = async () => {
    if (!user) return

    const checkedItems = items.filter(item => item.checked)
    if (checkedItems.length === 0) return

    try {
      const itemsToArchive = checkedItems.map(item => ({
        name: item.name,
        store: item.store,
        list_id: SHARED_LIST_ID,
        created_at: item.createdAt.toISOString()
      }))
      
      const { error: archiveError } = await supabase
        .from('archived_items')
        .insert(itemsToArchive)

      if (archiveError) {
        console.error('Error archiving items:', archiveError)
        throw archiveError
      }

      const itemIds = checkedItems.map(item => item.id)
      const { error: deleteError } = await supabase
        .from('grocery_items')
        .delete()
        .in('id', itemIds)
        .eq('list_id', SHARED_LIST_ID)

      if (deleteError) {
        console.error('Error deleting archived items:', deleteError)
        throw deleteError
      }

      setItems(prev => prev.filter(item => !item.checked))
      setArchivedItems(prev => [...prev, ...checkedItems])
    } catch (error) {
      console.error('Error in archiveChecked:', error)
    }
  }

  const StoreSelector = ({ 
    value, 
    onChange, 
    className,
  }: { 
    value: 'Publix' | 'Costco' | 'Aldi', 
    onChange: (value: 'Publix' | 'Costco' | 'Aldi') => void,
    className?: string
  }) => {
    return (
      <div className={`relative flex justify-end font-medium rounded-lg bg-gray-100 ${className}`}>
        {storeOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            className={`relative z-10 flex-1 px-3 py-1.5 rounded-md text-gray-400 transition-all ease-in-out hover:text-gray-700 ${
              value === option.value ? 'bg-gray-200 text-gray-700' : ''
            }`}
          >
            {option.value}
          </button>
        ))}
      </div>
    )
  }

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

  const editControlsVariants = {
    hidden: { 
      opacity: 0,
      scale: 0.8,
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 30
      }
    },
    visible: { 
      opacity: 1,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 30
      }
    }
  }

  const handleMainAreaTap = (item: GroceryItem) => {
    toggleCheck(item.id)
  }

  return (
    <div className={`bg-gradient-to-b ${gradientFrom} ${gradientTo} h-full flex flex-col`}>
      {/* List Items */}
      <div className="flex-1 overflow-y-auto px-4 pb-24">
        <div className="max-w-lg mx-auto space-y-2 pt-4">
          <h1 className={`opacity-40 text-center ${titleColor} uppercase font-bold`}>{title}</h1>
          <AnimatePresence mode="popLayout">
            {Object.entries(groupedItems).map(([store, storeItems]) => (
              <div key={store} className="space-y-2">
                {storeItems.map(item => (
                  <motion.div
                    key={item.id}
                    variants={itemVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    whileTap="tap"
                    layout
                    className="flex items-center gap-2 p-3 bg-white rounded-lg shadow-xl border hover:bg-gray-50 cursor-pointer"
                    style={{ touchAction: 'manipulation' }}
                  >
                    <motion.div 
                      className="flex-1 flex items-center gap-2"
                      onClick={() => handleMainAreaTap(item)}
                      style={{ touchAction: 'manipulation' }}
                    >
                      <motion.div 
                        className="p-1 rounded-full"
                        layout
                      >
                        <ShoppingBasket className={`w-5 h-5 transition-all ${item.checked ? iconColor : 'text-gray-400'}`} />
                      </motion.div>

                      {editingItem?.id === item.id ? (
                        <div className="flex-1 flex flex-col gap-2">
                          <input
                            type="text"
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            onBlur={handleEditBlur}
                            onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
                            className={`px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-${accentColor}`}
                            autoFocus
                            onClick={(e) => e.stopPropagation()}
                          />
                          <div className="flex gap-2 store-selector" onClick={(e) => e.stopPropagation()}>
                            <AnimatedStoreSelector
                              value={editStore}
                              onChange={(newStore) => {
                                setEditStore(newStore)
                              }}
                              storeOptions={storeOptions}
                            />
                          </div>
                        </div>
                      ) : (
                        <motion.div 
                          layout
                          className="flex-1 flex items-center gap-2"
                        >
                          <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${item.store === 'Publix' ? 'bg-green-200 text-green-800' :
                              item.store === 'Costco' ? 'bg-blue-200 text-blue-800' :
                                'bg-violet-200 text-violet-800'
                            }`}>
                            {item.store}
                          </span>
                          <span className={`${textColor} ${item.checked ? 'line-through text-gray-500' : ''}`}>
                            {item.name}
                          </span>
                        </motion.div>
                      )}
                    </motion.div>

                    {/* Action Area - Edit Controls */}
                    <div 
                      className="w-[100px] flex justify-end"
                      style={{ touchAction: 'manipulation' }}
                    >
                      <AnimatePresence>
                        {(showEditControls === item.id || editingItem?.id === item.id) && (
                          <motion.div 
                            variants={editControlsVariants}
                            initial="hidden"
                            animate="visible"
                            exit="hidden"
                            className="flex gap-1"
                            layout
                          >
                            <motion.button
                              whileTap={{ scale: 0.9 }}
                              onClick={(e) => {
                                e.stopPropagation()
                                startEdit(e, item)
                              }}
                              className={`p-1 text-gray-600 hover:${accentColor} rounded-full hover:bg-gray-100`}
                              style={{ touchAction: 'manipulation' }}
                            >
                              <Edit2 className="w-4 h-4" />
                            </motion.button>
                            <motion.button
                              whileTap={{ scale: 0.9 }}
                              onClick={(e) => {
                                e.stopPropagation()
                                deleteItem(e, item.id)
                              }}
                              className="p-1 text-gray-600 hover:text-red-500 rounded-full hover:bg-gray-100"
                              style={{ touchAction: 'manipulation' }}
                            >
                              <Trash2 className="w-4 h-4" />
                            </motion.button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                      {!editingItem && (
                        <motion.button
                          whileTap={{ scale: 0.9 }}
                          onClick={(e) => {
                            e.stopPropagation()
                            setShowEditControls(showEditControls === item.id ? null : item.id)
                          }}
                          className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
                          style={{ touchAction: 'manipulation' }}
                        >
                          <MoreVertical className="w-4 h-4" />
                        </motion.button>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Floating Add Button */}
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
          <div className='justify-self-start'>
            <motion.button
              onClick={archiveChecked}
              animate={{
                scale: hasCheckedItems ? [0.75, 1.2, 1] : 0.75
              }}
              transition={{
                duration: 0.3,
                times: [0, 0.6, 1],
                ease: "easeOut"
              }}
              className={`bg-gradient-to-b ease-out h-10 rounded-full flex items-center justify-center gap-2 relative rounded-full shadow-2xl shadow-inner shadow-black/10 transition-all w-10 ${
                hasCheckedItems
                  ? `${buttonGradientFrom} ${buttonGradientTo} opacity-80 focus:ring-2 focus:ring-${buttonAccentColor} cursor-pointer`
                  : 'from-gray-100 to-gray-300 opacity-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              <BadgeDollarSign className="ease-out h-6 text-white transition-all w-6" />
            </motion.button>
          </div>
        </div>
      </div>

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
                  <input
                    type="text"
                    value={newItem}
                    onChange={(e) => setNewItem(e.target.value)}
                    placeholder="Add a new item..."
                    className={`flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-${accentColor}`}
                    autoFocus
                  />
                  <button
                    type="submit"
                    className={`bg-gradient-to-b ${buttonGradientFrom} ${buttonGradientTo} px-4 py-2 text-white rounded-lg active:${buttonGradientTo} active:${buttonGradientFrom} focus:outline-none focus:ring-2 focus:ring-${buttonAccentColor}`}
                  >
                    Add
                  </button>
                </div>
                <div className="flex gap-2 justify-between">
                  <AnimatedStoreSelector
                    className="grow"
                    value={selectedStore}
                    onChange={setSelectedStore}
                    storeOptions={storeOptions}
                  />
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-5 py-2 text-gray-600 shrink-0 hover:text-gray-800 focus:outline-none"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
} 