import { create } from 'zustand'

let nextId = 1

export const useToastStore = create((set) => ({
  toasts: [],

  // action: { label, onClick } — optionnel
  toast: (message, type = 'success', duration = 5000, action = null) => {
    const id = nextId++
    set((s) => ({ toasts: [...s.toasts, { id, message, type, action }] }))
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }))
    }, duration)
  },

  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}))

// Convenience helpers — call anywhere without hooks
export const toast = {
  success: (msg, action) => useToastStore.getState().toast(msg, 'success', 5000, action),
  error:   (msg, action) => useToastStore.getState().toast(msg, 'error',   5000, action),
  warning: (msg, action) => useToastStore.getState().toast(msg, 'warning', 5000, action),
  info:    (msg, action) => useToastStore.getState().toast(msg, 'info',    5000, action),
}
