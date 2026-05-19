import { create } from 'zustand'

let nextId = 1

export const useToastStore = create((set) => ({
  toasts: [],

  toast: (message, type = 'success', duration = 4000) => {
    const id = nextId++
    set((s) => ({ toasts: [...s.toasts, { id, message, type }] }))
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }))
    }, duration)
  },

  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}))

// Convenience helpers — call anywhere without hooks
export const toast = {
  success: (msg) => useToastStore.getState().toast(msg, 'success'),
  error:   (msg) => useToastStore.getState().toast(msg, 'error'),
  warning: (msg) => useToastStore.getState().toast(msg, 'warning'),
  info:    (msg) => useToastStore.getState().toast(msg, 'info'),
}
