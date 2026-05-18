import { create } from 'zustand'
import { db } from '../db/db'

const defaults = {
  company: { name: 'AgriClean SARL', siret: '', address: '', phone: '', email: '', rib: '' },
  defaultRates: { ramassage: 68, nettoyage_agricole: 78, nettoyage_industriel: 98, prixM2Agricole: 4.5, prixM2Industriel: 7, tvaDefault: 20 },
  legalMentions: 'Paiement à 30 jours.',
  invoicePrefix: 'FAC',
  theme: 'light',
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
      const all = await db.settings.toArray()
      if (all.length > 0) set({ settings: { ...defaults, ...all[0] } })
    } finally {
      set({ loading: false })
    }
  },

  save: async (changes) => {
    const current = get().settings
    const updated = { ...current, ...changes }
    const all = await db.settings.toArray()
    if (all.length > 0) {
      await db.settings.update(all[0].id, updated)
    } else {
      await db.settings.add(updated)
    }
    set({ settings: updated })
  },
}))
