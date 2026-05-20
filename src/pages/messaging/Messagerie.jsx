import { useState, useEffect } from 'react'
import {
  MessageSquare, User, Building2, ClipboardList,
  Search, ChevronLeft, Plus, X, ChevronRight, Users,
} from 'lucide-react'
import { useMessagingStore } from '../../store/useMessagingStore'
import { useEmployeeStore } from '../../store/useEmployeeStore'
import { useClientStore } from '../../store/useClientStore'
import { useTeamStore, teamColorCls } from '../../store/useTeamStore'
import ChatPanel from '../../components/messaging/ChatPanel'
import NotifPrompt from '../../components/ui/NotifPrompt'
import { getInitials } from '../../utils/formatters'
import { format, isToday, isYesterday, isThisWeek } from 'date-fns'
import { fr } from 'date-fns/locale'

function getConvInfo(conv, employees, clients, teams) {
  if (conv.type === 'direct_employee') {
    const emp = employees.find((e) => e.id === conv.employeeId)
    return {
      name:     emp ? `${emp.firstName} ${emp.lastName}` : (conv.title ?? 'Employé'),
      subtitle: 'Message direct',
      icon:     User,
      color:    'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-400',
    }
  }
  if (conv.type === 'direct_client') {
    const client = clients.find((c) => c.id === conv.clientId)
    return {
      name:     client?.name ?? (conv.title ?? 'Client'),
      subtitle: 'Client',
      icon:     Building2,
      color:    'bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400',
    }
  }
  if (conv.type === 'team') {
    const team = teams.find((t) => t.id === conv.teamId)
    const bg   = teamColorCls(team?.color ?? 'green')
    return {
      name:     team?.name ?? (conv.title ?? 'Équipe'),
      subtitle: team ? `${team.memberIds?.length ?? 0} membre${(team.memberIds?.length ?? 0) > 1 ? 's' : ''}` : 'Chat d\'équipe',
      icon:     Users,
      color:    `${bg} text-white`,
      teamColor: bg,
    }
  }
  return {
    name:     conv.title ?? 'Conversation',
    subtitle: '',
    icon:     MessageSquare,
    color:    'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
  }
}

// ── Modale nouvelle conversation ──────────────────────────────────────────────

function NewConvModal({ employees, clients, teams, onSelect, onClose }) {
  const [step, setStep]     = useState('type')
  const [type, setType]     = useState(null)
  const [search, setSearch] = useState('')

  const TYPES = [
    { key: 'direct_employee', label: 'Employé',  icon: User,      color: 'bg-indigo-50 border-indigo-200 text-indigo-700' },
    { key: 'direct_client',   label: 'Client',   icon: Building2, color: 'bg-amber-50 border-amber-200 text-amber-700' },
    { key: 'team',            label: 'Équipe',   icon: Users,     color: 'bg-green-50 border-green-200 text-green-700' },
  ]

  const items = (() => {
    const q = search.toLowerCase().trim()
    if (type === 'direct_employee')
      return employees
        .filter((e) => e.status === 'actif' && (!q || `${e.firstName} ${e.lastName}`.toLowerCase().includes(q)))
        .map((e) => ({ id: e.id, label: `${e.firstName} ${e.lastName}`, sub: e.role }))
    if (type === 'direct_client')
      return clients
        .filter((c) => !q || c.name.toLowerCase().includes(q))
        .map((c) => ({ id: c.id, label: c.name, sub: c.type }))
    if (type === 'team')
      return teams
        .filter((t) => !q || t.name.toLowerCase().includes(q))
        .map((t) => ({
          id: t.id,
          label: t.name,
          sub: `${t.memberIds?.length ?? 0} membre${(t.memberIds?.length ?? 0) > 1 ? 's' : ''}`,
        }))
    return []
  })()

  const handleTypeSelect = (t) => { setType(t); setStep('pick'); setSearch('') }

  const handleItemSelect = (item) => {
    onSelect(type, item)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <div className="flex items-center gap-2">
            {step === 'pick' && (
              <button onClick={() => setStep('type')}
                className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700">
                <ChevronLeft size={18} />
              </button>
            )}
            <p className="font-bold text-slate-900 dark:text-white">
              {step === 'type' ? 'Nouvelle conversation' : TYPES.find((t) => t.key === type)?.label}
            </p>
          </div>
          <button onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700">
            <X size={18} />
          </button>
        </div>

        {/* Step 1 : choisir le type */}
        {step === 'type' && (
          <div className="px-4 pb-5 space-y-2">
            {TYPES.map(({ key, label, icon: Icon, color }) => (
              <button key={key} onClick={() => handleTypeSelect(key)}
                className={`w-full flex items-center gap-3 p-3.5 rounded-2xl border-2 ${color} hover:opacity-80 transition-opacity`}>
                <Icon size={20} />
                <span className="font-semibold text-sm">{label}</span>
                <ChevronRight size={16} className="ml-auto opacity-50" />
              </button>
            ))}
          </div>
        )}

        {/* Step 2 : choisir le destinataire */}
        {step === 'pick' && (
          <div className="px-4 pb-5">
            <div className="relative mb-3">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                autoFocus
                placeholder="Rechercher…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div className="max-h-56 overflow-y-auto space-y-1">
              {items.length === 0 && (
                <p className="text-center text-slate-400 text-sm py-6">Aucun résultat</p>
              )}
              {items.map((item) => (
                <button key={item.id} onClick={() => handleItemSelect(item)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-left">
                  <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="text-primary text-xs font-bold">
                      {item.label.slice(0, 2).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{item.label}</p>
                    {item.sub && <p className="text-xs text-slate-400 capitalize truncate">{item.sub}</p>}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Filtres ───────────────────────────────────────────────────────────────────

function convTime(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  if (isToday(d))             return format(d, 'HH:mm')
  if (isYesterday(d))         return 'Hier'
  if (isThisWeek(d, { weekStartsOn: 1 })) return format(d, 'EEE', { locale: fr })
  return format(d, 'dd/MM')
}

const FILTERS = [
  { key: 'all',       label: 'Tous' },
  { key: 'employees', label: 'Employés' },
  { key: 'clients',   label: 'Clients' },
  { key: 'teams',     label: 'Équipes' },
]

// ── Page principale ───────────────────────────────────────────────────────────

export default function Messagerie() {
  const conversations     = useMessagingStore((s) => s.conversations)
  const messages          = useMessagingStore((s) => s.messages)
  const loadConversations = useMessagingStore((s) => s.loadConversations)
  const loadUnreadTotal   = useMessagingStore((s) => s.loadUnreadTotal)
  const markRead          = useMessagingStore((s) => s.markRead)
  const getOrCreate       = useMessagingStore((s) => s.getOrCreate)
  const unreadByConv      = useMessagingStore((s) => s.unreadByConv)
  const setOpenConvId     = useMessagingStore((s) => s.setOpenConvId)
  const pendingConvId     = useMessagingStore((s) => s.pendingConvId)
  const clearPendingConv  = useMessagingStore((s) => s.clearPendingConv)
  const employees         = useEmployeeStore((s) => s.employees)
  const clients           = useClientStore((s) => s.clients)
  const teams             = useTeamStore((s) => s.teams)

  const [selected,   setSelected]   = useState(null)
  const [filter,     setFilter]     = useState('all')
  const [search,     setSearch]     = useState('')
  const [mobileChat, setMobileChat] = useState(false)
  const [showNewModal, setShowNewModal] = useState(false)

  useEffect(() => {
    loadConversations()
    loadUnreadTotal()
  }, [])

  // Auto-ouvrir une conversation suite à un clic sur un toast
  useEffect(() => {
    if (!pendingConvId) return
    const conv = conversations.find((c) => c.id === pendingConvId)
    if (conv) {
      setSelected(conv)
      setMobileChat(true)
      markRead(conv.id)
      loadUnreadTotal()
      clearPendingConv()
    }
  }, [pendingConvId, conversations])

  const filtered = conversations.filter((c) => {
    if (filter === 'employees' && c.type !== 'direct_employee') return false
    if (filter === 'clients'   && c.type !== 'direct_client')   return false
    if (filter === 'teams'     && c.type !== 'team')              return false
    if (search.trim()) {
      const info = getConvInfo(c, employees, clients, teams)
      if (!info.name.toLowerCase().includes(search.toLowerCase())) return false
    }
    return true
  })

  const getUnread = (convId) => unreadByConv[convId] ?? 0

  const handleSelect = (conv) => {
    setSelected(conv)
    setMobileChat(true)
    setOpenConvId(conv.id)
    markRead(conv.id)
    loadUnreadTotal()
  }

  // Quand on quitte la page, libérer openConvId
  useEffect(() => () => setOpenConvId(null), [])

  const handleNewConv = async (type, item) => {
    setShowNewModal(false)
    const params =
      type === 'direct_employee' ? { employeeId: item.id, title: item.label } :
      type === 'direct_client'   ? { clientId:   item.id, title: item.label } :
      /* team */                   { teamId:      item.id, title: item.label }

    const conv = await getOrCreate(type, params)
    if (conv) handleSelect(conv)
  }

  return (
    <div
      className="flex -mx-4 md:-mx-6 -my-4 md:-my-6 -mb-28 md:-mb-8 overflow-hidden"
      style={{ height: 'calc(100vh - 3.5rem)' }}
    >
      {/* ── Left: conversation list ── */}
      <div className={`
        ${mobileChat ? 'hidden md:flex' : 'flex'}
        flex-col w-full md:w-80 border-r border-slate-100 dark:border-slate-800
        bg-white dark:bg-slate-900 shrink-0
      `}>
        {/* Header */}
        <div className="px-4 pt-5 pb-3 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-base font-bold text-slate-900 dark:text-white">Messagerie</h1>
            <button
              onClick={() => setShowNewModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white rounded-xl text-xs font-semibold hover:opacity-90 transition-opacity"
            >
              <Plus size={14} /> Nouveau
            </button>
          </div>
          <div className="relative mb-3">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div className="flex gap-1 overflow-x-auto pb-0.5">
            {FILTERS.map((f) => (
              <button key={f.key} onClick={() => setFilter(f.key)}
                className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                  filter === f.key
                    ? 'bg-primary text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}>
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-center px-4">
              <MessageSquare size={28} className="text-slate-300 mb-2" />
              <p className="text-sm text-slate-400">Aucune conversation</p>
              <button onClick={() => setShowNewModal(true)}
                className="mt-3 text-xs text-primary font-semibold hover:underline">
                Démarrer une conversation →
              </button>
            </div>
          ) : (
            filtered.map((conv) => {
              const info     = getConvInfo(conv, employees, clients, teams)
              const Icon     = info.icon
              const unread   = getUnread(conv.id)
              const isActive = selected?.id === conv.id
              return (
                <button key={conv.id} onClick={() => handleSelect(conv)}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 border-b border-slate-50 dark:border-slate-800/60 text-left transition-colors ${
                    isActive
                      ? 'bg-primary/5 dark:bg-primary/10'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}>
                  <div className={`w-10 h-10 rounded-2xl ${info.color} flex items-center justify-center shrink-0`}>
                    <Icon size={17} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold truncate ${isActive ? 'text-primary' : 'text-slate-900 dark:text-white'}`}>
                      {info.name}
                    </p>
                    <p className="text-xs text-slate-400 truncate">{info.subtitle}</p>
                  </div>
                  <div className="shrink-0 flex flex-col items-end gap-1">
                    {conv.lastMessageAt && (
                      <p className="text-[10px] text-slate-400">
                        {convTime(conv.lastMessageAt)}
                      </p>
                    )}
                    {unread > 0 && (
                      <span className="w-5 h-5 bg-primary text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                        {unread > 9 ? '9+' : unread}
                      </span>
                    )}
                  </div>
                </button>
              )
            })
          )}
        </div>
      </div>

      {/* ── Right: chat window ── */}
      <div className={`${!mobileChat ? 'hidden md:flex' : 'flex'} flex-1 flex-col min-w-0 bg-slate-50 dark:bg-slate-950`}>
        {selected ? (
          <>
            <div className="shrink-0 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
              {/* Titre */}
              <div className="flex items-center gap-3 px-4 py-3">
                <button onClick={() => setMobileChat(false)}
                  className="md:hidden p-1.5 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">
                  <ChevronLeft size={20} />
                </button>
                {(() => {
                  const info = getConvInfo(selected, employees, clients, teams)
                  const Icon = info.icon
                  return (
                    <>
                      <div className={`w-9 h-9 rounded-xl ${info.color} flex items-center justify-center shrink-0`}>
                        <Icon size={16} />
                      </div>
                      <div>
                        <p className="font-semibold text-sm text-slate-900 dark:text-white">{info.name}</p>
                        <p className="text-xs text-slate-400">{info.subtitle}</p>
                      </div>
                    </>
                  )
                })()}
              </div>

              {/* Participants (missions uniquement) */}
              {selected.type === 'team' && (() => {
                const team    = teams.find((t) => t.id === selected.teamId)
                const members = (team?.memberIds ?? []).map((id) => employees.find((e) => e.id === id)).filter(Boolean)
                if (members.length === 0) return null
                const COLORS = ['bg-indigo-500','bg-amber-500','bg-green-500','bg-rose-500','bg-violet-500','bg-cyan-500']
                return (
                  <div className="px-4 pb-3 flex flex-wrap gap-1.5">
                    {/* Manager toujours présent */}
                    <div className="flex items-center gap-1.5 bg-primary/10 rounded-full px-2.5 py-1">
                      <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center text-white text-[9px] font-bold shrink-0">M</div>
                      <span className="text-xs font-medium text-primary">Manager</span>
                    </div>
                    {members.map((emp, i) => (
                      <div key={emp.id} className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 rounded-full px-2.5 py-1">
                        <div className={`w-5 h-5 rounded-full ${COLORS[i % COLORS.length]} flex items-center justify-center text-white text-[9px] font-bold shrink-0`}>
                          {getInitials(emp.firstName, emp.lastName)}
                        </div>
                        <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                          {emp.firstName} {emp.lastName}
                        </span>
                      </div>
                    ))}
                  </div>
                )
              })()}
            </div>
            <div className="flex-1 min-h-0">
              <ChatPanel
                convId={selected.id}
                senderType="manager"
                senderId={null}
                senderName="Manager"
              />
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-4">
              <MessageSquare size={28} className="text-primary" />
            </div>
            <p className="font-semibold text-slate-700 dark:text-slate-300">Sélectionnez une conversation</p>
            <p className="text-sm text-slate-400 mt-1 mb-4">ou démarrez-en une nouvelle</p>
            <button onClick={() => setShowNewModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity">
              <Plus size={16} /> Nouvelle conversation
            </button>
          </div>
        )}
      </div>

      <NotifPrompt userType="manager" />

      {/* Modale nouvelle conversation */}
      {showNewModal && (
        <NewConvModal
          employees={employees}
          clients={clients}
          teams={teams}
          onSelect={handleNewConv}
          onClose={() => setShowNewModal(false)}
        />
      )}
    </div>
  )
}
