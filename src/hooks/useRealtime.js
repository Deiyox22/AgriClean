import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
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
import { useMessagingStore } from '../store/useMessagingStore'
import { useAuthStore } from '../store/useAuthStore'
import { toast } from '../store/useToastStore'

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

// Garantit que la conversation est dans le store (la récupère si besoin).
// Nécessaire car le message INSERT peut arriver avant le conversations INSERT.
async function ensureConversation(convId) {
  const found = useMessagingStore.getState().conversations.find((c) => c.id === convId)
  if (found) return found
  const { data } = await supabase
    .from('conversations')
    .select('*')
    .eq('id', convId)
    .maybeSingle()
  if (data) {
    const conv = fromDb(data)
    useMessagingStore.getState().addRealtimeConversation(conv)
    return conv
  }
  return null
}

export function useRealtime() {
  const navigate = useNavigate()

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

      // ── Messages ────────────────────────────────────────────────────────────
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, async (p) => {
        const msg = fromDb(p.new)

        // S'assurer que la conversation est dans le store AVANT d'appeler
        // addRealtimeMessage (pour que le tri lastMessageAt fonctionne)
        const conv = await ensureConversation(msg.conversationId)

        useMessagingStore.getState().addRealtimeMessage(msg)

        if (!conv) return
        const { managerLoggedIn, employeeSession, clientSession } = useAuthStore.getState()

        // ── Manager ──────────────────────────────────────────────────────────
        if (managerLoggedIn && msg.senderType !== 'manager') {
          const convId = msg.conversationId
          toast.info(
            `Nouveau message de ${msg.senderName}`,
            {
              label: 'Ouvrir',
              onClick: () => {
                useMessagingStore.getState().setPendingConv(convId)
                navigate('/messagerie')
              },
            }
          )
          return
        }

        // ── Employé ──────────────────────────────────────────────────────────
        if (employeeSession && msg.senderType === 'manager') {
          const isDirectConv  = conv.type === 'direct_employee' && conv.employeeId === employeeSession.employeeId
          const isMissionConv = conv.type === 'mission' && (() => {
            const mission = useMissionStore.getState().missions.find((m) => m.id === conv.missionId)
            return mission?.teamIds?.includes(employeeSession.employeeId)
          })()
          if (isDirectConv || isMissionConv) {
            toast.info('Nouveau message du manager')
            useMessagingStore.getState().incrementSessionUnread(conv.id)
          }
        }

        // ── Client ───────────────────────────────────────────────────────────
        if (clientSession && msg.senderType === 'manager') {
          if (conv.type === 'direct_client' && conv.clientId === clientSession.clientId) {
            toast.info('Nouveau message du manager')
            useMessagingStore.getState().incrementSessionUnread(conv.id)
          }
        }
      })

      // ── Nouvelles conversations + mises à jour ───────────────────────────────
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'conversations' }, (p) => {
        useMessagingStore.getState().addRealtimeConversation(fromDb(p.new))
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'conversations' }, (p) => {
        useMessagingStore.getState().updateRealtimeConversation(fromDb(p.new))
      })

      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [navigate])
}
