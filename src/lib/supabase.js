import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

// Convert top-level keys camelCase → snake_case for Supabase inserts/updates
export function toDb(obj) {
  if (!obj) return obj
  const result = {}
  for (const [key, val] of Object.entries(obj)) {
    result[key.replace(/([A-Z])/g, m => '_' + m.toLowerCase())] = val
  }
  return result
}

// Convert top-level keys snake_case → camelCase for the app
export function fromDb(row) {
  if (!row) return null
  const result = {}
  for (const [key, val] of Object.entries(row)) {
    result[key.replace(/_([a-z])/g, (_, c) => c.toUpperCase())] = val
  }
  return result
}
