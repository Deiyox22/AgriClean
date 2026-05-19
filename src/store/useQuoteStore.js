import { create } from 'zustand'
import { supabase, toDb, fromDb } from '../lib/supabase'

export const useQuoteStore = create((set, get) => ({
  quotes: [],
  loading: false,

  load: async () => {
    set({ loading: true })
    try {
      const { data, error } = await supabase.from('quotes').select('*').order('created_at', { ascending: false })
      if (error) throw error
      set({ quotes: (data || []).map(fromDb) })
    } finally {
      set({ loading: false })
    }
  },

  add: async (quote) => {
    const { count } = await supabase.from('quotes').select('id', { count: 'exact', head: true })
    const year = new Date().getFullYear()
    const number = `DEV-${year}-${String((count || 0) + 1).padStart(3, '0')}`
    const { data, error } = await supabase
      .from('quotes')
      .insert(toDb({ ...quote, number, createdAt: new Date().toISOString() }))
      .select()
      .single()
    if (error) throw error
    const newQuote = fromDb(data)
    set((s) => ({ quotes: [newQuote, ...s.quotes] }))
    return newQuote.id
  },

  update: async (id, changes) => {
    const { error } = await supabase.from('quotes').update(toDb(changes)).eq('id', id)
    if (error) throw error
    set((s) => ({ quotes: s.quotes.map((q) => (q.id === id ? { ...q, ...changes } : q)) }))
  },

  remove: async (id) => {
    const { error } = await supabase.from('quotes').delete().eq('id', id)
    if (error) throw error
    set((s) => ({ quotes: s.quotes.filter((q) => q.id !== id) }))
  },

  getById: (id) => get().quotes.find((q) => q.id === id),
  getByClient: (clientId) => get().quotes.filter((q) => q.clientId === clientId),
}))
