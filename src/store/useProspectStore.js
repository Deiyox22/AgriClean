import { create } from 'zustand'
import { supabase, toDb, fromDb } from '../lib/supabase'

export const useProspectStore = create((set, get) => ({
  prospects: [],
  loading: false,

  load: async () => {
    set({ loading: true })
    try {
      const { data, error } = await supabase
        .from('prospects')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      set({ prospects: (data || []).map(fromDb) })
    } finally {
      set({ loading: false })
    }
  },

  add: async (prospect) => {
    const { data, error } = await supabase
      .from('prospects')
      .insert(toDb({ ...prospect, createdAt: new Date().toISOString() }))
      .select()
      .single()
    if (error) throw error
    const newProspect = fromDb(data)
    set((s) => ({ prospects: [newProspect, ...s.prospects] }))
    return newProspect.id
  },

  update: async (id, changes) => {
    const { error } = await supabase.from('prospects').update(toDb(changes)).eq('id', id)
    if (error) throw error
    set((s) => ({ prospects: s.prospects.map((p) => (p.id === id ? { ...p, ...changes } : p)) }))
  },

  remove: async (id) => {
    const { error } = await supabase.from('prospects').delete().eq('id', id)
    if (error) throw error
    set((s) => ({ prospects: s.prospects.filter((p) => p.id !== id) }))
  },

  getById: (id) => get().prospects.find((p) => p.id === id),
}))
