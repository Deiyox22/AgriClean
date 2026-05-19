import { create } from 'zustand'
import { supabase, toDb, fromDb } from '../lib/supabase'

export const useVehicleStore = create((set, get) => ({
  vehicles: [],
  equipment: [],
  loading: false,

  load: async () => {
    set({ loading: true })
    try {
      const [{ data: vehicles, error: e1 }, { data: equipment, error: e2 }] = await Promise.all([
        supabase.from('vehicles').select('*'),
        supabase.from('equipment').select('*'),
      ])
      if (e1) throw e1
      if (e2) throw e2
      set({ vehicles: (vehicles || []).map(fromDb), equipment: (equipment || []).map(fromDb) })
    } finally {
      set({ loading: false })
    }
  },

  addVehicle: async (vehicle) => {
    const { data, error } = await supabase.from('vehicles').insert(toDb(vehicle)).select().single()
    if (error) throw error
    const item = fromDb(data)
    set((s) => ({ vehicles: [...s.vehicles, item] }))
    return item.id
  },

  updateVehicle: async (id, changes) => {
    const { error } = await supabase.from('vehicles').update(toDb(changes)).eq('id', id)
    if (error) throw error
    set((s) => ({ vehicles: s.vehicles.map((v) => (v.id === id ? { ...v, ...changes } : v)) }))
  },

  removeVehicle: async (id) => {
    const { error } = await supabase.from('vehicles').delete().eq('id', id)
    if (error) throw error
    set((s) => ({ vehicles: s.vehicles.filter((v) => v.id !== id) }))
  },

  addEquipment: async (item) => {
    const { data, error } = await supabase.from('equipment').insert(toDb(item)).select().single()
    if (error) throw error
    const newItem = fromDb(data)
    set((s) => ({ equipment: [...s.equipment, newItem] }))
    return newItem.id
  },

  updateEquipment: async (id, changes) => {
    const { error } = await supabase.from('equipment').update(toDb(changes)).eq('id', id)
    if (error) throw error
    set((s) => ({ equipment: s.equipment.map((e) => (e.id === id ? { ...e, ...changes } : e)) }))
  },

  removeEquipment: async (id) => {
    const { error } = await supabase.from('equipment').delete().eq('id', id)
    if (error) throw error
    set((s) => ({ equipment: s.equipment.filter((e) => e.id !== id) }))
  },

  getVehicleById: (id) => get().vehicles.find((v) => v.id === id),
}))
