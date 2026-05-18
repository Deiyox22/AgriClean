import { create } from 'zustand'
import { db } from '../db/db'

export const useVehicleStore = create((set, get) => ({
  vehicles: [],
  equipment: [],
  loading: false,

  load: async () => {
    set({ loading: true })
    try {
      const [vehicles, equipment] = await Promise.all([
        db.vehicles.toArray(),
        db.equipment.toArray(),
      ])
      set({ vehicles, equipment })
    } finally {
      set({ loading: false })
    }
  },

  addVehicle: async (vehicle) => {
    const id = await db.vehicles.add(vehicle)
    const item = await db.vehicles.get(id)
    set((s) => ({ vehicles: [...s.vehicles, item] }))
    return id
  },

  updateVehicle: async (id, changes) => {
    await db.vehicles.update(id, changes)
    set((s) => ({ vehicles: s.vehicles.map((v) => (v.id === id ? { ...v, ...changes } : v)) }))
  },

  removeVehicle: async (id) => {
    await db.vehicles.delete(id)
    set((s) => ({ vehicles: s.vehicles.filter((v) => v.id !== id) }))
  },

  addEquipment: async (item) => {
    const id = await db.equipment.add(item)
    const newItem = await db.equipment.get(id)
    set((s) => ({ equipment: [...s.equipment, newItem] }))
    return id
  },

  updateEquipment: async (id, changes) => {
    await db.equipment.update(id, changes)
    set((s) => ({ equipment: s.equipment.map((e) => (e.id === id ? { ...e, ...changes } : e)) }))
  },

  removeEquipment: async (id) => {
    await db.equipment.delete(id)
    set((s) => ({ equipment: s.equipment.filter((e) => e.id !== id) }))
  },

  getVehicleById: (id) => get().vehicles.find((v) => v.id === id),
}))
