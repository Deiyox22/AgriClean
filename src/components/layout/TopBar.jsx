import { useState, useEffect, useRef, useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Search, X, Building2, ClipboardList, FileText, Users, BellRing, Plus } from 'lucide-react'
import { useClientStore } from '../../store/useClientStore'
import { useMissionStore } from '../../store/useMissionStore'
import { useInvoiceStore } from '../../store/useInvoiceStore'
import { useEmployeeStore } from '../../store/useEmployeeStore'
import { useVehicleStore } from '../../store/useVehicleStore'
import { useApplicationStore } from '../../store/useApplicationStore'
import { useSettingsStore } from '../../store/useSettingsStore'
import { getMissionTypeLabel, formatDate } from '../../utils/formatters'
import { differenceInDays } from 'date-fns'

// ─── Page meta ────────────────────────────────────────────────────────────────

const PAGE_TITLES = {
  '/dashboard':        'Dashboard',
  '/clients':          'Clients',
  '/team':             'Équipe',
  '/team/candidatures':'Candidatures',
  '/planning':         'Planning',
  '/missions':         'Missions',
  '/missions/new':     'Nouvelle mission',
  '/fleet':            'Flotte & Matériel',
  '/invoicing':        'Facturation',
  '/settings':         'Paramètres',
  '/rapports':         'Rapports',
  '/alertes':          'Alertes',
  '/messagerie':       'Messagerie',
}

const PAGE_ACTIONS = {
  '/missions': { label: 'Mission', to: '/missions/new' },
  '/clients':  { label: 'Client',  to: null },
}

// ─── Alert count ──────────────────────────────────────────────────────────────

function useAlertCount() {
  const invoices  = useInvoiceStore((s) => s.invoices)
  const missions  = useMissionStore((s) => s.missions)
  const vehicles  = useVehicleStore((s) => s.vehicles)
  const equipment = useVehicleStore((s) => s.equipment)
  const now = new Date()
  return useMemo(() => {
    const a = invoices.filter((i) => (i.status === 'emise' || i.status === 'en_attente') && i.dueDate && new Date(i.dueDate) < now).length
    const b = missions.filter((m) => m.status === 'planifie' && (!m.teamIds || m.teamIds.length === 0)).length
    const c = vehicles.filter((v) => v.nextCt && differenceInDays(new Date(v.nextCt), now) <= 60).length
    const d = equipment.filter((e) => e.status === 'maintenance' || e.status === 'panne').length
    return a + b + c + d
  }, [invoices, missions, vehicles, equipment])
}

// ─── Global search ────────────────────────────────────────────────────────────

function SearchModal({ onClose }) {
  const navigate  = useNavigate()
  const [query, setQuery] = useState('')
  const inputRef  = useRef(null)
  const clients   = useClientStore((s) => s.clients)
  const missions  = useMissionStore((s) => s.missions)
  const invoices  = useInvoiceStore((s) => s.invoices)
  const employees = useEmployeeStore((s) => s.employees)

  useEffect(() => { inputRef.current?.focus() }, [])

  const q = query.toLowerCase().trim()

  const results = useMemo(() => {
    if (!q) return []
    const list = []
    clients.filter((c) => c.name.toLowerCase().includes(q)).slice(0, 3)
      .forEach((c) => list.push({ type: 'Client', icon: Building2, label: c.name, sub: c.type, path: `/clients/${c.id}`, color: 'bg-blue-100 text-blue-700' }))
    missions.filter((m) => {
      const label  = getMissionTypeLabel(m.type).toLowerCase()
      const client = clients.find((c) => c.id === m.clientId)?.name.toLowerCase() ?? ''
      return label.includes(q) || client.includes(q)
    }).slice(0, 3).forEach((m) => {
      const client = clients.find((c) => c.id === m.clientId)?.name ?? '—'
      list.push({ type: 'Mission', icon: ClipboardList, label: getMissionTypeLabel(m.type), sub: `${client} · ${formatDate(m.date)}`, path: `/missions/${m.id}`, color: 'bg-amber-100 text-amber-700' })
    })
    invoices.filter((i) => (i.number ?? '').toLowerCase().includes(q)).slice(0, 3).forEach((i) => {
      const client = clients.find((c) => c.id === i.clientId)?.name ?? '—'
      list.push({ type: 'Facture', icon: FileText, label: i.number, sub: client, path: `/invoicing/${i.id}`, color: 'bg-green-100 text-green-700' })
    })
    employees.filter((e) => `${e.firstName} ${e.lastName}`.toLowerCase().includes(q)).slice(0, 2)
      .forEach((e) => list.push({ type: 'Employé', icon: Users, label: `${e.firstName} ${e.lastName}`, sub: e.role, path: `/team/${e.id}`, color: 'bg-purple-100 text-purple-700' }))
    return list
  }, [q, clients, missions, invoices, employees])

  const go = (path) => { navigate(path); onClose() }

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 w-full max-w-lg px-4 mt-2">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          {/* Search input */}
          <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-100 dark:border-slate-700">
            <Search size={17} className="text-slate-400 shrink-0" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher…"
              className="flex-1 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 bg-transparent focus:outline-none"
              onKeyDown={(e) => e.key === 'Escape' && onClose()}
            />
            <div className="flex items-center gap-2 shrink-0">
              {query
                ? <button onClick={() => setQuery('')} className="text-slate-400 hover:text-slate-600"><X size={15} /></button>
                : <kbd className="text-[10px] text-slate-400 bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded font-mono">Échap</kbd>
              }
            </div>
          </div>

          {/* Results */}
          {q ? (
            <div className="max-h-72 overflow-y-auto">
              {results.length === 0 ? (
                <div className="py-8 text-center text-sm text-slate-400">Aucun résultat pour « {query} »</div>
              ) : (
                <div className="p-2">
                  {results.map((r, i) => {
                    const Icon = r.icon
                    return (
                      <button key={i} onClick={() => go(r.path)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-left group">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-700 group-hover:bg-slate-200 dark:group-hover:bg-slate-600 flex items-center justify-center shrink-0 transition-colors">
                          <Icon size={15} className="text-slate-500 dark:text-slate-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">{r.label}</p>
                          {r.sub && <p className="text-xs text-slate-400 truncate capitalize">{r.sub}</p>}
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${r.color}`}>{r.type}</span>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          ) : (
            <div className="px-4 py-4 text-xs text-slate-400 flex items-center justify-center gap-3">
              <span>clients · missions · factures · employés</span>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

// ─── TopBar ───────────────────────────────────────────────────────────────────

export default function TopBar() {
  const location    = useLocation()
  const navigate    = useNavigate()
  const alertCount  = useAlertCount()
  const companyName = useSettingsStore((s) => s.settings.company?.name ?? 'AgriClean')
  const [searchOpen, setSearchOpen] = useState(false)
  const segments = location.pathname.split('/').filter(Boolean)

  const title = PAGE_TITLES[location.pathname] ?? PAGE_TITLES[`/${segments[0]}`] ?? 'AgriClean'
  const action = PAGE_ACTIONS[location.pathname]

  // Initials from company name
  const initials = companyName.split(' ').slice(0, 2).map((w) => w[0]?.toUpperCase() ?? '').join('') || 'AG'

  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setSearchOpen((v) => !v) }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  return (
    <>
      <header className="h-14 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3 px-4 md:px-6 sticky top-0 z-20">

        {/* Page title */}
        <h1 className="text-[15px] font-bold text-slate-900 dark:text-white truncate flex-1">{title}</h1>

        {/* Search trigger */}
        <button
          onClick={() => setSearchOpen(true)}
          className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600 transition-colors bg-slate-50 dark:bg-slate-800 text-sm"
        >
          <Search size={14} />
          <span className="text-xs text-slate-400">Rechercher…</span>
          <kbd className="text-[10px] bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 px-1.5 py-0.5 rounded font-mono text-slate-400">⌘K</kbd>
        </button>

        {/* Search icon on mobile */}
        <button onClick={() => setSearchOpen(true)} className="sm:hidden p-2 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
          <Search size={20} />
        </button>

        {/* Alert bell */}
        <button
          onClick={() => navigate('/alertes')}
          className="relative p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          aria-label="Alertes"
        >
          <BellRing size={20} strokeWidth={1.8} />
          {alertCount > 0 && (
            <span className="absolute top-0.5 right-0.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center leading-none">
              {alertCount > 9 ? '9+' : alertCount}
            </span>
          )}
        </button>

        {/* Action button (context-aware) */}
        {action && action.to && (
          <button
            onClick={() => navigate(action.to)}
            className="flex items-center gap-1.5 px-3 py-2 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary-light transition-colors"
          >
            <Plus size={16} />
            <span className="hidden sm:inline">{action.label}</span>
          </button>
        )}

        {/* Avatar */}
        <div
          className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center text-white text-xs font-bold shrink-0 cursor-pointer hover:bg-primary-light transition-colors"
          title={companyName}
          onClick={() => navigate('/settings')}
        >
          {initials}
        </div>
      </header>

      {searchOpen && <SearchModal onClose={() => setSearchOpen(false)} />}
    </>
  )
}
