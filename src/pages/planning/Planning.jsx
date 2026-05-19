import { useState, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ChevronLeft, ChevronRight, Plus, Calendar, Users, ExternalLink, Check, X, ArrowRight,
} from 'lucide-react'
import {
  addDays, subDays, addWeeks, subWeeks, addMonths, subMonths,
  startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval,
  format, isSameDay, isSameMonth, isToday,
} from 'date-fns'
import { fr } from 'date-fns/locale'
import { useMissionStore } from '../../store/useMissionStore'
import { useClientStore } from '../../store/useClientStore'
import { useEmployeeStore } from '../../store/useEmployeeStore'
import { useVehicleStore } from '../../store/useVehicleStore'
import { useSettingsStore } from '../../store/useSettingsStore'
import { useTeamStore, teamColorCls } from '../../store/useTeamStore'
import Modal from '../../components/ui/Modal'
import Badge from '../../components/ui/Badge'
import { toast } from '../../store/useToastStore'
import {
  getMissionTypeLabel, getStatusLabel, getStatusBadgeClass,
  formatDate, getInitials,
} from '../../utils/formatters'

// ─── Constants ────────────────────────────────────────────────────────────────

const TYPE_STYLE = {
  ramassage:            { bg: 'bg-amber-100',  border: 'border-amber-300',  dot: 'bg-amber-400',  text: 'text-amber-800'  },
  nettoyage_agricole:   { bg: 'bg-blue-100',   border: 'border-blue-300',   dot: 'bg-blue-400',   text: 'text-blue-800'   },
  nettoyage_industriel: { bg: 'bg-indigo-100', border: 'border-indigo-300', dot: 'bg-indigo-400', text: 'text-indigo-800' },
}
const defaultStyle = { bg: 'bg-slate-100', border: 'border-slate-200', dot: 'bg-slate-400', text: 'text-slate-700' }

const MISSION_TYPES = [
  { value: 'ramassage',            label: '🥚 Ramassage œufs'       },
  { value: 'nettoyage_agricole',   label: '🌿 Nettoyage agricole'   },
  { value: 'nettoyage_industriel', label: '🏭 Nettoyage industriel' },
]

const EMP_COLORS = [
  'bg-[#1a4731]', 'bg-[#d97706]', 'bg-blue-500', 'bg-purple-500',
  'bg-teal-500',  'bg-pink-500',  'bg-rose-500', 'bg-cyan-600',
]
const DAY_LABELS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']

function empColor(index) { return EMP_COLORS[index % EMP_COLORS.length] }

function Avatar({ firstName, lastName, index, size = 'sm' }) {
  const sz = size === 'sm' ? 'w-5 h-5 text-[9px]' : 'w-8 h-8 text-xs'
  return (
    <div className={`${sz} rounded-full ${empColor(index)} flex items-center justify-center text-white font-bold shrink-0`}>
      {getInitials(firstName, lastName)}
    </div>
  )
}

// ─── Mission block ────────────────────────────────────────────────────────────

function MissionBlock({ mission, employees, onClick, compact = false }) {
  const s    = TYPE_STYLE[mission.type] ?? defaultStyle
  const team = (mission.teamIds ?? [])
    .map((tid, i) => ({ emp: employees.find((e) => e.id === tid), index: i }))
    .filter((x) => x.emp)

  if (compact) {
    return (
      <button
        onClick={(e) => { e.stopPropagation(); onClick(mission) }}
        className={`w-full text-left flex items-center gap-1 px-1.5 py-1 rounded-md border ${s.bg} ${s.border} hover:brightness-95 transition-all`}
      >
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${s.dot}`} />
        <span className={`text-[10px] font-semibold truncate flex-1 ${s.text}`}>{mission.clientName ?? '—'}</span>
        {team.slice(0, 2).map(({ emp, index }) => (
          <div key={emp.id} className={`w-3.5 h-3.5 rounded-full ${empColor(index)} shrink-0`} />
        ))}
      </button>
    )
  }

  return (
    <button
      onClick={(e) => { e.stopPropagation(); onClick(mission) }}
      className={`w-full text-left px-2 py-1.5 rounded-lg border ${s.bg} ${s.border} hover:brightness-95 transition-all`}
    >
      <div className="flex items-center gap-1 mb-0.5">
        <span className={`w-2 h-2 rounded-full shrink-0 ${s.dot}`} />
        <span className={`text-[11px] font-bold truncate ${s.text}`}>{getMissionTypeLabel(mission.type).split(' ')[0]}</span>
      </div>
      <p className="text-[10px] text-slate-600 truncate mb-1">{mission.clientName ?? '—'}</p>
      {team.length > 0 && (
        <div className="flex items-center gap-0.5">
          {team.slice(0, 3).map(({ emp, index }) => (
            <Avatar key={emp.id} firstName={emp.firstName} lastName={emp.lastName} index={index} />
          ))}
          {team.length > 3 && <span className="text-[9px] text-slate-400">+{team.length - 3}</span>}
        </div>
      )}
    </button>
  )
}

// ─── Quick-create modal ───────────────────────────────────────────────────────

function QuickCreateModal({ date, clients, employees, vehicles, settings, onSave, onClose, onFullForm, defaultEmpId }) {
  const activeEmployees = employees.filter((e) => e.status === 'actif')
  const teams           = useTeamStore((s) => s.teams)
  const [form, setForm] = useState({
    type: 'ramassage',
    clientId: '',
    startTime: '08:00',
    duration: 2,
    teamIds: defaultEmpId ? [defaultEmpId] : [],
    vehicleId: '',
    instructions: '',
  })
  const [saving, setSaving] = useState(false)
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const toggleEmployee = (id) =>
    set('teamIds', form.teamIds.includes(id) ? form.teamIds.filter((x) => x !== id) : [...form.teamIds, id])

  const handleSave = async () => {
    if (!form.clientId) return
    setSaving(true)
    try {
      const d = new Date(date)
      const [h, m] = form.startTime.split(':').map(Number)
      d.setHours(h, m, 0, 0)
      const client = clients.find((c) => c.id === Number(form.clientId))
      const addr   = client?.address
        ? `${client.address.street ?? ''}, ${client.address.city ?? ''}`.trim().replace(/^,\s*/, '')
        : ''

      await onSave({
        type:         form.type,
        clientId:     Number(form.clientId),
        siteAddress:  addr,
        date:         d.toISOString(),
        duration:     Number(form.duration),
        teamIds:      form.teamIds,
        vehicleId:    form.vehicleId ? Number(form.vehicleId) : null,
        instructions: form.instructions,
        status:       'planifie',
        recurrence:   'aucune',
        travel:       { distanceKm: '', durationMin: '', billable: settings?.travelSettings?.billableByDefault ?? true },
        eggData:      form.type === 'ramassage'
          ? { buildings: 1, estimatedQuantity: 0, realQuantity: null }
          : null,
        cleaningData: form.type !== 'ramassage'
          ? { surface: 0, products: [], checklist: [{ label: 'Pré-rinçage', done: false }, { label: 'Application produit', done: false }, { label: 'Rinçage final', done: false }], photos: [] }
          : null,
        report: null,
      })
    } finally {
      setSaving(false)
    }
  }

  const inputCls = 'w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-white'

  return (
    <Modal
      open
      onClose={onClose}
      title={`Nouvelle mission — ${format(date, 'EEEE d MMMM', { locale: fr })}`}
      size="md"
    >
      <div className="space-y-4">

        {/* Type */}
        <div className="grid grid-cols-3 gap-2">
          {MISSION_TYPES.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => set('type', t.value)}
              className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 text-center transition-all text-xs font-semibold ${
                form.type === t.value
                  ? `border-primary bg-primary/5 text-primary`
                  : 'border-slate-100 text-slate-500 hover:border-slate-200'
              }`}
            >
              <span className="text-xl">{t.label.split(' ')[0]}</span>
              <span className="leading-tight">{t.label.slice(t.label.indexOf(' ') + 1)}</span>
            </button>
          ))}
        </div>

        {/* Client */}
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Client *</label>
          <select required className={inputCls} value={form.clientId} onChange={(e) => set('clientId', e.target.value)}>
            <option value="">Sélectionner un client…</option>
            {clients.filter((c) => c.status === 'actif').map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        {/* Heure + Durée */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Heure de début</label>
            <input type="time" className={inputCls} value={form.startTime} onChange={(e) => set('startTime', e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Durée (h)</label>
            <input type="number" min="0.5" step="0.5" className={inputCls} value={form.duration} onChange={(e) => set('duration', e.target.value)} />
          </div>
        </div>

        {/* Équipes prédéfinies */}
        {teams.length > 0 && (
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-2">Équipes prédéfinies</label>
            <div className="flex flex-wrap gap-2">
              {teams.map((t) => (
                <button key={t.id} type="button"
                  onClick={() => set('teamIds', t.memberIds ?? [])}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-medium transition-all ${
                    JSON.stringify(form.teamIds.slice().sort()) === JSON.stringify((t.memberIds ?? []).slice().sort())
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-slate-200 text-slate-600 hover:border-primary/40'
                  }`}>
                  <span className={`w-2 h-2 rounded-full ${teamColorCls(t.color)}`} />
                  {t.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Équipe */}
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-2">Équipe individuelle</label>
          <div className="flex flex-wrap gap-2">
            {activeEmployees.map((emp, i) => {
              const selected = form.teamIds.includes(emp.id)
              return (
                <button
                  key={emp.id}
                  type="button"
                  onClick={() => toggleEmployee(emp.id)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border-2 text-sm font-medium transition-all ${
                    selected ? 'border-primary bg-primary/5 text-primary' : 'border-slate-100 text-slate-600 hover:border-slate-200'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full ${empColor(i)} flex items-center justify-center text-white text-[9px] font-bold shrink-0`}>
                    {getInitials(emp.firstName, emp.lastName)}
                  </div>
                  {emp.firstName}
                  {selected && <Check size={12} className="text-primary" />}
                </button>
              )
            })}
            {activeEmployees.length === 0 && (
              <p className="text-xs text-slate-400">Aucun employé actif</p>
            )}
          </div>
        </div>

        {/* Véhicule (optionnel) */}
        {vehicles.length > 0 && (
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Véhicule (optionnel)</label>
            <select className={inputCls} value={form.vehicleId} onChange={(e) => set('vehicleId', e.target.value)}>
              <option value="">Aucun</option>
              {vehicles.filter((v) => v.status === 'operationnel').map((v) => (
                <option key={v.id} value={v.id}>{v.name} ({v.plate})</option>
              ))}
            </select>
          </div>
        )}

        {/* Instructions */}
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Instructions (optionnel)</label>
          <textarea
            rows={2}
            className={inputCls}
            value={form.instructions}
            onChange={(e) => set('instructions', e.target.value)}
            placeholder="EPI obligatoire, accès badge…"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!form.clientId || saving}
            className="flex-1 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary-light transition-colors disabled:opacity-40"
          >
            {saving ? 'Création…' : 'Créer la mission'}
          </button>
          <button
            type="button"
            onClick={onFullForm}
            className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-500 hover:bg-slate-50 transition-colors shrink-0"
            title="Ouvrir le formulaire complet"
          >
            <ArrowRight size={14} /> Complet
          </button>
        </div>
      </div>
    </Modal>
  )
}

// ─── Month view ───────────────────────────────────────────────────────────────

function MonthView({ currentDate, missionsWithClient, employees, onMissionClick, onNewMission }) {
  const monthStart = startOfMonth(currentDate)
  const monthEnd   = endOfMonth(currentDate)
  const gridStart  = startOfWeek(monthStart, { weekStartsOn: 1 })
  const gridEnd    = endOfWeek(monthEnd, { weekStartsOn: 1 })
  const allDays    = eachDayOfInterval({ start: gridStart, end: gridEnd })

  const getMissionsForDay = useCallback(
    (day) => missionsWithClient.filter((m) => isSameDay(new Date(m.date), day)),
    [missionsWithClient]
  )

  const [popoverDay, setPopoverDay] = useState(null)
  const popoverMissions = popoverDay ? getMissionsForDay(popoverDay) : []

  return (
    <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
      <div className="grid grid-cols-7 border-b border-slate-100">
        {DAY_LABELS.map((d) => (
          <div key={d} className="py-2 text-center text-xs font-bold text-slate-400 uppercase tracking-wide">{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 divide-x divide-y divide-slate-100">
        {allDays.map((day) => {
          const inMonth  = isSameMonth(day, currentDate)
          const today    = isToday(day)
          const dayMs    = getMissionsForDay(day)
          const overflow = dayMs.length > 3

          return (
            <div
              key={day.toISOString()}
              className={`min-h-[80px] sm:min-h-[110px] p-1 flex flex-col group transition-colors ${
                !inMonth ? 'bg-slate-50/40' : 'hover:bg-primary/[0.02] cursor-pointer'
              }`}
              onClick={() => inMonth && onNewMission(day)}
            >
              <div className="flex items-center justify-between mb-1 px-0.5">
                <span className={`text-xs font-bold leading-none w-6 h-6 flex items-center justify-center rounded-full transition-colors ${
                  today      ? 'bg-primary text-white'
                  : !inMonth ? 'text-slate-300'
                  :            'text-slate-700'
                }`}>
                  {format(day, 'd')}
                </span>
                {inMonth && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onNewMission(day) }}
                    className="w-5 h-5 flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all text-xs"
                    aria-label="Nouvelle mission"
                  >
                    +
                  </button>
                )}
              </div>

              <div className="flex-1 space-y-0.5 overflow-hidden" onClick={(e) => e.stopPropagation()}>
                {dayMs.slice(0, 3).map((m) => (
                  <MissionBlock key={m.id} mission={m} employees={employees} onClick={onMissionClick} compact />
                ))}
                {overflow && (
                  <button
                    onClick={(e) => { e.stopPropagation(); setPopoverDay(day) }}
                    className="w-full text-[10px] text-slate-400 hover:text-primary font-medium px-1 text-left"
                  >
                    +{dayMs.length - 3} autre{dayMs.length - 3 > 1 ? 's' : ''}
                  </button>
                )}
                {dayMs.length === 0 && inMonth && (
                  <div className="flex-1 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity py-2">
                    <span className="text-[10px] text-primary/50">+ mission</span>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Overflow popover */}
      {popoverDay && (
        <Modal open={!!popoverDay} onClose={() => setPopoverDay(null)} title={format(popoverDay, 'EEEE d MMMM', { locale: fr })} size="sm">
          <div className="space-y-2">
            {popoverMissions.map((m) => (
              <button
                key={m.id}
                onClick={() => { setPopoverDay(null); onMissionClick(m) }}
                className={`w-full text-left p-3 rounded-xl border-2 ${TYPE_STYLE[m.type]?.bg ?? 'bg-slate-50'} ${TYPE_STYLE[m.type]?.border ?? 'border-slate-200'} hover:brightness-95 transition-all`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-bold text-sm text-slate-900 truncate">{getMissionTypeLabel(m.type)}</p>
                    <p className="text-xs text-slate-500 truncate">{m.clientName}</p>
                  </div>
                  <Badge className={getStatusBadgeClass(m.status)}>{getStatusLabel(m.status)}</Badge>
                </div>
                {(m.teamIds?.length ?? 0) > 0 && (
                  <div className="flex items-center gap-1 mt-2">
                    {(m.teamIds ?? []).slice(0, 4).map((tid, i) => {
                      const emp = employees.find((e) => e.id === tid)
                      if (!emp) return null
                      return <Avatar key={tid} firstName={emp.firstName} lastName={emp.lastName} index={i} size="sm" />
                    })}
                    {(m.teamIds?.length ?? 0) > 4 && <span className="text-xs text-slate-400">+{m.teamIds.length - 4}</span>}
                  </div>
                )}
              </button>
            ))}
            <button
              onClick={() => { setPopoverDay(null); onNewMission(popoverDay) }}
              className="w-full py-2.5 rounded-xl border-2 border-dashed border-slate-200 text-slate-400 hover:border-primary/40 hover:text-primary transition-colors text-sm font-medium"
            >
              + Nouvelle mission ce jour
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}

// ─── Mission detail popup ─────────────────────────────────────────────────────

function MissionPopup({ mission, employees, onClose, onNavigate }) {
  const update          = useMissionStore((s) => s.update)
  const [assigning, setAssigning] = useState(false)
  const [saving, setSaving]       = useState(false)
  const [teamIds, setTeamIds]     = useState(mission.teamIds ?? [])

  const activeEmployees = employees.filter((e) => e.status === 'actif')
  const toggleEmployee  = (id) =>
    setTeamIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])

  const saveTeam = async () => {
    setSaving(true)
    try { await update(mission.id, { teamIds }); setAssigning(false) }
    finally { setSaving(false) }
  }

  const currentTeam = (mission.teamIds ?? [])
    .map((tid, i) => ({ emp: employees.find((e) => e.id === tid), index: i }))
    .filter((x) => x.emp)

  const s = TYPE_STYLE[mission.type] ?? defaultStyle

  return (
    <div className="space-y-4">
      <div className={`p-4 rounded-2xl border-2 ${s.bg} ${s.border}`}>
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-bold text-slate-900">{getMissionTypeLabel(mission.type)}</p>
            <p className="text-sm text-slate-600">{mission.clientName ?? '—'}</p>
            <p className="text-xs text-slate-400 mt-1">{formatDate(mission.date)} · {mission.duration}h estimées</p>
          </div>
          <Badge className={getStatusBadgeClass(mission.status)}>{getStatusLabel(mission.status)}</Badge>
        </div>
        {mission.siteAddress && <p className="text-xs text-slate-500 mt-2">📍 {mission.siteAddress}</p>}
        {mission.instructions && <p className="text-xs text-slate-500 mt-1 bg-white/60 rounded-lg px-2 py-1">{mission.instructions}</p>}
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Users size={15} className="text-slate-400" /> Équipe
          </p>
          <button
            onClick={() => setAssigning((a) => !a)}
            className={`text-xs font-semibold px-3 py-1.5 rounded-xl transition-colors ${
              assigning ? 'bg-slate-100 text-slate-600' : 'bg-primary/10 text-primary hover:bg-primary/20'
            }`}
          >
            {assigning ? 'Annuler' : 'Modifier'}
          </button>
        </div>

        {!assigning && (
          currentTeam.length === 0
            ? <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl"><span className="text-amber-500">⚠️</span><p className="text-sm text-amber-700">Aucun employé assigné</p></div>
            : <div className="space-y-2">{currentTeam.map(({ emp, index }) => (
                <div key={emp.id} className="flex items-center gap-3 p-2.5 bg-slate-50 rounded-xl">
                  <Avatar firstName={emp.firstName} lastName={emp.lastName} index={index} size="md" />
                  <div><p className="text-sm font-semibold text-slate-900">{emp.firstName} {emp.lastName}</p><p className="text-xs text-slate-400 capitalize">{emp.role}</p></div>
                </div>
              ))}</div>
        )}

        {assigning && (
          <div className="space-y-2">
            {activeEmployees.map((emp, index) => {
              const selected = teamIds.includes(emp.id)
              return (
                <button key={emp.id} onClick={() => toggleEmployee(emp.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${selected ? 'border-primary bg-primary/5' : 'border-slate-100 bg-white hover:border-slate-200'}`}>
                  <Avatar firstName={emp.firstName} lastName={emp.lastName} index={index} size="md" />
                  <div className="flex-1 min-w-0"><p className="text-sm font-semibold text-slate-900">{emp.firstName} {emp.lastName}</p><p className="text-xs text-slate-400 capitalize">{emp.role}</p></div>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selected ? 'bg-primary border-primary' : 'border-slate-300'}`}>
                    {selected && <Check size={12} className="text-white" />}
                  </div>
                </button>
              )
            })}
            <button onClick={saveTeam} disabled={saving}
              className="w-full py-3 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary-light disabled:opacity-50 mt-2">
              {saving ? 'Enregistrement…' : `Assigner ${teamIds.length} employé${teamIds.length > 1 ? 's' : ''}`}
            </button>
          </div>
        )}
      </div>

      <button onClick={onNavigate}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
        <ExternalLink size={15} /> Voir la mission complète
      </button>
    </div>
  )
}

// ─── Team swimlane view ───────────────────────────────────────────────────────

function TeamView({ weekDays, missionsWithClient, employees, onMissionClick, onNewMission }) {
  const active = employees.filter((e) => e.status === 'actif')

  return (
    <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
      <div className="min-w-[640px] bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 overflow-hidden">
        {/* Header row: days */}
        <div className="grid border-b border-slate-100 dark:border-slate-700" style={{ gridTemplateColumns: '120px repeat(7, 1fr)' }}>
          <div className="p-2 text-xs font-bold text-slate-400 uppercase">Employé</div>
          {weekDays.map((day) => (
            <div key={day.toISOString()} className={`p-2 text-center border-l border-slate-100 dark:border-slate-700 ${isToday(day) ? 'bg-primary/5' : ''}`}>
              <p className="text-[10px] font-bold uppercase text-slate-400">{format(day, 'EEE', { locale: fr })}</p>
              <p className={`text-sm font-black leading-tight ${isToday(day) ? 'text-primary' : 'text-slate-700 dark:text-slate-200'}`}>{format(day, 'd')}</p>
            </div>
          ))}
        </div>

        {/* Employee rows */}
        {active.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-sm">Aucun employé actif</div>
        ) : (
          active.map((emp, empIdx) => (
            <div key={emp.id} className="grid border-t border-slate-100 dark:border-slate-700" style={{ gridTemplateColumns: '120px repeat(7, 1fr)' }}>
              {/* Employee label */}
              <div className="p-2 flex items-center gap-2 border-r border-slate-100 dark:border-slate-700">
                <div className={`w-7 h-7 rounded-full ${empColor(empIdx)} flex items-center justify-center text-white text-[10px] font-bold shrink-0`}>
                  {getInitials(emp.firstName, emp.lastName)}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">{emp.firstName}</p>
                  <p className="text-[10px] text-slate-400 truncate capitalize">{emp.role}</p>
                </div>
              </div>

              {/* Day cells */}
              {weekDays.map((day) => {
                const dayMs = missionsWithClient.filter((m) =>
                  isSameDay(new Date(m.date), day) && (m.teamIds ?? []).includes(emp.id)
                )
                return (
                  <div
                    key={day.toISOString()}
                    className={`p-1 min-h-[56px] border-l border-slate-100 dark:border-slate-700 cursor-pointer transition-colors ${
                      isToday(day) ? 'bg-primary/[0.03]' : 'hover:bg-primary/[0.02]'
                    } group`}
                    onClick={() => onNewMission(day, emp.id)}
                  >
                    <div onClick={(e) => e.stopPropagation()} className="space-y-0.5">
                      {dayMs.map((m) => (
                        <MissionBlock key={m.id} mission={m} employees={employees} onClick={onMissionClick} compact />
                      ))}
                    </div>
                    {dayMs.length === 0 && (
                      <div className="h-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-[9px] text-primary/50">+</span>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          ))
        )}
      </div>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function Planning() {
  const addMission   = useMissionStore((s) => s.add)
  const missions     = useMissionStore((s) => s.missions)
  const clients      = useClientStore((s) => s.clients)
  const employees    = useEmployeeStore((s) => s.employees)
  const vehicles     = useVehicleStore((s) => s.vehicles)
  const settings     = useSettingsStore((s) => s.settings)
  const navigate     = useNavigate()

  const [currentDate,      setCurrentDate]      = useState(new Date())
  const [view,             setView]             = useState('month')
  const [filter,           setFilter]           = useState('all')
  const [selectedMission,  setSelectedMission]  = useState(null)
  const [createDraft,      setCreateDraft]      = useState(null) // { date: Date, empId?: number }

  const missionsWithClient = useMemo(() =>
    missions
      .filter((m) => filter === 'all' || m.type === filter || (filter === 'nettoyage' && m.type.startsWith('nettoyage')))
      .map((m) => ({ ...m, clientName: clients.find((c) => c.id === m.clientId)?.name ?? '—' })),
    [missions, clients, filter]
  )

  const prev = () => {
    if (view === 'day')              setCurrentDate((d) => subDays(d, 1))
    if (view === 'week')             setCurrentDate((d) => subWeeks(d, 1))
    if (view === 'month')            setCurrentDate((d) => subMonths(d, 1))
    if (view === 'team')             setCurrentDate((d) => subWeeks(d, 1))
  }
  const next = () => {
    if (view === 'day')              setCurrentDate((d) => addDays(d, 1))
    if (view === 'week')             setCurrentDate((d) => addWeeks(d, 1))
    if (view === 'month')            setCurrentDate((d) => addMonths(d, 1))
    if (view === 'team')             setCurrentDate((d) => addWeeks(d, 1))
  }

  const weekRangeLabel = (() => {
    const ws = startOfWeek(currentDate, { weekStartsOn: 1 })
    const we = endOfWeek(currentDate, { weekStartsOn: 1 })
    return `${format(ws, 'd MMM', { locale: fr })} – ${format(we, 'd MMM yyyy', { locale: fr })}`
  })()

  const navLabel = {
    day:   format(currentDate, 'EEEE d MMMM yyyy', { locale: fr }),
    week:  weekRangeLabel,
    month: format(currentDate, 'MMMM yyyy', { locale: fr }),
    team:  weekRangeLabel,
  }[view]

  const getMissionsForDay = (day) => missionsWithClient.filter((m) => isSameDay(new Date(m.date), day))

  const openCreate = (date, empId) => setCreateDraft({ date, empId })

  const handleQuickSave = async (data) => {
    await addMission(data)
    setCreateDraft(null)
    toast.success('Mission créée')
  }

  const goFullForm = () => {
    const dateStr = createDraft?.date ? format(createDraft.date, 'yyyy-MM-dd') : ''
    setCreateDraft(null)
    navigate(dateStr ? `/missions/new?date=${dateStr}` : '/missions/new')
  }

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 })
  const weekDays  = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
  const dayMissions = getMissionsForDay(currentDate)

  return (
    <div className="space-y-4">

      {/* ── Controls ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <button onClick={prev} className="p-2 rounded-xl hover:bg-slate-100 transition-colors shrink-0" aria-label="Précédent"><ChevronLeft size={20} className="text-slate-600" /></button>
          <span className="text-sm font-bold text-slate-800 flex-1 text-center capitalize truncate">{navLabel}</span>
          <button onClick={next} className="p-2 rounded-xl hover:bg-slate-100 transition-colors shrink-0" aria-label="Suivant"><ChevronRight size={20} className="text-slate-600" /></button>
          <button onClick={() => setCurrentDate(new Date())} className="px-3 py-1.5 text-xs font-bold text-primary bg-primary/10 rounded-xl hover:bg-primary/20 transition-colors shrink-0">Auj.</button>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex rounded-xl border border-slate-200 bg-white overflow-hidden">
            {['day', 'week', 'month', 'team'].map((v) => (
              <button key={v} onClick={() => setView(v)}
                className={`px-3 py-2 text-xs font-bold transition-colors ${ view === v ? 'bg-primary text-white' : 'text-slate-500 hover:bg-slate-50'}`}>
                {{ day: 'Jour', week: 'Sem.', month: 'Mois', team: 'Équipe' }[v]}
              </button>
            ))}
          </div>
          <select value={filter} onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-white focus:outline-none focus:ring-2 focus:ring-primary/30">
            <option value="all">Tous types</option>
            <option value="ramassage">Ramassage</option>
            <option value="nettoyage">Nettoyage</option>
          </select>
          <button onClick={() => openCreate(currentDate)}
            className="flex items-center gap-1.5 px-3 py-2 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary-light transition-colors min-h-[40px]">
            <Plus size={16} /><span className="hidden sm:inline">Mission</span>
          </button>
        </div>
      </div>

      {/* ── Team legend ───────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2">
        {employees.filter((e) => e.status === 'actif').map((emp, i) => (
          <div key={emp.id} className="flex items-center gap-1.5 text-xs text-slate-600 bg-white border border-slate-100 rounded-full px-2.5 py-1">
            <div className={`w-3 h-3 rounded-full ${empColor(i)}`} />
            {emp.firstName} {emp.lastName[0]}.
          </div>
        ))}
        <div className="flex items-center gap-3 ml-auto">
          {[['bg-amber-400','Ramassage'],['bg-blue-400','Nett. agri.'],['bg-indigo-400','Nett. indus.']].map(([dot, label]) => (
            <span key={label} className="flex items-center gap-1 text-[11px] text-slate-400">
              <span className={`w-2 h-2 rounded-sm ${dot}`} />{label}
            </span>
          ))}
        </div>
      </div>

      {/* ── Team swimlane ────────────────────────────────────────────────── */}
      {view === 'team' && (
        <TeamView
          weekDays={weekDays}
          missionsWithClient={missionsWithClient}
          employees={employees}
          onMissionClick={setSelectedMission}
          onNewMission={openCreate}
        />
      )}

      {/* ── Month view ────────────────────────────────────────────────────── */}
      {view === 'month' && (
        <MonthView
          currentDate={currentDate}
          missionsWithClient={missionsWithClient}
          employees={employees}
          onMissionClick={setSelectedMission}
          onNewMission={openCreate}
        />
      )}

      {/* ── Week view ─────────────────────────────────────────────────────── */}
      {view === 'week' && (
        <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
          <div className="grid grid-cols-7 gap-1.5 min-w-[560px]">
            {weekDays.map((day) => {
              const dayMs = getMissionsForDay(day)
              const today = isToday(day)
              return (
                <div key={day.toISOString()}>
                  <div className={`text-center py-2 rounded-xl mb-1 ${today ? 'bg-primary text-white' : 'bg-slate-100 text-slate-600'}`}>
                    <p className="text-[10px] font-bold uppercase">{format(day, 'EEE', { locale: fr })}</p>
                    <p className={`text-base font-black leading-tight ${today ? 'text-white' : 'text-slate-900'}`}>{format(day, 'd')}</p>
                  </div>
                  <div
                    className="min-h-[120px] bg-white border border-slate-100 rounded-xl p-1.5 space-y-1 cursor-pointer hover:border-primary/20 hover:bg-primary/[0.015] transition-colors group"
                    onClick={() => openCreate(day)}
                  >
                    {dayMs.map((m) => (
                      <MissionBlock key={m.id} mission={m} employees={employees} onClick={setSelectedMission} />
                    ))}
                    <div className="flex items-center justify-center py-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-[10px] text-primary/60 flex items-center gap-0.5"><Plus size={10} /> mission</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Day view ──────────────────────────────────────────────────────── */}
      {view === 'day' && (
        <div className="space-y-3">
          {dayMissions.length === 0 ? (
            <div
              className="bg-white rounded-2xl border-2 border-dashed border-slate-200 p-12 text-center cursor-pointer hover:border-primary/40 hover:bg-primary/[0.015] transition-all group"
              onClick={() => openCreate(currentDate)}
            >
              <Calendar size={36} className="mx-auto text-slate-200 group-hover:text-primary/30 mb-3 transition-colors" />
              <p className="text-slate-400 font-medium">Aucune mission ce jour</p>
              <p className="text-sm text-primary/60 mt-2 font-medium">Cliquer pour planifier une mission</p>
            </div>
          ) : (
            <>
              {dayMissions.map((m) => {
                const s    = TYPE_STYLE[m.type] ?? defaultStyle
                const team = (m.teamIds ?? []).map((tid, i) => ({ emp: employees.find((e) => e.id === tid), index: i })).filter((x) => x.emp)
                return (
                  <button key={m.id} onClick={() => setSelectedMission(m)}
                    className={`w-full text-left p-4 rounded-2xl border-2 ${s.bg} ${s.border} hover:brightness-95 transition-all`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-bold text-slate-900">{getMissionTypeLabel(m.type)}</p>
                        <p className="text-sm text-slate-600 truncate">{m.clientName}</p>
                        <p className="text-xs text-slate-500 mt-1">{format(new Date(m.date), 'HH:mm')} · {m.duration}h</p>
                      </div>
                      <Badge className={getStatusBadgeClass(m.status)}>{getStatusLabel(m.status)}</Badge>
                    </div>
                    {team.length > 0
                      ? <div className="flex items-center gap-1.5 mt-3">{team.map(({ emp, index }) => <Avatar key={emp.id} firstName={emp.firstName} lastName={emp.lastName} index={index} size="md" />)}</div>
                      : <p className="mt-2 text-xs text-amber-600 bg-amber-100 rounded-lg px-2 py-1 w-fit">⚠️ Aucune équipe assignée</p>
                    }
                  </button>
                )
              })}
              <button onClick={() => openCreate(currentDate)}
                className="w-full py-3 rounded-2xl border-2 border-dashed border-slate-200 text-slate-400 hover:border-primary/40 hover:text-primary transition-colors text-sm font-medium flex items-center justify-center gap-2">
                <Plus size={15} /> Ajouter une mission ce jour
              </button>
            </>
          )}

          {/* Week mini strip */}
          <div className="bg-white rounded-2xl border border-slate-100 p-3">
            <div className="grid grid-cols-7 gap-1">
              {weekDays.map((day) => {
                const count  = getMissionsForDay(day).length
                const active = isSameDay(day, currentDate)
                const today  = isToday(day)
                return (
                  <button key={day.toISOString()} onClick={() => setCurrentDate(day)}
                    className={`flex flex-col items-center py-2 px-1 rounded-xl transition-colors ${ active ? 'bg-primary text-white' : today ? 'bg-primary/10 text-primary' : 'hover:bg-slate-50 text-slate-600'}`}>
                    <span className="text-[9px] font-bold uppercase opacity-70">{format(day, 'EEE', { locale: fr }).slice(0, 2)}</span>
                    <span className="text-sm font-black leading-tight">{format(day, 'd')}</span>
                    {count > 0 && <div className={`w-1.5 h-1.5 rounded-full mt-0.5 ${active ? 'bg-white/60' : 'bg-primary'}`} />}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── Mission popup ─────────────────────────────────────────────────── */}
      {selectedMission && (
        <Modal open={!!selectedMission} onClose={() => setSelectedMission(null)} title={getMissionTypeLabel(selectedMission.type)} size="sm">
          <MissionPopup
            mission={selectedMission}
            employees={employees}
            onClose={() => setSelectedMission(null)}
            onNavigate={() => { navigate(`/missions/${selectedMission.id}`); setSelectedMission(null) }}
          />
        </Modal>
      )}

      {/* ── Quick create modal ────────────────────────────────────────────── */}
      {createDraft && (
        <QuickCreateModal
          date={createDraft.date}
          defaultEmpId={createDraft.empId}
          clients={clients}
          employees={employees}
          vehicles={vehicles}
          settings={settings}
          onSave={handleQuickSave}
          onClose={() => setCreateDraft(null)}
          onFullForm={goFullForm}
        />
      )}
    </div>
  )
}
