import { create } from 'zustand'
import { supabase, toDb, fromDb } from '../lib/supabase'

export const useClientStore = create((set, get) => ({
  clients: [],
  loading: false,

  load: async () => {
    set({ loading: true })
    try {
      const { data, error } = await supabase.from('clients').select('*').order('name')
      if (error) throw error
      set({ clients: (data || []).map(fromDb) })
    } finally {
      set({ loading: false })
    }
  },

  add: async (client) => {
    const { data, error } = await supabase
      .from('clients')
      .insert(toDb({ ...client, createdAt: new Date().toISOString() }))
      .select()
      .single()
    if (error) throw error
    const newClient = fromDb(data)
    set((s) => ({ clients: [...s.clients, newClient].sort((a, b) => a.name.localeCompare(b.name)) }))
    return newClient.id
  },

  update: async (id, changes) => {
    const { error } = await supabase.from('clients').update(toDb(changes)).eq('id', id)
    if (error) throw error
    set((s) => ({ clients: s.clients.map((c) => (c.id === id ? { ...c, ...changes } : c)) }))
  },

  remove: async (id) => {
    const { error } = await supabase.from('clients').delete().eq('id', id)
    if (error) throw error
    set((s) => ({ clients: s.clients.filter((c) => c.id !== id) }))
  },

  getById: (id) => get().clients.find((c) => c.id === id),
}))
