import { create } from 'zustand'
import { addDays, addWeeks } from 'date-fns'
import { db } from '../db/db'

function nextOccurrenceDate(date, recurrence) {
  const d = new Date(date)
  switch (recurrence) {
    case 'journaliere':  return addDays(d, 1)
    case 'hebdomadaire': return addWeeks(d, 1)
    case 'bimensuelle':  return addWeeks(d, 2)
    case 'mensuelle':    return new Date(d.getFullYear(), d.getMonth() + 1, d.getDate(), d.getHours(), d.getMinutes())
    default:             return null
  }
}

export const useMissionStore = create((set, get) => ({
  missions: [],
  loading: false,

  load: async () => {
    set({ loading: true })
    try {
      const missions = await db.missions.orderBy('date').reverse().toArray()
      set({ missions })
    } finally {
      set({ loading: false })
    }
  },

  add: async (mission) => {
    const id = await db.missions.add({ ...mission, createdAt: new Date().toISOString() })
    const newMission = await db.missions.get(id)
    set((s) => ({ missions: [newMission, ...s.missions] }))
    return id
  },

  update: async (id, changes) => {
    await db.missions.update(id, changes)
    set((s) => ({ missions: s.missions.map((m) => (m.id === id ? { ...m, ...changes } : m)) }))
  },

  remove: async (id) => {
    await db.missions.delete(id)
    set((s) => ({ missions: s.missions.filter((m) => m.id !== id) }))
  },

  getById: (id) => get().missions.find((m) => m.id === id),
  getByClient: (clientId) => get().missions.filter((m) => m.clientId === clientId),

  // Crée automatiquement la prochaine occurrence d'une mission récurrente
  createNextOccurrence: async (mission) => {
    if (!mission.recurrence || mission.recurrence === 'aucune') return null
    const nextDate = nextOccurrenceDate(mission.date, mission.recurrence)
    if (!nextDate) return null

    const { id: _id, createdAt: _c, report: _r, status: _s, ...base } = mission
    const next = {
      ...base,
      date: nextDate.toISOString(),
      status: 'planifie',
      report: null,
      eggData: mission.eggData
        ? { ...mission.eggData, realQuantity: null }
        : null,
      cleaningData: mission.cleaningData
        ? {
            ...mission.cleaningData,
            checklist: (mission.cleaningData.checklist ?? []).map((i) => ({ ...i, done: false })),
            photos: [],
          }
        : null,
    }
    return await get().add(next)
  },
}))
