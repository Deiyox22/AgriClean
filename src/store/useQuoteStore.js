import { create } from 'zustand'
import { db } from '../db/db'

export const useQuoteStore = create((set, get) => ({
  quotes: [],
  loading: false,

  load: async () => {
    set({ loading: true })
    try {
      const quotes = await db.quotes.orderBy('createdAt').reverse().toArray()
      set({ quotes })
    } finally {
      set({ loading: false })
    }
  },

  add: async (quote) => {
    const count = await db.quotes.count()
    const year = new Date().getFullYear()
    const number = `DEV-${year}-${String(count + 1).padStart(3, '0')}`
    const id = await db.quotes.add({ ...quote, number, createdAt: new Date().toISOString() })
    const newQuote = await db.quotes.get(id)
    set((s) => ({ quotes: [newQuote, ...s.quotes] }))
    return id
  },

  update: async (id, changes) => {
    await db.quotes.update(id, changes)
    set((s) => ({ quotes: s.quotes.map((q) => (q.id === id ? { ...q, ...changes } : q)) }))
  },

  remove: async (id) => {
    await db.quotes.delete(id)
    set((s) => ({ quotes: s.quotes.filter((q) => q.id !== id) }))
  },

  getById: (id) => get().quotes.find((q) => q.id === id),

  getByClient: (clientId) => get().quotes.filter((q) => q.clientId === clientId),
}))
