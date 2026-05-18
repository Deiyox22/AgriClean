import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ClipboardList, Euro, Clock, AlertTriangle, Plus, TrendingUp, Download, X } from 'lucide-react'
import { startOfDay, endOfDay, startOfMonth, endOfMonth, subMonths, format, isWithinInterval } from 'date-fns'
import { fr } from 'date-fns/locale'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { useMissionStore } from '../store/useMissionStore'
import { useInvoiceStore } from '../store/useInvoiceStore'
import { useClientStore } from '../store/useClientStore'
import { useEmployeeStore } from '../store/useEmployeeStore'
import { usePWAInstall } from '../hooks/usePWAInstall'
import StatCard from '../components/ui/StatCard'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import { formatCurrency, formatRelativeDate, getMissionTypeLabel, getStatusLabel, getStatusBadgeClass } from '../utils/formatters'

export default function Dashboard() {
  const missions = useMissionStore((s) => s.missions)
  const invoices = useInvoiceStore((s) => s.invoices)
  const clients = useClientStore((s) => s.clients)
  const employees = useEmployeeStore((s) => s.employees)
  const { isInstallable, install } = usePWAInstall()
  const navigate = useNavigate()
  const [showInstallNote, setShowInstallNote] = useState(true)

  const now = new Date()

  const todayMissions = useMemo(() =>
    missions.filter((m) => isWithinInterval(new Date(m.date), { start: startOfDay(now), end: endOfDay(now) })),
    [missions])

  const monthMissions = useMemo(() =>
    missions.filter((m) => isWithinInterval(new Date(m.date), { start: startOfMonth(now), end: endOfMonth(now) })),
    [missions])

  const monthCA = useMemo(() =>
    invoices
      .filter((i) => isWithinInterval(new Date(i.createdAt), { start: startOfMonth(now), end: endOfMonth(now) }))
      .reduce((sum, i) => sum + (i.lines ?? []).reduce((s, l) => s + (l.total ?? 0), 0), 0),
    [invoices])

  const monthHours = useMemo(() =>
    monthMissions.filter((m) => m.status === 'termine' || m.status === 'facture' || m.status === 'paye')
      .reduce((sum, m) => sum + (m.report?.realDuration ?? m.duration ?? 0), 0),
    [monthMissions])

  const alerts = useMemo(() => {
    const unassigned = missions.filter((m) => m.status === 'planifie' && (!m.teamIds || m.teamIds.length === 0))
    const lateInvoices = invoices.filter((i) => i.status === 'en_attente' && i.dueDate && new Date(i.dueDate) < now)
    return { unassigned, lateInvoices }
  }, [missions, invoices])

  const chartData = useMemo(() => {
    return Array.from({ length: 6 }, (_, i) => {
      const month = subMonths(now, 5 - i)
      const label = format(month, 'MMM', { locale: fr })
      const start = startOfMonth(month)
      const end = endOfMonth(month)
      const monthInvoices = invoices.filter((inv) => isWithinInterval(new Date(inv.createdAt), { start, end }))
      const ramassage = monthInvoices
        .filter((inv) => {
          const m = missions.find((mi) => mi.id === inv.missionId)
          return m?.type === 'ramassage'
        })
        .reduce((sum, inv) => sum + (inv.lines ?? []).reduce((s, l) => s + (l.total ?? 0), 0), 0)
      const nettoyage = monthInvoices
        .filter((inv) => {
          const m = missions.find((mi) => mi.id === inv.missionId)
          return m?.type !== 'ramassage'
        })
        .reduce((sum, inv) => sum + (inv.lines ?? []).reduce((s, l) => s + (l.total ?? 0), 0), 0)
      return { label, ramassage, nettoyage }
    })
  }, [invoices, missions])

  const getClientName = (clientId) => clients.find((c) => c.id === clientId)?.name ?? '—'

  return (
    <div className="space-y-6">
      {/* PWA Install Notification */}
      {isInstallable && showInstallNote && (
        <div className="bg-gradient-to-r from-primary to-[#2d6a4f] rounded-2xl p-4 shadow-lg text-white flex items-center gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
            <Download size={24} />
          </div>
          <div className="flex-1">
            <p className="font-bold text-sm">Installer l'application AgriClean</p>
            <p className="text-white/80 text-xs">Accédez plus rapidement à votre gestion et recevez les notifications.</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={install}
              className="px-4 py-2 bg-accent text-white text-xs font-bold rounded-xl hover:bg-accent-light transition-colors shadow-sm">
              Installer
            </button>
            <button onClick={() => setShowInstallNote(false)} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Missions aujourd'hui" value={todayMissions.length} icon={ClipboardList} color="primary" />
        <StatCard label="Missions ce mois" value={monthMissions.length} icon={TrendingUp} color="blue" />
        <StatCard label="CA du mois" value={formatCurrency(monthCA)} icon={Euro} color="accent" />
        <StatCard label="Heures équipe" value={`${monthHours}h`} icon={Clock} color="green" />
      </div>

      {/* Alerts */}
      {(alerts.unassigned.length > 0 || alerts.lateInvoices.length > 0) && (
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={18} className="text-red-500" />
            <h2 className="font-semibold text-slate-900">Alertes</h2>
            <span className="ml-auto bg-red-100 text-red-700 text-xs font-bold px-2 py-0.5 rounded-full">
              {alerts.unassigned.length + alerts.lateInvoices.length}
            </span>
          </div>
          <div className="space-y-2">
            {alerts.unassigned.map((m) => (
              <button
                key={m.id}
                onClick={() => navigate(`/missions/${m.id}`)}
                className="w-full flex items-center gap-3 p-3 rounded-xl bg-amber-50 hover:bg-amber-100 transition-colors text-left"
              >
                <span className="text-amber-600 text-sm">⚠️</span>
                <span className="text-sm text-slate-700">Mission sans équipe assignée — {getClientName(m.clientId)} ({formatRelativeDate(m.date)})</span>
              </button>
            ))}
            {alerts.lateInvoices.map((inv) => (
              <button
                key={inv.id}
                onClick={() => navigate(`/invoicing/${inv.id}`)}
                className="w-full flex items-center gap-3 p-3 rounded-xl bg-red-50 hover:bg-red-100 transition-colors text-left"
              >
                <span className="text-red-600 text-sm">🔴</span>
                <span className="text-sm text-slate-700">Facture en retard — {inv.number} · {getClientName(inv.clientId)} · {formatCurrency((inv.lines ?? []).reduce((s, l) => s + l.total, 0))} HT</span>
              </button>
            ))}
          </div>
        </Card>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Today's missions */}
        <Card className="p-5">
          <h2 className="font-semibold text-slate-900 mb-4">Planning du jour</h2>
          {todayMissions.length === 0 ? (
            <p className="text-slate-400 text-sm text-center py-8">Aucune mission aujourd'hui</p>
          ) : (
            <div className="space-y-3">
              {todayMissions.map((m) => (
                <button
                  key={m.id}
                  onClick={() => navigate(`/missions/${m.id}`)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:border-primary/30 hover:bg-slate-50 transition-all text-left"
                >
                  <div className={`w-2 h-2 rounded-full shrink-0 ${m.status === 'en_cours' ? 'bg-blue-500' : m.status === 'termine' ? 'bg-green-500' : 'bg-gray-300'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{getMissionTypeLabel(m.type)}</p>
                    <p className="text-xs text-slate-500 truncate">{getClientName(m.clientId)}</p>
                  </div>
                  <Badge className={getStatusBadgeClass(m.status)}>{getStatusLabel(m.status)}</Badge>
                </button>
              ))}
            </div>
          )}
          <button
            onClick={() => navigate('/missions/new')}
            className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-dashed border-slate-200 text-slate-400 hover:border-primary/40 hover:text-primary transition-colors text-sm"
          >
            <Plus size={16} /> Nouvelle mission
          </button>
        </Card>

        {/* Chart */}
        <Card className="p-5">
          <h2 className="font-semibold text-slate-900 mb-4">CA sur 6 mois</h2>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#94a3b8' }} />
              <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} tickFormatter={(v) => `${v}€`} />
              <Tooltip formatter={(v) => formatCurrency(v)} />
              <Legend />
              <Line type="monotone" dataKey="ramassage" stroke="#d97706" strokeWidth={2} dot={false} name="Ramassage" />
              <Line type="monotone" dataKey="nettoyage" stroke="#1a4731" strokeWidth={2} dot={false} name="Nettoyage" />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  )
}
