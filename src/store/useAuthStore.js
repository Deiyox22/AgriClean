import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { db } from '../db/db'

export const useAuthStore = create(
  persist(
    (set) => ({
      managerLoggedIn: false,
      clientSession:   null, // { clientId, name }
      employeeSession: null, // { employeeId, firstName, lastName }

      // ── Manager ────────────────────────────────────────────────────────────
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

      // ── Employé ────────────────────────────────────────────────────────────
      loginEmployee: async (employeeId, pin) => {
        const emp = await db.employees.get(Number(employeeId))
        if (!emp) return { ok: false, error: 'Employé introuvable.' }
        if (!emp.pin) return { ok: false, error: 'Aucun code PIN défini. Demandez à votre manager de le configurer.' }
        if (String(emp.pin) !== String(pin)) return { ok: false, error: 'Code PIN incorrect.' }
        set({ employeeSession: { employeeId: emp.id, firstName: emp.firstName, lastName: emp.lastName } })
        return { ok: true }
      },
      logoutEmployee: () => set({ employeeSession: null }),

      // ── Client ─────────────────────────────────────────────────────────────
      loginClient: async (email, companyName) => {
        const clients = await db.clients.toArray()
        const match = clients.find((c) => {
          const nameMatch  = c.name.toLowerCase().includes(companyName.toLowerCase()) ||
                             companyName.toLowerCase().includes(c.name.toLowerCase())
          const emailMatch = c.contacts?.some((ct) => ct.email?.toLowerCase() === email.toLowerCase())
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
        clientSession:   s.clientSession,
        employeeSession: s.employeeSession,
      }),
    }
  )
)
