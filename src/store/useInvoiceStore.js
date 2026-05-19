import { create } from 'zustand'
import { differenceInDays } from 'date-fns'
import { supabase, toDb, fromDb } from '../lib/supabase'

export const useInvoiceStore = create((set, get) => ({
  invoices: [],
  loading: false,
  escalatedCount: 0,

  load: async () => {
    set({ loading: true })
    try {
      const { data, error } = await supabase.from('invoices').select('*').order('created_at', { ascending: false })
      if (error) throw error
      set({ invoices: (data || []).map(fromDb) })
    } finally {
      set({ loading: false })
    }
  },

  add: async (invoice) => {
    const { count } = await supabase.from('invoices').select('id', { count: 'exact', head: true })
    const year = new Date().getFullYear()
    const number = `FAC-${year}-${String((count || 0) + 1).padStart(3, '0')}`
    const { data, error } = await supabase
      .from('invoices')
      .insert(toDb({ ...invoice, number, createdAt: new Date().toISOString() }))
      .select()
      .single()
    if (error) throw error
    const newInvoice = fromDb(data)
    set((s) => ({ invoices: [newInvoice, ...s.invoices] }))
    return newInvoice.id
  },

  update: async (id, changes) => {
    const { error } = await supabase.from('invoices').update(toDb(changes)).eq('id', id)
    if (error) throw error
    set((s) => ({ invoices: s.invoices.map((i) => (i.id === id ? { ...i, ...changes } : i)) }))
  },

  remove: async (id) => {
    const { error } = await supabase.from('invoices').delete().eq('id', id)
    if (error) throw error
    set((s) => ({ invoices: s.invoices.filter((i) => i.id !== id) }))
  },

  getById: (id) => get().invoices.find((i) => i.id === id),
  getByClient: (clientId) => get().invoices.filter((i) => i.clientId === clientId),

  escalateOverdue: async () => {
    const now = new Date()
    const invoices = get().invoices
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
        await supabase.from('invoices').update({ status: newStatus }).eq('id', inv.id)
        count++
      }
    }

    if (count > 0) {
      await get().load()
      set({ escalatedCount: count })
    }

    return count
  },
}))
