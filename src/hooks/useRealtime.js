import { useEffect } from 'react'
import { supabase, fromDb } from '../lib/supabase'
import { useClientStore } from '../store/useClientStore'
import { useTeamStore } from '../store/useTeamStore'
import { useEmployeeStore } from '../store/useEmployeeStore'
import { useMissionStore } from '../store/useMissionStore'
import { useInvoiceStore } from '../store/useInvoiceStore'
import { useQuoteStore } from '../store/useQuoteStore'
import { useVehicleStore } from '../store/useVehicleStore'
import { useSettingsStore } from '../store/useSettingsStore'
import { useApplicationStore } from '../store/useApplicationStore'

// Gère INSERT / UPDATE / DELETE sur un store Zustand dont les données sont une liste
function syncList(store, key, payload, sortFn) {
  const list = store.getState()[key] ?? []
  if (payload.eventType === 'INSERT') {
    const item = fromDb(payload.new)
    let next = [...list, item]
    if (sortFn) next = next.sort(sortFn)
    store.setState({ [key]: next })
  } else if (payload.eventType === 'UPDATE') {
    const item = fromDb(payload.new)
    store.setState({ [key]: list.map((x) => (x.id === item.id ? item : x)) })
  } else if (payload.eventType === 'DELETE') {
    store.setState({ [key]: list.filter((x) => x.id !== payload.old.id) })
  }
}

export function useRealtime() {
  useEffect(() => {
    const channel = supabase.channel('realtime-sync')

    channel
      .on('postgres_changes', { event: '*', schema: 'public', table: 'clients' }, (p) =>
        syncList(useClientStore, 'clients', p, (a, b) => a.name.localeCompare(b.name)))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'employees' }, (p) =>
        syncList(useEmployeeStore, 'employees', p))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'missions' }, (p) =>
        syncList(useMissionStore, 'missions', p))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'invoices' }, (p) =>
        syncList(useInvoiceStore, 'invoices', p))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'quotes' }, (p) =>
        syncList(useQuoteStore, 'quotes', p))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'vehicles' }, (p) =>
        syncList(useVehicleStore, 'vehicles', p))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'equipment' }, (p) =>
        syncList(useVehicleStore, 'equipment', p))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'applications' }, (p) =>
        syncList(useApplicationStore, 'applications', p))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'teams' }, (p) =>
        syncList(useTeamStore, 'teams', p, (a, b) => a.name.localeCompare(b.name)))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'settings' }, (p) => {
        if (p.eventType === 'UPDATE' || p.eventType === 'INSERT') {
          const { defaults } = useSettingsStore.getState()
          useSettingsStore.setState({ settings: { ...(defaults ?? {}), ...fromDb(p.new) } })
        }
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])
}
