import { create } from 'zustand'
import { supabase, toDb, fromDb } from '../lib/supabase'

export const useApplicationStore = create((set) => ({
  applications: [],

  load: async () => {
    const { data } = await supabase.from('applications').select('*').order('created_at', { ascending: false })
    set({ applications: (data || []).map(fromDb) })
  },

  add: async (application) => {
    const { data, error } = await supabase
      .from('applications')
      .insert(toDb({ ...application, status: 'recu', createdAt: new Date().toISOString() }))
      .select()
      .single()
    if (error) throw error
    const item = fromDb(data)
    set((s) => ({ applications: [item, ...s.applications] }))
    return item.id
  },

  updateStatus: async (id, status) => {
    await supabase.from('applications').update({ status }).eq('id', id)
    set((s) => ({ applications: s.applications.map((a) => a.id === id ? { ...a, status } : a) }))
  },
}))
