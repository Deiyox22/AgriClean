import { create } from 'zustand'
import { supabase, fromDb } from '../lib/supabase'

export const useMessagingStore = create((set, get) => ({
  conversations: [],
  messages: {},            // { [convId]: Message[] }
  unreadTotal: 0,
  unreadByConv: {},        // { [convId]: number } — manager, persisté en DB
  sessionUnreadByConv: {}, // { [convId]: number } — employé/client, session uniquement

  async loadConversations() {
    const { data } = await supabase
      .from('conversations')
      .select('*')
      .order('last_message_at', { ascending: false })
    if (data) set({ conversations: data.map(fromDb) })
  },

  async loadMessages(convId) {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', convId)
      .order('created_at', { ascending: true })
    if (data)
      set((s) => ({ messages: { ...s.messages, [convId]: data.map(fromDb) } }))
  },

  // Charge le total ET les non-lus par conversation pour le manager
  async loadUnreadTotal() {
    const { data } = await supabase
      .from('messages')
      .select('conversation_id')
      .eq('read_by_manager', false)
      .neq('sender_type', 'manager')
    if (data) {
      const counts = {}
      data.forEach(({ conversation_id }) => {
        counts[conversation_id] = (counts[conversation_id] ?? 0) + 1
      })
      const total = Object.values(counts).reduce((a, b) => a + b, 0)
      set({ unreadByConv: counts, unreadTotal: total })
    }
  },

  async getOrCreate(type, { employeeId, clientId, missionId, title } = {}) {
    const list = get().conversations
    const found = list.find((c) => {
      if (c.type !== type) return false
      if (type === 'direct_employee') return c.employeeId === employeeId
      if (type === 'direct_client')   return c.clientId   === clientId
      if (type === 'mission')          return c.missionId  === missionId
      return false
    })
    if (found) return found

    const { data } = await supabase
      .from('conversations')
      .insert({
        type,
        title:       title      ?? null,
        employee_id: employeeId ?? null,
        client_id:   clientId   ?? null,
        mission_id:  missionId  ?? null,
      })
      .select()
      .single()

    if (data) {
      const conv = fromDb(data)
      set((s) => ({ conversations: [conv, ...s.conversations] }))
      return conv
    }
    return null
  },

  async sendMessage(convId, content, senderType, senderId, senderName) {
    const { data } = await supabase
      .from('messages')
      .insert({
        conversation_id: convId,
        sender_type:     senderType,
        sender_id:       senderId ?? null,
        sender_name:     senderName,
        content:         content.trim(),
        read_by_manager: senderType === 'manager',
      })
      .select()
      .single()

    if (data) {
      const msg = fromDb(data)
      const now = msg.createdAt ?? new Date().toISOString()
      // Mise à jour locale immédiate — pas besoin d'attendre le realtime
      set((s) => ({
        messages: {
          ...s.messages,
          [convId]: [...(s.messages[convId] ?? []), msg],
        },
        conversations: s.conversations
          .map((c) => c.id === convId ? { ...c, lastMessageAt: now } : c)
          .sort((a, b) => new Date(b.lastMessageAt ?? 0) - new Date(a.lastMessageAt ?? 0)),
      }))
      supabase.from('conversations')
        .update({ last_message_at: now })
        .eq('id', convId)
    }
  },

  async markRead(convId) {
    await supabase
      .from('messages')
      .update({ read_by_manager: true })
      .eq('conversation_id', convId)
      .neq('sender_type', 'manager')
    set((s) => {
      const updated = (s.messages[convId] ?? []).map((m) =>
        m.senderType !== 'manager' ? { ...m, readByManager: true } : m
      )
      const newByConv = { ...s.unreadByConv, [convId]: 0 }
      const total = Object.values(newByConv).reduce((a, b) => a + b, 0)
      return {
        messages:    { ...s.messages, [convId]: updated },
        unreadByConv: newByConv,
        unreadTotal:  total,
      }
    })
  },

  // ── Session unread (employé / client) ───────────────────────────────────────
  incrementSessionUnread(convId) {
    set((s) => {
      // Ne pas incrémenter si la conversation est actuellement visible
      if (s.openConvId === convId) return {}
      const updated = { ...s.sessionUnreadByConv, [convId]: (s.sessionUnreadByConv[convId] ?? 0) + 1 }
      return {
        sessionUnreadByConv: updated,
        notifCount: Object.values(updated).reduce((a, b) => a + b, 0),
      }
    })
  },

  clearSessionUnread(convId) {
    set((s) => {
      const updated = { ...s.sessionUnreadByConv, [convId]: 0 }
      return {
        sessionUnreadByConv: updated,
        notifCount: Object.values(updated).reduce((a, b) => a + b, 0),
      }
    })
  },

  // Initialise les compteurs depuis la DB (chargement initial pour employé/client)
  initSessionUnread(counts) {
    set((s) => {
      const merged = {}
      const allIds = new Set([...Object.keys(counts), ...Object.keys(s.sessionUnreadByConv)])
      for (const id of allIds) {
        // Prend le max entre DB et realtime (pour éviter de perdre des notifs temps réel)
        merged[id] = Math.max(counts[id] ?? 0, s.sessionUnreadByConv[id] ?? 0)
      }
      return {
        sessionUnreadByConv: merged,
        notifCount: Object.values(merged).reduce((a, b) => a + b, 0),
      }
    })
  },

  // Conv actuellement ouverte (pour ne pas incrémenter les non-lus quand la chat est visible)
  openConvId: null,
  setOpenConvId: (id) => set({ openConvId: id }),

  // ── Compat ──────────────────────────────────────────────────────────────────
  pendingConvId: null,
  setPendingConv:   (id) => set({ pendingConvId: id }),
  clearPendingConv: ()   => set({ pendingConvId: null }),

  notifCount: 0,
  clearNotif() { set({ notifCount: 0, sessionUnreadByConv: {} }) },

  // ── Realtime ────────────────────────────────────────────────────────────────
  addRealtimeMessage(msg) {
    set((s) => {
      const convId   = msg.conversationId
      const existing = s.messages[convId]
      if (existing?.some((m) => m.id === msg.id)) return {}

      const isManagerUnread = msg.senderType !== 'manager' && !msg.readByManager
      const newByConv = isManagerUnread
        ? { ...s.unreadByConv, [convId]: (s.unreadByConv[convId] ?? 0) + 1 }
        : s.unreadByConv

      return {
        ...(existing ? { messages: { ...s.messages, [convId]: [...existing, msg] } } : {}),
        conversations: s.conversations
          .map((c) => c.id === convId ? { ...c, lastMessageAt: msg.createdAt } : c)
          .sort((a, b) => new Date(b.lastMessageAt ?? 0) - new Date(a.lastMessageAt ?? 0)),
        unreadByConv: newByConv,
        unreadTotal:  s.unreadTotal + (isManagerUnread ? 1 : 0),
      }
    })
  },

  addRealtimeConversation(conv) {
    set((s) => {
      if (s.conversations.some((c) => c.id === conv.id)) return {}
      return { conversations: [conv, ...s.conversations] }
    })
  },

  // Sync des mises à jour de conversation (lastMessageAt, etc.)
  updateRealtimeConversation(conv) {
    set((s) => ({
      conversations: s.conversations
        .map((c) => c.id === conv.id ? { ...c, ...conv } : c)
        .sort((a, b) => new Date(b.lastMessageAt ?? 0) - new Date(a.lastMessageAt ?? 0)),
    }))
  },
}))
