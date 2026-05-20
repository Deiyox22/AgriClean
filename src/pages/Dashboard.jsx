import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ClipboardList, Euro, Clock, AlertTriangle, Plus,
  TrendingUp, TrendingDown, Download, X, Hourglass,
  Users, Check, ChevronRight, ArrowRight, Building2,
  CalendarDays,
} from 'lucide-react'
import {
  startOfDay, endOfDay, startOfMonth, endOfMonth,
  subMonths, format, isWithinInterval,
} from 'date-fns'
import { fr } from 'date-fns/locale'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts'
import { useMissionStore }  from '../store/useMissionStore'
import { useInvoiceStore }  from '../store/useInvoiceStore'
import { useClientStore }   from '../store/useClientStore'
import { useEmployeeStore } from '../store/useEmployeeStore'
import { useSettingsStore } from '../store/useSettingsStore'
import Modal      from '../components/ui/Modal'
import Card       from '../components/ui/Card'
import Badge      from '../components/ui/Badge'
import { usePWAInstall } from '../hooks/usePWAInstall'
import {
  formatCurrency, formatRelativeDate,
  getMissionTypeLabel, getStatusLabel,
  getStatusBadgeClass, getInitials,
} from '../utils/formatters'
import { toast } from '../store/useToastStore'

const EMP_COLORS = ['bg-[#1a4731]','bg-[#d97706]','bg-blue-500','bg-purple-500','bg-teal-500','bg-pink-500']
const TYPE_ICON  = { ramassage: '🥚', nettoyage_agricole: '🌿', nettoyage_industriel: '🏭' }
const TYPE_COLOR = {
  ramassage:           'bg-amber-50 border-amber-200',
  nettoyage_agricole:  'bg-green-50 border-green-200',
  nettoyage_industriel:'bg-blue-50 border-blue-200',
}

// ── Quick assign modal ────────────────────────────────────────────────────────
function QuickAssignModal({ mission, clientName, onClose }) {
  const employees = useEmployeeStore((s) => s.employees)
  const update    = useMissionStore((s) => s.update)
  const [selected, setSelected] = useState([])
  const [saving,   setSaving]   = useState(false)
  const active = employees.filter((e) => e.status === 'actif')
  const toggle = (id) => setSelected((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id])
  const handleSave = async () => {
    if (!selected.length) return
    setSaving(true)
    try {
      await update(mission.id, { teamIds: selected })
      toast.success(`Équipe assignée — ${selected.length} employé${selected.length > 1 ? 's' : ''}`)
      onClose()
    } finally { setSaving(false) }
  }
  return (
    <Modal open onClose={onClose} title={`Assigner — ${clientName}`} size="sm">
      <div className="space-y-2 mb-4">
        {active.map((emp, i) => {
          const sel = selected.includes(emp.id)
          return (
            <button key={emp.id} onClick={() => toggle(emp.id)}
              className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all ${sel ? 'border-primary bg-primary/5' : 'border-slate-100 hover:border-slate-200'}`}>
              <div className={`w-8 h-8 rounded-full ${EMP_COLORS[i % EMP_COLORS.length]} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
                {getInitials(emp.firstName, emp.lastName)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900">{emp.firstName} {emp.lastName}</p>
                <p className="text-xs text-slate-400 capitalize">{emp.role}</p>
              </div>
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${sel ? 'bg-primary border-primary' : 'border-slate-300'}`}>
                {sel && <Check size={11} className="text-white" />}
              </div>
            </button>
          )
        })}
      </div>
      <button onClick={handleSave} disabled={!selected.length || saving}
        className="w-full py-3 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary-light disabled:opacity-40">
        {saving ? 'Enregistrement…' : selected.length ? `Assigner ${selected.length} employé${selected.length > 1 ? 's' : ''}` : 'Sélectionner des employés'}
      </button>
    </Modal>
  )
}

// ── Custom chart tooltip ──────────────────────────────────────────────────────
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-slate-100 rounded-2xl shadow-lg px-3 py-2.5 text-sm">
      <p className="font-semibold text-slate-700 mb-1 capitalize">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} style={{ color: p.color }} className="text-xs">
          {p.name} : <span className="font-bold">{formatCurrency(p.value)}</span>
        </p>
      ))}
    </div>
  )
}

// ── Main dashboard ────────────────────────────────────────────────────────────
export default function Dashboard() {
  const missions  = useMissionStore((s) => s.missions)
  const invoices  = useInvoiceStore((s) => s.invoices)
  const clients   = useClientStore((s) => s.clients)
  const employees = useEmployeeStore((s) => s.employees)
  const companyName = useSettingsStore((s) => s.settings.company?.name ?? 'AgriClean')
  const [assignModal, setAssignModal] = useState(null)
  const { isInstallable, install } = usePWAInstall()
  const [showInstall, setShowInstall] = useState(true)
  const navigate = useNavigate()

  const now  = new Date()
  const hour = now.getHours()
  const greeting = hour < 12 ? 'Bonjour' : hour < 18 ? 'Bonne après-midi' : 'Bonsoir'

  const getEmployee  = (id) => employees.find((e) => e.id === id)
  const getClientName = (cid) => clients.find((c) => c.id === cid)?.name ?? '—'

  // ── Métriques ────────────────────────────────────────────────────────────────
  const todayMissions = useMemo(() =>
    missions.filter((m) => isWithinInterval(new Date(m.date), { start: startOfDay(now), end: endOfDay(now) }))
      .sort((a, b) => new Date(a.date) - new Date(b.date)),
    [missions])

  const monthMissions = useMemo(() =>
    missions.filter((m) => isWithinInterval(new Date(m.date), { start: startOfMonth(now), end: endOfMonth(now) })),
    [missions])

  const prevMonthMissions = useMemo(() => {
    const prev = subMonths(now, 1)
    return missions.filter((m) => isWithinInterval(new Date(m.date), { start: startOfMonth(prev), end: endOfMonth(prev) }))
  }, [missions])

  const monthCA = useMemo(() =>
    invoices
      .filter((i) => isWithinInterval(new Date(i.createdAt), { start: startOfMonth(now), end: endOfMonth(now) }))
      .reduce((sum, i) => sum + (i.lines ?? []).reduce((s, l) => s + (l.total ?? 0), 0), 0),
    [invoices])

  const prevMonthCA = useMemo(() => {
    const prev = subMonths(now, 1)
    return invoices
      .filter((i) => isWithinInterval(new Date(i.createdAt), { start: startOfMonth(prev), end: endOfMonth(prev) }))
      .reduce((sum, i) => sum + (i.lines ?? []).reduce((s, l) => s + (l.total ?? 0), 0), 0)
  }, [invoices])

  const caEvolution = prevMonthCA > 0 ? Math.round(((monthCA - prevMonthCA) / prevMonthCA) * 100) : null

  const pendingTotal = useMemo(() =>
    invoices
      .filter((i) => ['emise','en_attente','relance1','relance2'].includes(i.status))
      .reduce((sum, i) => sum + (i.lines ?? []).reduce((s, l) => s + (l.total ?? 0), 0), 0),
    [invoices])

  const monthHours = useMemo(() =>
    monthMissions.filter((m) => ['termine','facture','paye'].includes(m.status))
      .reduce((sum, m) => sum + (m.report?.realDuration ?? m.duration ?? 0), 0),
    [monthMissions])

  const alerts = useMemo(() => ({
    unassigned:   missions.filter((m) => m.status === 'planifie' && (!m.teamIds || m.teamIds.length === 0)),
    lateInvoices: invoices.filter((i) => i.status === 'en_attente' && i.dueDate && new Date(i.dueDate) < now),
  }), [missions, invoices])

  const alertCount = alerts.unassigned.length + alerts.lateInvoices.length

  const chartData = useMemo(() =>
    Array.from({ length: 6 }, (_, i) => {
      const month = subMonths(now, 5 - i)
      const start = startOfMonth(month)
      const end   = endOfMonth(month)
      const mi    = invoices.filter((inv) => isWithinInterval(new Date(inv.createdAt), { start, end }))
      const ca    = mi.reduce((sum, inv) => sum + (inv.lines ?? []).reduce((s, l) => s + (l.total ?? 0), 0), 0)
      return { label: format(month, 'MMM', { locale: fr }), ca, missions: monthMissions.length }
    }),
    [invoices, missions])

  const activeClients = clients.filter((c) => c.status === 'actif').length
  const activeEmployees = employees.filter((e) => e.status === 'actif').length

  return (
    <div className="space-y-5 max-w-7xl">

      {/* ── PWA banner ── */}
      {isInstallable && showInstall && (
        <div className="bg-gradient-to-r from-[#0f2318] to-primary rounded-2xl p-4 text-white flex items-center gap-4">
          <div className="w-10 h-10 bg-white/15 rounded-xl flex items-center justify-center shrink-0">
            <Download size={20} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm">Installer l'application</p>
            <p className="text-white/65 text-xs">Accès rapide + notifications push</p>
          </div>
          <button onClick={install}
            className="shrink-0 px-3 py-1.5 bg-amber-500 text-white text-xs font-bold rounded-xl hover:bg-amber-400 transition-colors">
            Installer
          </button>
          <button onClick={() => setShowInstall(false)} className="shrink-0 p-1.5 hover:bg-white/10 rounded-lg transition-colors">
            <X size={15} />
          </button>
        </div>
      )}

      {/* ── Header greeting ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">
            {greeting}, Manager 👋
          </h1>
          <p className="text-slate-500 text-sm mt-0.5 capitalize">
            {format(now, 'EEEE d MMMM yyyy', { locale: fr })}
          </p>
        </div>
        <button onClick={() => navigate('/missions/new')}
          className="shrink-0 flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary-light transition-colors shadow-sm shadow-primary/20">
          <Plus size={16} /> Nouvelle mission
        </button>
      </div>

      {/* ── KPIs principaux ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">

        {/* CA du mois */}
        <div className="bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl p-5 shadow-md shadow-amber-200/50 col-span-2 lg:col-span-1">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-white/75 text-xs font-medium">CA du mois</p>
              <p className="text-2xl font-bold text-white mt-1 font-mono">{formatCurrency(monthCA)}</p>
              {caEvolution !== null && (
                <div className="flex items-center gap-1 mt-1.5">
                  {caEvolution >= 0
                    ? <TrendingUp size={12} className="text-white/80" />
                    : <TrendingDown size={12} className="text-white/80" />}
                  <span className="text-xs text-white/80 font-medium">
                    {caEvolution >= 0 ? '+' : ''}{caEvolution}% vs mois dernier
                  </span>
                </div>
              )}
            </div>
            <div className="p-2.5 bg-white/20 rounded-xl"><Euro size={18} className="text-white" /></div>
          </div>
        </div>

        {/* À encaisser */}
        <div className={`rounded-2xl p-5 border ${pendingTotal > 0 ? 'bg-red-50 border-red-200' : 'bg-white border-slate-100'}`}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">À encaisser</p>
              <p className={`text-2xl font-bold mt-1 font-mono ${pendingTotal > 0 ? 'text-red-600' : 'text-slate-900'}`}>
                {formatCurrency(pendingTotal)}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                {invoices.filter((i) => ['emise','en_attente','relance1','relance2'].includes(i.status)).length} facture(s)
              </p>
            </div>
            <div className={`p-2.5 rounded-xl ${pendingTotal > 0 ? 'bg-red-100' : 'bg-slate-100'}`}>
              <Hourglass size={18} className={pendingTotal > 0 ? 'text-red-500' : 'text-slate-400'} />
            </div>
          </div>
        </div>

        {/* Missions aujourd'hui */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">Missions aujourd'hui</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1 font-mono">{todayMissions.length}</p>
              <div className="flex items-center gap-2 mt-1.5">
                {['planifie','en_cours','termine'].map((s) => {
                  const count = todayMissions.filter((m) => m.status === s).length
                  if (!count) return null
                  return (
                    <span key={s} className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${getStatusBadgeClass(s)}`}>
                      {count} {getStatusLabel(s).toLowerCase()}
                    </span>
                  )
                })}
              </div>
            </div>
            <div className="p-2.5 bg-primary/10 rounded-xl"><CalendarDays size={18} className="text-primary" /></div>
          </div>
        </div>

        {/* Alertes */}
        <div
          onClick={() => alertCount > 0 && navigate('/alertes')}
          className={`rounded-2xl border p-5 ${alertCount > 0 ? 'bg-amber-50 border-amber-200 cursor-pointer hover:bg-amber-100 transition-colors' : 'bg-white border-slate-100 dark:bg-slate-800 dark:border-slate-700'}`}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">Alertes actives</p>
              <p className={`text-2xl font-bold mt-1 font-mono ${alertCount > 0 ? 'text-amber-600' : 'text-slate-900 dark:text-white'}`}>
                {alertCount}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                {alertCount === 0 ? 'Tout est OK ✓' : `${alerts.unassigned.length} non-assignée${alerts.unassigned.length > 1 ? 's' : ''} · ${alerts.lateInvoices.length} retard`}
              </p>
            </div>
            <div className={`p-2.5 rounded-xl ${alertCount > 0 ? 'bg-amber-100' : 'bg-slate-100 dark:bg-slate-700'}`}>
              <AlertTriangle size={18} className={alertCount > 0 ? 'text-amber-500 animate-pulse' : 'text-slate-400'} />
            </div>
          </div>
        </div>
      </div>

      {/* ── Alertes détail ── */}
      {alertCount > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 overflow-hidden">
          <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-slate-50 dark:border-slate-700">
            <AlertTriangle size={16} className="text-amber-500 shrink-0" />
            <p className="font-semibold text-slate-900 dark:text-white text-sm">Actions requises</p>
            <span className="ml-auto text-xs font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
              {alertCount}
            </span>
          </div>
          <div className="divide-y divide-slate-50 dark:divide-slate-700">
            {alerts.unassigned.map((m) => (
              <div key={m.id} className="flex items-center gap-3 px-5 py-3">
                <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center shrink-0 text-base">
                  {TYPE_ICON[m.type] ?? '📋'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                    {getMissionTypeLabel(m.type)} — {getClientName(m.clientId)}
                  </p>
                  <p className="text-xs text-amber-600">{formatRelativeDate(m.date)} · Aucune équipe assignée</p>
                </div>
                <button
                  onClick={() => setAssignModal({ mission: m, clientName: getClientName(m.clientId) })}
                  className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white text-xs font-semibold rounded-xl hover:bg-primary-light transition-colors">
                  <Users size={12} /> Assigner
                </button>
              </div>
            ))}
            {alerts.lateInvoices.map((inv) => (
              <button key={inv.id} onClick={() => navigate(`/invoicing/${inv.id}`)}
                className="w-full flex items-center gap-3 px-5 py-3 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors text-left">
                <div className="w-8 h-8 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
                  <Euro size={15} className="text-red-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                    {inv.number} — {getClientName(inv.clientId)}
                  </p>
                  <p className="text-xs text-red-600 font-medium">
                    {formatCurrency((inv.lines ?? []).reduce((s, l) => s + (l.total ?? 0), 0))} HT · Paiement en retard
                  </p>
                </div>
                <ChevronRight size={15} className="text-slate-300 shrink-0" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Grille principale ── */}
      <div className="grid lg:grid-cols-5 gap-5">

        {/* Planning du jour */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-50 dark:border-slate-700">
            <h2 className="font-bold text-slate-900 dark:text-white text-sm">Planning du jour</h2>
            <button onClick={() => navigate('/planning')}
              className="text-xs text-primary font-semibold hover:underline flex items-center gap-1">
              Planning <ArrowRight size={12} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {todayMissions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center px-4">
                <div className="text-3xl mb-3">☀️</div>
                <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">Journée libre</p>
                <p className="text-xs text-slate-400 mt-1">Aucune mission planifiée aujourd'hui</p>
                <button onClick={() => navigate('/missions/new')}
                  className="mt-4 flex items-center gap-1.5 px-3 py-2 bg-primary/10 text-primary text-xs font-semibold rounded-xl hover:bg-primary/20 transition-colors">
                  <Plus size={13} /> Planifier une mission
                </button>
              </div>
            ) : (
              <div className="divide-y divide-slate-50 dark:divide-slate-700">
                {todayMissions.map((m) => {
                  const team = (m.teamIds ?? []).slice(0, 3).map(getEmployee).filter(Boolean)
                  return (
                    <button key={m.id} onClick={() => navigate(`/missions/${m.id}`)}
                      className={`w-full flex items-center gap-3 px-4 py-3.5 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors text-left`}>
                      <div className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 text-lg ${TYPE_COLOR[m.type] ?? 'bg-slate-50 border-slate-100'}`}>
                        {TYPE_ICON[m.type] ?? '📋'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{getMissionTypeLabel(m.type)}</p>
                        </div>
                        <p className="text-xs text-slate-500 truncate">{getClientName(m.clientId)}</p>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className="text-[10px] text-slate-400">{format(new Date(m.date), 'HH:mm')} · {m.duration}h</span>
                          {team.slice(0, 2).map((emp, i) => (
                            <span key={emp.id} className={`text-[10px] text-white font-bold px-1.5 py-0.5 rounded-full ${EMP_COLORS[i % EMP_COLORS.length]}`}>
                              {getInitials(emp.firstName, emp.lastName)}
                            </span>
                          ))}
                          {(m.teamIds?.length ?? 0) > 2 && <span className="text-[10px] text-slate-400">+{m.teamIds.length - 2}</span>}
                        </div>
                      </div>
                      <Badge className={`${getStatusBadgeClass(m.status)} shrink-0`}>{getStatusLabel(m.status)}</Badge>
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          <div className="px-4 py-3 border-t border-slate-50 dark:border-slate-700">
            <button onClick={() => navigate('/missions/new')}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-600 text-slate-400 hover:border-primary/40 hover:text-primary transition-colors text-xs font-medium">
              <Plus size={14} /> Nouvelle mission
            </button>
          </div>
        </div>

        {/* Chart + métriques secondaires */}
        <div className="lg:col-span-3 space-y-4">

          {/* Chart CA */}
          <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-bold text-slate-900 dark:text-white text-sm">Chiffre d'affaires</h2>
                <p className="text-xs text-slate-400 mt-0.5">6 derniers mois</p>
              </div>
              <button onClick={() => navigate('/rapports')}
                className="text-xs text-primary font-semibold hover:underline flex items-center gap-1">
                Rapports <ArrowRight size={12} />
              </button>
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={chartData} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="caGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1a4731" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#1a4731" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(0)}k€` : `${v}€`} width={40} />
                <Tooltip content={<ChartTooltip />} />
                <Area type="monotone" dataKey="ca" stroke="#1a4731" strokeWidth={2.5} fill="url(#caGrad)" dot={false} name="CA" />
              </AreaChart>
            </ResponsiveContainer>
          </Card>

          {/* Métriques secondaires */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Missions ce mois', value: monthMissions.length, sub: `${prevMonthMissions.length} le mois dernier`, icon: ClipboardList, color: 'text-primary', bg: 'bg-primary/10' },
              { label: 'Clients actifs',   value: activeClients,         sub: `${clients.length} total`,                   icon: Building2,    color: 'text-blue-600', bg: 'bg-blue-50' },
              { label: 'Heures équipe',    value: `${monthHours}h`,      sub: `${activeEmployees} employés actifs`,         icon: Clock,        color: 'text-green-600', bg: 'bg-green-50' },
            ].map(({ label, value, sub, icon: Icon, color, bg }) => (
              <Card key={label} className="p-4">
                <div className={`w-8 h-8 rounded-xl ${bg} flex items-center justify-center mb-3`}>
                  <Icon size={16} className={color} />
                </div>
                <p className="text-xl font-bold text-slate-900 dark:text-white font-mono">{value}</p>
                <p className="text-xs text-slate-500 mt-0.5 leading-tight">{label}</p>
                <p className="text-[10px] text-slate-400 mt-1">{sub}</p>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* ── Accès rapides ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Nouveau client',    icon: Building2,   path: '/clients',   color: 'hover:border-blue-200 hover:bg-blue-50/50' },
          { label: 'Voir le planning',  icon: CalendarDays,path: '/planning',  color: 'hover:border-primary/20 hover:bg-primary/5' },
          { label: 'Facturation',       icon: Euro,        path: '/invoicing', color: 'hover:border-amber-200 hover:bg-amber-50/50' },
          { label: 'Équipe',            icon: Users,       path: '/team',      color: 'hover:border-green-200 hover:bg-green-50/50' },
        ].map(({ label, icon: Icon, path, color }) => (
          <button key={path} onClick={() => navigate(path)}
            className={`flex items-center gap-3 p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 ${color} transition-all text-left group`}>
            <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Icon size={17} className="text-slate-600 dark:text-slate-300" />
            </div>
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{label}</span>
            <ChevronRight size={14} className="text-slate-300 ml-auto" />
          </button>
        ))}
      </div>

      {assignModal && (
        <QuickAssignModal
          mission={assignModal.mission}
          clientName={assignModal.clientName}
          onClose={() => setAssignModal(null)}
        />
      )}
    </div>
  )
}
