import { create } from 'zustand'
import { db } from '../db/db'

export const useEmployeeStore = create((set, get) => ({
  employees: [],
  loading: false,

  load: async () => {
    set({ loading: true })
    try {
      const employees = await db.employees.toArray()
      set({ employees })
    } finally {
      set({ loading: false })
    }
  },

  add: async (employee) => {
    const id = await db.employees.add(employee)
    const newEmployee = await db.employees.get(id)
    set((s) => ({ employees: [...s.employees, newEmployee] }))
    return id
  },

  update: async (id, changes) => {
    await db.employees.update(id, changes)
    set((s) => ({ employees: s.employees.map((e) => (e.id === id ? { ...e, ...changes } : e)) }))
  },

  remove: async (id) => {
    await db.employees.delete(id)
    set((s) => ({ employees: s.employees.filter((e) => e.id !== id) }))
  },

  getById: (id) => get().employees.find((e) => e.id === id),
}))
