import { create } from 'zustand'
import { supabase, toDb, fromDb } from '../lib/supabase'

export const useTeamStore = create((set, get) => ({
  teams: [],
  loading: false,

  load: async () => {
    set({ loading: true })
    try {
      const { data, error } = await supabase.from('teams').select('*').order('name')
      if (error) throw error
      set({ teams: (data || []).map(fromDb) })
    } finally {
      set({ loading: false })
    }
  },

  add: async (team) => {
    const { data, error } = await supabase
      .from('teams')
      .insert(toDb({ ...team, createdAt: new Date().toISOString() }))
      .select()
      .single()
    if (error) throw error
    const newTeam = fromDb(data)
    set((s) => ({ teams: [...s.teams, newTeam].sort((a, b) => a.name.localeCompare(b.name)) }))
    return newTeam.id
  },

  update: async (id, changes) => {
    const { error } = await supabase.from('teams').update(toDb(changes)).eq('id', id)
    if (error) throw error
    set((s) => ({ teams: s.teams.map((t) => (t.id === id ? { ...t, ...changes } : t)) }))
  },

  remove: async (id) => {
    const { error } = await supabase.from('teams').delete().eq('id', id)
    if (error) throw error
    set((s) => ({ teams: s.teams.filter((t) => t.id !== id) }))
  },

  getById: (id) => get().teams.find((t) => t.id === id),
}))

// Couleurs disponibles pour les équipes
export const TEAM_COLORS = [
  { value: 'green',  label: 'Vert',   cls: 'bg-green-500'  },
  { value: 'blue',   label: 'Bleu',   cls: 'bg-blue-500'   },
  { value: 'amber',  label: 'Ambre',  cls: 'bg-amber-500'  },
  { value: 'purple', label: 'Violet', cls: 'bg-purple-500' },
  { value: 'teal',   label: 'Cyan',   cls: 'bg-teal-500'   },
  { value: 'pink',   label: 'Rose',   cls: 'bg-pink-500'   },
  { value: 'red',    label: 'Rouge',  cls: 'bg-red-500'    },
  { value: 'indigo', label: 'Indigo', cls: 'bg-indigo-500' },
]

export const teamColorCls = (color) =>
  TEAM_COLORS.find((c) => c.value === color)?.cls ?? 'bg-slate-400'
