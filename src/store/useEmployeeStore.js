import { create } from 'zustand'
import { supabase, toDb, fromDb } from '../lib/supabase'

export const useEmployeeStore = create((set, get) => ({
  employees: [],
  loading: false,

  load: async () => {
    set({ loading: true })
    try {
      const { data, error } = await supabase.from('employees').select('*')
      if (error) throw error
      set({ employees: (data || []).map(fromDb) })
    } finally {
      set({ loading: false })
    }
  },

  add: async (employee) => {
    const { data, error } = await supabase
      .from('employees')
      .insert(toDb(employee))
      .select()
      .single()
    if (error) throw error
    const newEmployee = fromDb(data)
    set((s) => ({ employees: [...s.employees, newEmployee] }))
    return newEmployee.id
  },

  update: async (id, changes) => {
    const { error } = await supabase.from('employees').update(toDb(changes)).eq('id', id)
    if (error) throw error
    set((s) => ({ employees: s.employees.map((e) => (e.id === id ? { ...e, ...changes } : e)) }))
  },

  remove: async (id) => {
    const { error } = await supabase.from('employees').delete().eq('id', id)
    if (error) throw error
    set((s) => ({ employees: s.employees.filter((e) => e.id !== id) }))
  },

  getById: (id) => get().employees.find((e) => e.id === id),
}))
