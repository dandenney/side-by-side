'use client'

import { useState, useMemo } from 'react'
import { GroceryItem } from '@/types/grocery'
import { Plus, Trash2, Edit2, X, BadgeDollarSign, ShoppingBasket } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

type ShoppingListProps = {
  title: string
  gradientFrom: string
  gradientTo: string
  textColor: string
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
  accentColor,
  iconColor,
  buttonGradientFrom,
  buttonGradientTo,
  buttonAccentColor,
}: ShoppingListProps) {
  const [items, setItems] = useState<GroceryItem[]>([])
  const [newItem, setNewItem] = useState('')
  const [editingItem, setEditingItem] = useState<GroceryItem | null>(null)
  const [editText, setEditText] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)

  const hasCheckedItems = useMemo(() => items.some(item => item.checked), [items])

  const addItem = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newItem.trim()) return

    const item: GroceryItem = {
      id: crypto.randomUUID(),
      name: newItem.trim(),
      checked: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    setItems([...items, item])
    setNewItem('')
    setIsModalOpen(false)
  }

  const toggleCheck = (id: string) => {
    setItems(items.map(item =>
      item.id === id
        ? { ...item, checked: !item.checked, updatedAt: new Date() }
        : item
    ))
  }

  const startEdit = (e: React.MouseEvent, item: GroceryItem) => {
    e.stopPropagation()
    setEditingItem(item)
    setEditText(item.name)
  }

  const saveEdit = () => {
    if (!editingItem || !editText.trim()) return

    setItems(items.map(item =>
      item.id === editingItem.id
        ? { ...item, name: editText.trim(), updatedAt: new Date() }
        : item
    ))
    setEditingItem(null)
    setEditText('')
  }

  const deleteItem = (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    setItems(items.filter(item => item.id !== id))
  }

  const archiveChecked = () => {
    if (!hasCheckedItems) return
    const checkedItems = items.filter(item => item.checked)
    setItems(items.filter(item => !item.checked))
    // In a real app, we would save these to an archived list
    console.log('Archived items:', checkedItems)
  }

  return (
    <div className={`bg-gradient-to-b ${gradientFrom} ${gradientTo} h-full flex flex-col`}>
      {/* List Items */}
      <div className="flex-1 overflow-y-auto px-4 pb-24">
        <div className="space-y-2 pt-4">
          <h1 className={`opacity-40 text-center ${textColor} uppercase font-bold`}>{title}</h1>
          <AnimatePresence mode="popLayout">
            {items.map(item => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, x: -100, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                layout
                onClick={(e) => {
                  const target = e.currentTarget
                  const rect = target.getBoundingClientRect()
                  const isRightSide = e.clientX > rect.right - 100 // 100px from right edge
                  
                  if (!isRightSide) {
                    toggleCheck(item.id)
                  }
                }}
                onContextMenu={(e) => {
                  e.preventDefault()
                  const target = e.currentTarget
                  const rect = target.getBoundingClientRect()
                  const isRightSide = e.clientX > rect.right - 100 // 100px from right edge
                  
                  if (!isRightSide) {
                    startEdit(e, item)
                  }
                }}
                className="flex items-center gap-2 p-3 bg-white rounded-lg shadow-xl border hover:bg-gray-50 cursor-pointer group"
              >
                <motion.div 
                  className={`p-1 rounded-full`}
                  layout
                >
                  <ShoppingBasket className={`w-5 h-5 transition-all ${item.checked ? iconColor : 'text-gray-400'}`} />
                </motion.div>

                {editingItem?.id === item.id ? (
                  <input
                    type="text"
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    onBlur={saveEdit}
                    onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
                    className={`flex-1 px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-${accentColor}`}
                    autoFocus
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <motion.span 
                    layout
                      className={`flex-1 ${textColor} ${item.checked ? 'line-through text-gray-500' : ''}`}
                  >
                    {item.name}
                  </motion.span>
                )}

                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => startEdit(e, item)}
                    className={`p-1 text-gray-600 hover:${accentColor} rounded-full hover:bg-gray-100`}
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => deleteItem(e, item.id)}
                    className="p-1 text-gray-600 hover:text-red-500 rounded-full hover:bg-gray-100"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Floating Add Button */}
      <div className="bg-white fixed bottom-0 left-0 py-1 right-0 rounded-t-full shadow-[0_-4px_20px_rgba(0,0,0,0.15)]">
        <div className="grid grid-cols-3 gap-8 px-4 items-center justify-items-center">
          <div></div>
          <div>
            <motion.button
              onClick={() => setIsModalOpen(true)}
              whileTap={{ y: 4 }}
              className={`w-20 h-20 bg-gradient-to-b ${buttonGradientFrom} ${buttonGradientTo} border-8 border-white -mt-12 text-white rounded-full shadow-[0_-4px_20px_rgba(0,0,0,0.15)] active:${buttonGradientTo} active:${buttonGradientFrom} focus:outline-none focus:ring-2 focus:ring-${buttonAccentColor} flex items-center justify-center`}
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
              <form onSubmit={addItem} className="flex gap-2">
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