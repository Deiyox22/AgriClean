import { create } from 'zustand'
import { supabase, toDb, fromDb } from '../lib/supabase'

const defaults = {
  company: { name: 'AgriClean SARL', siret: '', address: '', phone: '', email: '', rib: '' },
  defaultRates: { ramassage: 68, nettoyage_agricole: 78, nettoyage_industriel: 98, prixM2Agricole: 4.5, prixM2Industriel: 7, tvaDefault: 20 },
  legalMentions: 'Paiement à 30 jours.',
  invoicePrefix: 'FAC',
  theme: 'light',
  adminEmail: 'admin@agriclean.fr',
  adminPassword: 'agriclean2025',
  travelSettings: {
    mode: 'km',
    ratePerKm: 0.68,
    freeKm: 0,
    ratePerHour: 45,
    flatFee: 35,
    billableByDefault: true,
  },
}

export const useSettingsStore = create((set, get) => ({
  settings: defaults,
  loading: false,

  load: async () => {
    set({ loading: true })
    try {
      const { data } = await supabase.from('settings').select('*').limit(1).maybeSingle()
      if (data) set({ settings: { ...defaults, ...fromDb(data) } })
    } finally {
      set({ loading: false })
    }
  },

  save: async (changes) => {
    const current = get().settings
    const updated = { ...current, ...changes }
    const dbData = toDb(updated)
    if (current.id) {
      await supabase.from('settings').update(dbData).eq('id', current.id)
    } else {
      const { data } = await supabase.from('settings').insert(dbData).select().single()
      if (data) updated.id = data.id
    }
    set({ settings: updated })
  },
}))
