import { create } from 'zustand'
import { db } from '../db/db'

export const useClientStore = create((set, get) => ({
  clients: [],
  loading: false,

  load: async () => {
    set({ loading: true })
    try {
      const clients = await db.clients.orderBy('name').toArray()
      set({ clients })
    } finally {
      set({ loading: false })
    }
  },

  add: async (client) => {
    const id = await db.clients.add({ ...client, createdAt: new Date().toISOString() })
    const newClient = await db.clients.get(id)
    set((s) => ({ clients: [...s.clients, newClient].sort((a, b) => a.name.localeCompare(b.name)) }))
    return id
  },

  update: async (id, changes) => {
    await db.clients.update(id, changes)
    set((s) => ({ clients: s.clients.map((c) => (c.id === id ? { ...c, ...changes } : c)) }))
  },

  remove: async (id) => {
    await db.clients.delete(id)
    set((s) => ({ clients: s.clients.filter((c) => c.id !== id) }))
  },

  getById: (id) => get().clients.find((c) => c.id === id),
}))
