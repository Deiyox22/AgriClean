import { create } from 'zustand'
import { db } from '../db/db'

export const useApplicationStore = create((set) => ({
  applications: [],

  load: async () => {
    const applications = await db.applications.orderBy('createdAt').reverse().toArray()
    set({ applications })
  },

  add: async (application) => {
    const id = await db.applications.add({ ...application, status: 'recu', createdAt: new Date().toISOString() })
    const item = await db.applications.get(id)
    set((s) => ({ applications: [item, ...s.applications] }))
    return id
  },

  updateStatus: async (id, status) => {
    await db.applications.update(id, { status })
    set((s) => ({ applications: s.applications.map((a) => a.id === id ? { ...a, status } : a) }))
  },
}))
