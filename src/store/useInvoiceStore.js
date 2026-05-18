import { create } from 'zustand'
import { differenceInDays } from 'date-fns'
import { db } from '../db/db'

export const useInvoiceStore = create((set, get) => ({
  invoices: [],
  loading: false,
  escalatedCount: 0,

  load: async () => {
    set({ loading: true })
    try {
      const invoices = await db.invoices.orderBy('createdAt').reverse().toArray()
      set({ invoices })
    } finally {
      set({ loading: false })
    }
  },

  add: async (invoice) => {
    const count = await db.invoices.count()
    const year = new Date().getFullYear()
    const number = `FAC-${year}-${String(count + 1).padStart(3, '0')}`
    const id = await db.invoices.add({ ...invoice, number, createdAt: new Date().toISOString() })
    const newInvoice = await db.invoices.get(id)
    set((s) => ({ invoices: [newInvoice, ...s.invoices] }))
    return id
  },

  update: async (id, changes) => {
    await db.invoices.update(id, changes)
    set((s) => ({ invoices: s.invoices.map((i) => (i.id === id ? { ...i, ...changes } : i)) }))
  },

  remove: async (id) => {
    await db.invoices.delete(id)
    set((s) => ({ invoices: s.invoices.filter((i) => i.id !== id) }))
  },

  getById: (id) => get().invoices.find((i) => i.id === id),
  getByClient: (clientId) => get().invoices.filter((i) => i.clientId === clientId),

  // Escalade automatique des factures en retard
  escalateOverdue: async () => {
    const now = new Date()
    const invoices = await db.invoices.toArray()
    const skipStatuses = new Set(['payee', 'litige', 'relance2', 'annule'])
    let count = 0

    for (const inv of invoices) {
      if (!inv.dueDate || skipStatuses.has(inv.status)) continue
      const daysLate = differenceInDays(now, new Date(inv.dueDate))
      if (daysLate <= 0) continue

      let newStatus = null
      if (daysLate > 30 && inv.status !== 'relance2') newStatus = 'relance2'
      else if (daysLate > 0 && inv.status === 'emise')  newStatus = 'relance1'
      else if (daysLate > 15 && inv.status === 'relance1') newStatus = 'relance2'

      if (newStatus) {
        await db.invoices.update(inv.id, { status: newStatus })
        count++
      }
    }

    if (count > 0) {
      const updated = await db.invoices.orderBy('createdAt').reverse().toArray()
      set({ invoices: updated, escalatedCount: count })
    }

    return count
  },
}))
