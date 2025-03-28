'use client'

import { useState, useMemo } from 'react'
import { GroceryItem } from '@/types/grocery'
import { Plus, Check, Trash2, Edit2, Archive, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export function GroceryList() {
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
    <div className="relative h-[100dvh] flex flex-col">
      {/* Checkout Button */}
      <div className="p-4">
        <button
          onClick={archiveChecked}
          className={`w-full px-4 py-3 rounded-lg flex items-center justify-center gap-2 transition-all ${
            hasCheckedItems
              ? 'bg-blue-500 text-white hover:bg-blue-600 focus:ring-2 focus:ring-blue-500 cursor-pointer'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          }`}
        >
          <Archive className="w-5 h-5" />
          Check Out
        </button>
      </div>

      {/* List Items */}
      <div className="flex-1 overflow-y-auto px-4 pb-24">
        <div className="space-y-2">
          <AnimatePresence mode="popLayout">
            {items.map(item => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, x: -100, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                layout
                onClick={() => toggleCheck(item.id)}
                className="flex items-center gap-2 p-3 bg-white rounded-lg border hover:bg-gray-50 cursor-pointer group"
              >
                <motion.div 
                  className={`p-1 rounded-full ${
                    item.checked ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'
                  }`}
                  layout
                >
                  <Check className="w-4 h-4" />
                </motion.div>

                {editingItem?.id === item.id ? (
                  <input
                    type="text"
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    onBlur={saveEdit}
                    onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
                    className="flex-1 px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    autoFocus
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <motion.span 
                    layout
                    className={`flex-1 ${item.checked ? 'line-through text-gray-500' : ''}`}
                  >
                    {item.name}
                  </motion.span>
                )}

                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => startEdit(e, item)}
                    className="p-1 text-gray-600 hover:text-blue-500 rounded-full hover:bg-gray-100"
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
      <div className="fixed bottom-4 left-0 right-0 flex justify-center">
        <button
          onClick={() => setIsModalOpen(true)}
          className="w-14 h-14 bg-blue-500 text-white rounded-full shadow-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center justify-center"
        >
          <Plus className="w-6 h-6" />
        </button>
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
                  className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Add
                </button>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 focus:outline-none"
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