import { useMemo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts'
import {
  startOfMonth, endOfMonth, subMonths, format,
  isWithinInterval, startOfYear, endOfYear,
} from 'date-fns'
import { fr } from 'date-fns/locale'
import { useMissionStore } from '../store/useMissionStore'
import { useInvoiceStore } from '../store/useInvoiceStore'
import { useClientStore } from '../store/useClientStore'
import { useEmployeeStore } from '../store/useEmployeeStore'
import Card from '../components/ui/Card'
import { formatCurrency } from '../utils/formatters'
import { Euro, TrendingUp, Clock, Users } from 'lucide-react'

const TYPE_COLORS = {
  ramassage:           '#d97706',
  nettoyage_agricole:  '#3b82f6',
  nettoyage_industriel:'#6366f1',
}

const TYPE_LABELS = {
  ramassage:           'Ramassage',
  nettoyage_agricole:  'Nett. agricole',
  nettoyage_industriel:'Nett. industriel',
}

function KPI({ label, value, icon: Icon, sub, color = 'primary' }) {
  const bg = { primary: 'bg-primary/10 text-primary', accent: 'bg-accent/10 text-accent', green: 'bg-green-100 text-green-700', blue: 'bg-blue-100 text-blue-700' }[color]
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-slate-500 mb-1">{label}</p>
          <p className="text-2xl font-bold text-slate-900 font-mono">{value}</p>
          {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
        </div>
        <div className={`p-3 rounded-xl ${bg}`}><Icon size={20} /></div>
      </div>
    </Card>
  )
}

export default function Rapports() {
  const missions  = useMissionStore((s) => s.missions)
  const invoices  = useInvoiceStore((s) => s.invoices)
  const clients   = useClientStore((s) => s.clients)
  const employees = useEmployeeStore((s) => s.employees)

  const now = new Date()

  // ── CA par mois (6 mois) ─────────────────────────────────────────────────
  const monthlyCA = useMemo(() =>
    Array.from({ length: 6 }, (_, i) => {
      const month = subMonths(now, 5 - i)
      const start = startOfMonth(month)
      const end   = endOfMonth(month)
      const ca    = invoices
        .filter((inv) => isWithinInterval(new Date(inv.createdAt), { start, end }))
        .reduce((s, inv) => s + (inv.lines ?? []).reduce((a, l) => a + (l.total ?? 0), 0), 0)
      return { mois: format(month, 'MMM', { locale: fr }), ca }
    }),
    [invoices])

  // ── CA par client (top 6) ─────────────────────────────────────────────────
  const caByClient = useMemo(() => {
    const map = {}
    invoices.forEach((inv) => {
      const name = clients.find((c) => c.id === inv.clientId)?.name ?? 'Inconnu'
      const ht   = (inv.lines ?? []).reduce((s, l) => s + (l.total ?? 0), 0)
      map[name]  = (map[name] ?? 0) + ht
    })
    return Object.entries(map)
      .map(([name, ca]) => ({ name: name.length > 20 ? name.slice(0, 18) + '…' : name, ca }))
      .sort((a, b) => b.ca - a.ca)
      .slice(0, 6)
  }, [invoices, clients])

  // ── Répartition missions par type ─────────────────────────────────────────
  const missionsByType = useMemo(() => {
    const map = {}
    missions.forEach((m) => { map[m.type] = (map[m.type] ?? 0) + 1 })
    return Object.entries(map).map(([type, count]) => ({
      name: TYPE_LABELS[type] ?? type,
      value: count,
      color: TYPE_COLORS[type] ?? '#94a3b8',
    }))
  }, [missions])

  // ── Heures par employé ───────────────────────────────────────────────────
  const hoursByEmployee = useMemo(() => {
    const start = startOfMonth(now)
    const end   = endOfMonth(now)
    return employees
      .filter((e) => e.status === 'actif')
      .map((emp) => {
        const hours = missions
          .filter((m) =>
            m.teamIds?.includes(emp.id) &&
            isWithinInterval(new Date(m.date), { start, end }) &&
            (m.status === 'termine' || m.status === 'facture' || m.status === 'paye')
          )
          .reduce((s, m) => s + (m.report?.realDuration ?? m.duration ?? 0), 0)
        return { name: `${emp.firstName} ${emp.lastName[0]}.`, hours }
      })
      .sort((a, b) => b.hours - a.hours)
  }, [employees, missions])

  // ── KPIs globaux ─────────────────────────────────────────────────────────
  const ytdCA = useMemo(() => {
    const start = startOfYear(now)
    const end   = endOfYear(now)
    return invoices
      .filter((inv) => isWithinInterval(new Date(inv.createdAt), { start, end }))
      .reduce((s, inv) => s + (inv.lines ?? []).reduce((a, l) => a + (l.total ?? 0), 0), 0)
  }, [invoices])

  const encaisse = useMemo(() =>
    invoices.filter((i) => i.status === 'payee').reduce((s, i) => s + (i.lines ?? []).reduce((a, l) => a + (l.total ?? 0), 0), 0),
    [invoices])

  const tauxEncaissement = ytdCA > 0 ? Math.round((encaisse / ytdCA) * 100) : 0

  const missionsDone = missions.filter((m) => ['termine', 'facture', 'paye'].includes(m.status)).length

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Rapports & Statistiques</h1>
        <p className="text-xs text-slate-400 mt-0.5">Données en temps réel depuis votre base</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPI label="CA année en cours" value={formatCurrency(ytdCA)} icon={Euro} color="primary" />
        <KPI label="Montant encaissé" value={formatCurrency(encaisse)} icon={TrendingUp} color="green"
          sub={`Taux : ${tauxEncaissement}%`} />
        <KPI label="Missions réalisées" value={missionsDone} icon={Clock} color="accent"
          sub={`sur ${missions.length} total`} />
        <KPI label="Clients actifs" value={clients.filter((c) => c.status === 'actif').length} icon={Users} color="blue"
          sub={`/ ${clients.length} clients`} />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* CA par mois */}
        <Card className="p-5">
          <h2 className="font-semibold text-slate-900 mb-4">Chiffre d'affaires HT — 6 mois</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={monthlyCA} barSize={24}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="mois" tick={{ fontSize: 12, fill: '#94a3b8' }} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v) => formatCurrency(v)} cursor={{ fill: '#f8fafc' }} />
              <Bar dataKey="ca" name="CA HT" fill="#1a4731" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Répartition missions */}
        <Card className="p-5">
          <h2 className="font-semibold text-slate-900 mb-4">Répartition missions par type</h2>
          {missionsByType.length === 0 ? (
            <div className="h-[220px] flex items-center justify-center text-slate-400 text-sm">Aucune mission</div>
          ) : (
            <div className="flex items-center gap-4">
              <ResponsiveContainer width="55%" height={200}>
                <PieChart>
                  <Pie data={missionsByType} dataKey="value" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3}>
                    {missionsByType.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v, name) => [`${v} missions`, name]} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 flex-1">
                {missionsByType.map((entry) => (
                  <div key={entry.name} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-sm shrink-0" style={{ background: entry.color }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-slate-700 truncate">{entry.name}</p>
                      <p className="text-xs text-slate-400">{entry.value} missions</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* CA par client */}
      <Card className="p-5">
        <h2 className="font-semibold text-slate-900 mb-4">Chiffre d'affaires HT par client</h2>
        {caByClient.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-sm">Aucune facture</div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={caByClient} layout="vertical" barSize={18} margin={{ left: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k€`} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} width={110} />
              <Tooltip formatter={(v) => formatCurrency(v)} />
              <Bar dataKey="ca" name="CA HT" fill="#d97706" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </Card>

      {/* Heures par employé */}
      <Card className="p-5">
        <h2 className="font-semibold text-slate-900 mb-1">Heures par employé — mois en cours</h2>
        <p className="text-xs text-slate-400 mb-4">Missions terminées / facturées uniquement</p>
        {hoursByEmployee.every((e) => e.hours === 0) ? (
          <div className="py-8 text-center text-slate-400 text-sm">Aucune heure enregistrée ce mois</div>
        ) : (
          <ResponsiveContainer width="100%" height={Math.max(120, hoursByEmployee.length * 44)}>
            <BarChart data={hoursByEmployee} layout="vertical" barSize={18}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} unit="h" />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} width={80} />
              <Tooltip formatter={(v) => `${v}h`} />
              <Bar dataKey="hours" name="Heures" fill="#6366f1" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </Card>
    </div>
  )
}
