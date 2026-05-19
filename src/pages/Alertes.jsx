import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { differenceInDays } from 'date-fns'
import {
  AlertTriangle, Truck, Euro, ClipboardList, CheckCircle,
  ChevronRight, Users, Check, X, ExternalLink,
} from 'lucide-react'
import { useInvoiceStore } from '../store/useInvoiceStore'
import { useMissionStore } from '../store/useMissionStore'
import { useClientStore } from '../store/useClientStore'
import { useVehicleStore } from '../store/useVehicleStore'
import { useEmployeeStore } from '../store/useEmployeeStore'
import { useTeamStore, teamColorCls } from '../store/useTeamStore'
import Card from '../components/ui/Card'
import { formatCurrency, formatDate, getMissionTypeLabel, getInitials } from '../utils/formatters'
import { toast } from '../store/useToastStore'

// ── Couleurs par niveau ───────────────────────────────────────────────────────

const COLORS = {
  red:   { header: 'text-red-700 bg-red-50 border-red-100',     dot: 'bg-red-500',   badge: 'bg-red-100 text-red-700'    },
  amber: { header: 'text-amber-700 bg-amber-50 border-amber-100', dot: 'bg-amber-400', badge: 'bg-amber-100 text-amber-700' },
}

const EMP_COLORS = [
  'bg-[#1a4731]', 'bg-[#d97706]', 'bg-blue-500', 'bg-purple-500',
  'bg-teal-500',  'bg-pink-500',  'bg-rose-500', 'bg-cyan-600',
]

// ── Modal assignation rapide ──────────────────────────────────────────────────

function QuickAssignModal({ mission, clientName, onClose }) {
  const employees   = useEmployeeStore((s) => s.employees)
  const teams       = useTeamStore((s) => s.teams)
  const update      = useMissionStore((s) => s.update)
  const [selected, setSelected] = useState(mission.teamIds ?? [])
  const [saving,   setSaving]   = useState(false)

  const active = employees.filter((e) => e.status === 'actif')

  const toggle = (id) =>
    setSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])

  const handleSave = async () => {
    if (!selected.length) return
    setSaving(true)
    try {
      await update(mission.id, { teamIds: selected })
      toast.success(`Équipe assignée — ${selected.length} employé${selected.length > 1 ? 's' : ''}`)
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-slate-800 rounded-t-2xl sm:rounded-2xl shadow-xl w-full max-w-md flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-700 shrink-0">
          <div className="min-w-0">
            <p className="font-semibold text-slate-900 dark:text-white text-sm">Assigner une équipe</p>
            <p className="text-xs text-slate-500 truncate mt-0.5">
              {getMissionTypeLabel(mission.type)} · {clientName} · {formatDate(mission.date)}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 ml-3 shrink-0">
            <X size={16} />
          </button>
        </div>

        {/* Équipes prédéfinies */}
        {teams.length > 0 && (
          <div className="px-4 pt-3 pb-2 border-b border-slate-100 dark:border-slate-700">
            <p className="text-xs font-medium text-slate-500 mb-2">Équipes prédéfinies</p>
            <div className="flex flex-wrap gap-2">
              {teams.map((t) => (
                <button key={t.id} type="button"
                  onClick={() => setSelected(t.memberIds ?? [])}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
                    JSON.stringify(selected.slice().sort()) === JSON.stringify((t.memberIds ?? []).slice().sort())
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-primary/40'
                  }`}>
                  <span className={`w-2 h-2 rounded-full ${teamColorCls(t.color)}`} />
                  {t.name}
                  <span className="opacity-60">({(t.memberIds ?? []).length})</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Employee list */}
        <div className="overflow-y-auto flex-1 p-4 space-y-2">
          {active.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">Aucun employé actif disponible</p>
          ) : (
            active.map((emp, idx) => {
              const sel = selected.includes(emp.id)
              return (
                <button
                  key={emp.id}
                  onClick={() => toggle(emp.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all ${
                    sel
                      ? 'border-primary bg-primary/5 dark:bg-primary/10'
                      : 'border-slate-100 dark:border-slate-700 hover:border-slate-200 dark:hover:border-slate-600'
                  }`}
                >
                  <div className={`w-9 h-9 rounded-full ${EMP_COLORS[idx % EMP_COLORS.length]} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
                    {getInitials(emp.firstName, emp.lastName)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">{emp.firstName} {emp.lastName}</p>
                    <p className="text-xs text-slate-400 capitalize">{emp.role}</p>
                    {emp.licenses?.length > 0 && (
                      <div className="flex gap-1 mt-1">
                        {emp.licenses.map((l) => (
                          <span key={l} className="text-[10px] bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 px-1.5 py-0.5 rounded font-medium">{l}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                    sel ? 'bg-primary border-primary' : 'border-slate-300 dark:border-slate-600'
                  }`}>
                    {sel && <Check size={12} className="text-white" />}
                  </div>
                </button>
              )
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-4 border-t border-slate-100 dark:border-slate-700 shrink-0 space-y-2">
          <button
            onClick={handleSave}
            disabled={!selected.length || saving}
            className="w-full py-3 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary-light transition-colors disabled:opacity-40"
          >
            {saving ? 'Enregistrement…' : selected.length ? `Assigner ${selected.length} employé${selected.length > 1 ? 's' : ''}` : 'Sélectionner des employés'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Groupe d'alertes générique ────────────────────────────────────────────────

function AlertGroup({ title, icon: Icon, color, items, emptyMsg }) {
  const c = COLORS[color] ?? COLORS.amber

  return (
    <div className="space-y-2">
      <div className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border ${c.header}`}>
        <Icon size={16} className="shrink-0" />
        <span className="font-semibold text-sm flex-1">{title}</span>
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${c.badge}`}>{items.length}</span>
      </div>

      {items.length === 0 ? (
        <div className="flex items-center gap-2 px-4 py-3 text-sm text-slate-400">
          <CheckCircle size={15} className="text-green-400" /> {emptyMsg}
        </div>
      ) : (
        <div className="space-y-1.5">
          {items.map((item, i) => (
            <button key={i} onClick={item.onClick}
              className="w-full flex items-center gap-3 px-4 py-3 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl hover:border-slate-200 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all text-left">
              <div className={`w-2 h-2 rounded-full shrink-0 ${c.dot}`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{item.title}</p>
                {item.sub && <p className="text-xs text-slate-500 truncate">{item.sub}</p>}
              </div>
              {item.badge && (
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full shrink-0 ${c.badge}`}>{item.badge}</span>
              )}
              <ChevronRight size={14} className="text-slate-300 shrink-0" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Groupe spécial : missions sans équipe ─────────────────────────────────────

function MissionTeamGroup({ missions: rawMissions, clients }) {
  const navigate   = useNavigate()
  const [assignModal, setAssignModal] = useState(null)

  const getClientName = (id) => clients.find((c) => c.id === id)?.name ?? '—'
  const c = COLORS.amber

  if (rawMissions.length === 0) {
    return (
      <div className="space-y-2">
        <div className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border ${c.header}`}>
          <ClipboardList size={16} className="shrink-0" />
          <span className="font-semibold text-sm flex-1">Missions sans équipe</span>
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${c.badge}`}>0</span>
        </div>
        <div className="flex items-center gap-2 px-4 py-3 text-sm text-slate-400">
          <CheckCircle size={15} className="text-green-400" /> Toutes les missions ont une équipe
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-2">
        <div className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border ${c.header}`}>
          <ClipboardList size={16} className="shrink-0" />
          <span className="font-semibold text-sm flex-1">Missions sans équipe</span>
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${c.badge}`}>{rawMissions.length}</span>
        </div>

        <div className="space-y-1.5">
          {rawMissions.map((m) => (
            <div key={m.id} className="flex items-center gap-2 px-3 py-2.5 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl">
              <div className={`w-2 h-2 rounded-full shrink-0 ${c.dot}`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                  {getMissionTypeLabel(m.type)} — {getClientName(m.clientId)}
                </p>
                <p className="text-xs text-slate-500">Prévue le {formatDate(m.date)}</p>
              </div>

              {/* Quick assign */}
              <button
                onClick={() => setAssignModal(m)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary-light transition-colors shrink-0"
              >
                <Users size={12} /> Assigner
              </button>

              {/* Navigate to full detail */}
              <button
                onClick={() => navigate(`/missions/${m.id}`)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors shrink-0"
                aria-label="Voir la mission"
              >
                <ExternalLink size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {assignModal && (
        <QuickAssignModal
          mission={assignModal}
          clientName={getClientName(assignModal.clientId)}
          onClose={() => setAssignModal(null)}
        />
      )}
    </>
  )
}

// ── Page principale ───────────────────────────────────────────────────────────

export default function Alertes() {
  const navigate  = useNavigate()
  const invoices  = useInvoiceStore((s) => s.invoices)
  const missions  = useMissionStore((s) => s.missions)
  const clients   = useClientStore((s) => s.clients)
  const vehicles  = useVehicleStore((s) => s.vehicles)
  const equipment = useVehicleStore((s) => s.equipment)

  const getClientName = (id) => clients.find((c) => c.id === id)?.name ?? '—'
  const now = new Date()

  const lateInvoices = useMemo(() =>
    invoices.filter((i) => (i.status === 'emise' || i.status === 'en_attente') && i.dueDate && new Date(i.dueDate) < now)
      .map((i) => {
        const days = differenceInDays(now, new Date(i.dueDate))
        const ht   = (i.lines ?? []).reduce((s, l) => s + (l.total ?? 0), 0)
        return { title: `${i.number} — ${getClientName(i.clientId)}`, sub: `${formatCurrency(ht)} HT · ${days}j de retard`, badge: `+${days}j`, onClick: () => navigate(`/invoicing/${i.id}`) }
      }).sort((a, b) => parseInt(b.badge) - parseInt(a.badge)),
    [invoices, clients])

  const relances = useMemo(() =>
    invoices.filter((i) => i.status === 'relance1' || i.status === 'relance2')
      .map((i) => {
        const ht = (i.lines ?? []).reduce((s, l) => s + (l.total ?? 0), 0)
        return { title: `${i.number} — ${getClientName(i.clientId)}`, sub: `${formatCurrency(ht)} HT · ${i.status === 'relance1' ? 'Relance 1' : 'Relance 2 — action requise'}`, badge: i.status === 'relance2' ? 'Urgent' : undefined, onClick: () => navigate(`/invoicing/${i.id}`) }
      }),
    [invoices, clients])

  const missionsWithoutTeam = useMemo(() =>
    missions.filter((m) => m.status === 'planifie' && (!m.teamIds || m.teamIds.length === 0)),
    [missions])

  const ctAlerts = useMemo(() =>
    vehicles.filter((v) => v.nextCt && differenceInDays(new Date(v.nextCt), now) <= 60)
      .map((v) => {
        const days = differenceInDays(new Date(v.nextCt), now)
        return { title: `${v.name} (${v.plate})`, sub: days < 0 ? `CT expiré depuis ${Math.abs(days)}j` : `CT dans ${days}j — ${formatDate(v.nextCt)}`, badge: days < 0 ? 'Expiré' : days <= 14 ? 'Urgent' : `${days}j`, onClick: () => navigate('/fleet') }
      }),
    [vehicles])

  const serviceAlerts = useMemo(() =>
    vehicles.filter((v) => v.nextService && differenceInDays(new Date(v.nextService), now) <= 30)
      .map((v) => {
        const days = differenceInDays(new Date(v.nextService), now)
        return { title: `${v.name} — révision`, sub: days < 0 ? `Révision en retard de ${Math.abs(days)}j` : `Révision dans ${days}j`, badge: days < 0 ? 'En retard' : `${days}j`, onClick: () => navigate('/fleet') }
      }),
    [vehicles])

  const equipmentAlerts = useMemo(() =>
    equipment.filter((e) => e.status === 'maintenance' || e.status === 'panne')
      .map((e) => ({ title: e.name, sub: e.status === 'maintenance' ? 'En maintenance' : 'En panne', badge: e.status === 'panne' ? 'Panne' : undefined, onClick: () => navigate('/fleet') })),
    [equipment])

  const total = lateInvoices.length + relances.length + missionsWithoutTeam.length + ctAlerts.length + serviceAlerts.length + equipmentAlerts.length

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Centre d'alertes</h1>
          <p className="text-xs text-slate-400 mt-0.5">{total === 0 ? 'Tout est en ordre' : `${total} point${total > 1 ? 's' : ''} à traiter`}</p>
        </div>
        {total > 0 && <span className="ml-auto px-3 py-1 bg-red-100 text-red-700 text-sm font-bold rounded-full">{total}</span>}
      </div>

      {total === 0 && (
        <Card className="p-10 text-center">
          <CheckCircle size={40} className="mx-auto text-green-400 mb-3" />
          <p className="font-semibold text-slate-700 dark:text-slate-200">Aucune alerte active</p>
          <p className="text-sm text-slate-400 mt-1">Tout est en ordre, continuez comme ça !</p>
        </Card>
      )}

      <AlertGroup title="Factures en retard"     icon={Euro}          color="red"   items={lateInvoices}    emptyMsg="Aucune facture en retard" />
      <AlertGroup title="Factures en relance"     icon={AlertTriangle} color="amber" items={relances}        emptyMsg="Aucune relance en cours" />

      {/* Section spéciale avec assignation rapide */}
      <MissionTeamGroup missions={missionsWithoutTeam} clients={clients} />

      <AlertGroup title="Contrôles techniques"   icon={Truck}         color="red"   items={ctAlerts}        emptyMsg="Tous les CT sont à jour" />
      <AlertGroup title="Révisions à planifier"  icon={Truck}         color="amber" items={serviceAlerts}   emptyMsg="Aucune révision imminente" />
      <AlertGroup title="Équipements hors service" icon={AlertTriangle} color="amber" items={equipmentAlerts} emptyMsg="Tous les équipements sont opérationnels" />
    </div>
  )
}
