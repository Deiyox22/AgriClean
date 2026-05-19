import { create } from 'zustand'
import { addDays, addWeeks } from 'date-fns'
import { supabase, toDb, fromDb } from '../lib/supabase'

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
      const { data, error } = await supabase.from('missions').select('*').order('date', { ascending: false })
      if (error) throw error
      set({ missions: (data || []).map(fromDb) })
    } finally {
      set({ loading: false })
    }
  },

  add: async (mission) => {
    const { data, error } = await supabase
      .from('missions')
      .insert(toDb({ ...mission, createdAt: new Date().toISOString() }))
      .select()
      .single()
    if (error) throw error
    const newMission = fromDb(data)
    set((s) => ({ missions: [newMission, ...s.missions] }))
    return newMission.id
  },

  update: async (id, changes) => {
    const { error } = await supabase.from('missions').update(toDb(changes)).eq('id', id)
    if (error) throw error
    set((s) => ({ missions: s.missions.map((m) => (m.id === id ? { ...m, ...changes } : m)) }))
  },

  remove: async (id) => {
    const { error } = await supabase.from('missions').delete().eq('id', id)
    if (error) throw error
    set((s) => ({ missions: s.missions.filter((m) => m.id !== id) }))
  },

  getById: (id) => get().missions.find((m) => m.id === id),
  getByClient: (clientId) => get().missions.filter((m) => m.clientId === clientId),

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
