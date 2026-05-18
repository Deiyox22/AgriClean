import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { db } from '../db/db'

export const useAuthStore = create(
  persist(
    (set, get) => ({
      managerLoggedIn: false,
      clientSession: null, // { clientId, name }

      loginManager: async (email, password) => {
        const all = await db.settings.toArray()
        const s = all[0]
        if (!s) return { ok: false, error: 'Paramètres introuvables.' }
        if (
          email.toLowerCase() === (s.adminEmail ?? 'admin@agriclean.fr').toLowerCase() &&
          password === (s.adminPassword ?? 'agriclean2025')
        ) {
          set({ managerLoggedIn: true })
          return { ok: true }
        }
        return { ok: false, error: 'Email ou mot de passe incorrect.' }
      },

      logoutManager: () => set({ managerLoggedIn: false }),

      loginClient: async (email, companyName) => {
        const clients = await db.clients.toArray()
        const match = clients.find((c) => {
          const nameMatch = c.name.toLowerCase().includes(companyName.toLowerCase()) ||
            companyName.toLowerCase().includes(c.name.toLowerCase())
          const emailMatch = c.contacts?.some(
            (ct) => ct.email?.toLowerCase() === email.toLowerCase()
          )
          return nameMatch && emailMatch
        })
        if (!match) return { ok: false, error: 'Aucun compte trouvé avec ces informations.' }
        set({ clientSession: { clientId: match.id, name: match.name } })
        return { ok: true }
      },

      logoutClient: () => set({ clientSession: null }),
    }),
    {
      name: 'agriclean-auth',
      partialize: (s) => ({
        managerLoggedIn: s.managerLoggedIn,
        clientSession: s.clientSession,
      }),
    }
  )
)
