import { useMemo, useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  LogOut, Clock, CheckCircle, Circle, MapPin, Phone,
  ChevronLeft, ChevronRight, Flag, X, Pen, MessageSquare, ArrowLeft,
} from 'lucide-react'
import {
  isToday, isTomorrow, addDays, subDays, startOfWeek,
  startOfMonth, endOfMonth, isWithinInterval, format, isSameDay,
} from 'date-fns'
import { fr } from 'date-fns/locale'
import { useAuthStore } from '../../store/useAuthStore'
import { useMissionStore } from '../../store/useMissionStore'
import { useClientStore } from '../../store/useClientStore'
import { useEmployeeStore } from '../../store/useEmployeeStore'
import { useMessagingStore } from '../../store/useMessagingStore'
import { useTeamStore, teamColorCls } from '../../store/useTeamStore'
import { supabase } from '../../lib/supabase'
import { getMissionTypeLabel, getStatusLabel, getStatusBadgeClass, getInitials } from '../../utils/formatters'
import Badge from '../../components/ui/Badge'
import ChatPanel from '../../components/messaging/ChatPanel'
import NotifPrompt from '../../components/ui/NotifPrompt'
import { toast } from '../../store/useToastStore'

const TYPE_BG   = { ramassage: 'bg-amber-50 border-amber-200', nettoyage_agricole: 'bg-blue-50 border-blue-200', nettoyage_industriel: 'bg-indigo-50 border-indigo-200' }
const TYPE_ICON = { ramassage: '🥚', nettoyage_agricole: '🌿', nettoyage_industriel: '🏭' }

// ── Signature pad ─────────────────────────────────────────────────────────────
function SignaturePad({ onChange }) {
  const canvasRef    = useRef(null)
  const drawing      = useRef(false)
  const [hasSig, setHasSig] = useState(false)

  const getPos = (e) => {
    const canvas = canvasRef.current
    const rect   = canvas.getBoundingClientRect()
    const src    = e.touches ? e.touches[0] : e
    return {
      x: (src.clientX - rect.left) * (canvas.width / rect.width),
      y: (src.clientY - rect.top)  * (canvas.height / rect.height),
    }
  }

  const start = (e) => {
    e.preventDefault()
    drawing.current = true
    const ctx = canvasRef.current.getContext('2d')
    const { x, y } = getPos(e)
    ctx.beginPath(); ctx.moveTo(x, y)
  }

  const move = (e) => {
    if (!drawing.current) return
    e.preventDefault()
    const ctx = canvasRef.current.getContext('2d')
    ctx.lineWidth = 2.5; ctx.lineCap = 'round'; ctx.lineJoin = 'round'
    ctx.strokeStyle = '#1a4731'
    const { x, y } = getPos(e)
    ctx.lineTo(x, y); ctx.stroke()
    setHasSig(true)
  }

  const stop = () => {
    if (!drawing.current) return
    drawing.current = false
    onChange(canvasRef.current.toDataURL('image/png'))
  }

  const clear = () => {
    const c = canvasRef.current
    c.getContext('2d').clearRect(0, 0, c.width, c.height)
    setHasSig(false); onChange(null)
  }

  return (
    <div>
      <div className="border-2 border-dashed border-slate-200 rounded-2xl overflow-hidden bg-slate-50">
        <canvas
          ref={canvasRef} width={600} height={180}
          className="w-full touch-none cursor-crosshair"
          style={{ touchAction: 'none' }}
          onMouseDown={start} onMouseMove={move} onMouseUp={stop} onMouseLeave={stop}
          onTouchStart={start} onTouchMove={move} onTouchEnd={stop}
        />
      </div>
      <div className="flex items-center justify-between mt-1">
        <p className="text-xs text-slate-400 flex items-center gap-1"><Pen size={11} /> Signez avec votre doigt</p>
        {hasSig && <button type="button" onClick={clear} className="text-xs text-red-400 hover:text-red-600">Effacer</button>}
      </div>
    </div>
  )
}

// ── Cloture modal ─────────────────────────────────────────────────────────────
function ClotureModal({ mission, onClose, onSave }) {
  const [realDuration, setRealDuration] = useState(mission.duration ?? 2)
  const [notes, setNotes]               = useState('')
  const [signature, setSignature]       = useState(null)
  const [saving, setSaving]             = useState(false)
  const inputCls = 'w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary'

  const handleSave = async () => {
    setSaving(true)
    try {
      await onSave({ realDuration: Number(realDuration), notes, signature })
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <p className="font-bold text-slate-900">Clôturer la mission</p>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600"><X size={16} /></button>
        </div>
        <div className="px-5 pb-6 space-y-4">
          <div className="p-3 bg-slate-50 rounded-2xl text-sm text-slate-700">
            <p className="font-semibold">{getMissionTypeLabel(mission.type)}</p>
            <p className="text-slate-500 text-xs mt-0.5">{format(new Date(mission.date), 'EEEE d MMMM · HH:mm', { locale: fr })}</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Durée réelle (heures)</label>
            <input type="number" min="0" step="0.5" className={inputCls} value={realDuration}
              onChange={(e) => setRealDuration(e.target.value)} />
            <p className="text-xs text-slate-400 mt-1">Durée estimée : {mission.duration}h</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Notes / observations (optionnel)</label>
            <textarea rows={2} className={inputCls} value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Incident, remarque, quantité réelle…" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-2">Signature</label>
            <SignaturePad onChange={setSignature} />
          </div>
          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 py-3 rounded-2xl border-2 border-slate-200 text-slate-700 font-semibold text-sm hover:bg-slate-50">
              Annuler
            </button>
            <button onClick={handleSave} disabled={saving}
              className="flex-1 py-3 rounded-2xl bg-green-500 text-white font-semibold text-sm hover:bg-green-600 disabled:opacity-40">
              {saving ? 'Enregistrement…' : '✓ Clôturer'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Mission card ──────────────────────────────────────────────────────────────
function MissionCard({ mission, client, size = 'md', onCloture, allEmployees = [] }) {
  const bg = TYPE_BG[mission.type] ?? 'bg-slate-50 border-slate-200'
  const canClose = mission.status === 'en_cours' || mission.status === 'planifie'

  if (size === 'lg') {
    return (
      <div className={`p-4 rounded-2xl border-2 ${bg}`}>
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{TYPE_ICON[mission.type] ?? '📋'}</span>
            <div>
              <p className="font-bold text-slate-900">{getMissionTypeLabel(mission.type)}</p>
              <p className="text-sm text-slate-600 font-medium">{client?.name ?? '—'}</p>
            </div>
          </div>
          <Badge className={getStatusBadgeClass(mission.status)}>{getStatusLabel(mission.status)}</Badge>
        </div>

        <div className="space-y-1.5 text-sm text-slate-600">
          <div className="flex items-center gap-2">
            <Clock size={14} className="shrink-0 text-slate-400" />
            {format(new Date(mission.date), 'HH:mm')} — durée estimée {mission.duration}h
          </div>
          {mission.siteAddress && (
            <div className="flex items-start gap-2">
              <MapPin size={14} className="shrink-0 text-slate-400 mt-0.5" />
              <span>{mission.siteAddress}</span>
            </div>
          )}
          {client?.contacts?.[0]?.phone && (
            <a href={`tel:${client.contacts[0].phone}`} className="flex items-center gap-2 text-primary">
              <Phone size={14} className="shrink-0" />
              {client.contacts[0].phone}
            </a>
          )}
        </div>

        {mission.instructions && (
          <div className="mt-3 p-2.5 bg-white/60 rounded-xl text-xs text-slate-600 border border-white/80">
            <p className="font-semibold text-slate-500 mb-1">Instructions</p>
            {mission.instructions}
          </div>
        )}

        {mission.cleaningData?.checklist?.length > 0 && (
          <div className="mt-3 space-y-1.5">
            <p className="text-xs font-semibold text-slate-500">Check-list</p>
            {mission.cleaningData.checklist.map((item, i) => (
              <div key={i} className="flex items-center gap-2 text-sm text-slate-700">
                {item.done
                  ? <CheckCircle size={14} className="text-green-500 shrink-0" />
                  : <Circle size={14} className="text-slate-300 shrink-0" />}
                <span className={item.done ? 'line-through text-slate-400' : ''}>{item.label}</span>
              </div>
            ))}
          </div>
        )}

        {/* Collègues */}
        {allEmployees.length > 0 && (mission.teamIds ?? []).length > 1 && (
          <div className="mt-3 pt-2.5 border-t border-white/40">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Équipe</p>
            <div className="flex flex-wrap gap-2">
              {(mission.teamIds ?? []).map((tid, i) => {
                const emp = allEmployees.find((e) => e.id === tid)
                if (!emp) return null
                return (
                  <div key={tid} className="flex items-center gap-1.5 bg-white/60 rounded-lg px-2 py-1">
                    <div className={`w-5 h-5 rounded-full ${EMP_COLORS[i % EMP_COLORS.length]} flex items-center justify-center text-white text-[9px] font-bold shrink-0`}>
                      {getInitials(emp.firstName, emp.lastName)}
                    </div>
                    <span className="text-xs text-slate-700 font-medium">{emp.firstName}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {canClose && onCloture && (
          <button
            onClick={() => onCloture(mission)}
            className="mt-4 w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-green-500 text-white text-sm font-bold hover:bg-green-600 transition-colors"
          >
            <Flag size={15} /> Mission terminée
          </button>
        )}

        {mission.status === 'termine' && mission.report && (
          <div className="mt-3 p-2.5 bg-green-50 rounded-xl border border-green-100 text-xs text-green-700">
            <p className="font-semibold">✓ Clôturée — {mission.report.realDuration}h réelles</p>
            {mission.report.notes && <p className="mt-0.5 text-green-600">{mission.report.notes}</p>}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className={`flex items-center gap-3 p-3 rounded-xl border ${bg}`}>
      <span className="text-lg shrink-0">{TYPE_ICON[mission.type] ?? '📋'}</span>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm text-slate-900 truncate">{getMissionTypeLabel(mission.type)}</p>
        <p className="text-xs text-slate-500 truncate">{client?.name ?? '—'} · {format(new Date(mission.date), 'HH:mm')}</p>
      </div>
      <Badge className={getStatusBadgeClass(mission.status)}>{getStatusLabel(mission.status)}</Badge>
    </div>
  )
}

// ── Week strip ────────────────────────────────────────────────────────────────
function WeekStrip({ currentDay, missions, empId, onDaySelect }) {
  const weekStart = startOfWeek(currentDay, { weekStartsOn: 1 })
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
  return (
    <div className="grid grid-cols-7 gap-1 bg-white rounded-2xl border border-slate-100 p-3">
      {days.map((day) => {
        const hasMission = missions.some((m) => m.teamIds?.includes(empId) && isSameDay(new Date(m.date), day))
        const active = isSameDay(day, currentDay)
        const today  = isToday(day)
        return (
          <button key={day.toISOString()} onClick={() => onDaySelect(day)}
            className={`flex flex-col items-center py-2 px-1 rounded-xl transition-colors ${active ? 'bg-primary text-white' : today ? 'bg-primary/10 text-primary' : 'hover:bg-slate-50 text-slate-600'}`}>
            <span className="text-[9px] font-bold uppercase">{format(day, 'EEE', { locale: fr }).slice(0, 2)}</span>
            <span className="text-sm font-black leading-tight">{format(day, 'd')}</span>
            {hasMission && <div className={`w-1.5 h-1.5 rounded-full mt-0.5 ${active ? 'bg-white/60' : 'bg-primary'}`} />}
          </button>
        )
      })}
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function EmployeeSpace() {
  const empSession    = useAuthStore((s) => s.employeeSession)
  const logoutEmployee = useAuthStore((s) => s.logoutEmployee)
  const missions      = useMissionStore((s) => s.missions)
  const updateMission = useMissionStore((s) => s.update)
  const getClient     = useClientStore((s) => s.getById)
  const allEmployees  = useEmployeeStore((s) => s.employees)
  const allTeams      = useTeamStore((s) => s.teams)
  const navigate      = useNavigate()

  const conversations     = useMessagingStore((s) => s.conversations)
  const loadConversations = useMessagingStore((s) => s.loadConversations)
  const getOrCreate       = useMessagingStore((s) => s.getOrCreate)
  const notifCount          = useMessagingStore((s) => s.notifCount)
  const clearNotif          = useMessagingStore((s) => s.clearNotif)
  const sessionUnreadByConv = useMessagingStore((s) => s.sessionUnreadByConv)
  const clearSessionUnread  = useMessagingStore((s) => s.clearSessionUnread)
  const setOpenConvId       = useMessagingStore((s) => s.setOpenConvId)
  const initSessionUnread   = useMessagingStore((s) => s.initSessionUnread)

  const [currentDay,   setCurrentDay]   = useState(new Date())
  const [tab,          setTab]          = useState('today')
  const [showLogout,   setShowLogout]   = useState(false)
  const [clotureModal, setClotureModal] = useState(null)
  const [chatConvId,   setChatConvId]   = useState(null)

  if (!empSession) { navigate('/connexion'); return null }

  const empId = empSession.employeeId
  const now   = new Date()

  const empMissions = useMemo(
    () => missions.filter((m) => m.teamIds?.includes(empId) && m.status !== 'annule'),
    [missions, empId]
  )

  const todayMissions = useMemo(
    () => empMissions.filter((m) => isToday(new Date(m.date))).sort((a, b) => new Date(a.date) - new Date(b.date)),
    [empMissions]
  )

  const selectedDayMissions = useMemo(
    () => empMissions.filter((m) => isSameDay(new Date(m.date), currentDay)).sort((a, b) => new Date(a.date) - new Date(b.date)),
    [empMissions, currentDay]
  )

  const monthHours = useMemo(() => {
    const start = startOfMonth(now)
    const end   = endOfMonth(now)
    return empMissions
      .filter((m) => isWithinInterval(new Date(m.date), { start, end }) && ['termine', 'facture', 'paye'].includes(m.status))
      .reduce((sum, m) => sum + (m.report?.realDuration ?? m.duration ?? 0), 0)
  }, [empMissions])

  const monthDone = useMemo(() => {
    const start = startOfMonth(now)
    const end   = endOfMonth(now)
    return empMissions.filter((m) =>
      isWithinInterval(new Date(m.date), { start, end }) && ['termine', 'facture', 'paye'].includes(m.status)
    ).length
  }, [empMissions])

  useEffect(() => {
    if (tab === 'messages') loadConversations()
  }, [tab])

  // Charger les non-lus depuis la DB dès que les conversations sont disponibles
  useEffect(() => {
    if (!empId || conversations.length === 0) return
    const tIds = new Set(myTeams.map((t) => t.id))
    const myConvs = [
      conversations.find((c) => c.type === 'direct_employee' && c.employeeId === empId),
      ...conversations.filter((c) => c.type === 'team' && tIds.has(c.teamId)),
    ].filter(Boolean)
    if (myConvs.length === 0) return

    const fetchUnread = async () => {
      const counts = {}
      for (const conv of myConvs) {
        // Ne pas compter si la conv est déjà ouverte
        if (useMessagingStore.getState().openConvId === conv.id) continue
        const lastRead = localStorage.getItem(`emp_read_${empId}_${conv.id}`) ?? '1970-01-01T00:00:00Z'
        const { count } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('conversation_id', conv.id)
          .gt('created_at', lastRead)
          .or(`sender_type.neq.employee,sender_id.neq.${empId}`)
        if (count > 0) counts[conv.id] = count
      }
      if (Object.keys(counts).length > 0) initSessionUnread(counts)
    }
    fetchUnread()
  }, [conversations, empId])

  const directConv = conversations.find(
    (c) => c.type === 'direct_employee' && c.employeeId === empId
  )

  // Équipes dont l'employé est membre
  const myTeams = useMemo(
    () => allTeams.filter((t) => t.memberIds?.includes(empId)),
    [allTeams, empId]
  )

  const teamConvs = useMemo(() => {
    const tIds = new Set(myTeams.map((t) => t.id))
    return conversations.filter((c) => c.type === 'team' && tIds.has(c.teamId))
  }, [conversations, myTeams])

  const handleOpenDirect = async () => {
    let conv = directConv
    if (!conv) {
      conv = await getOrCreate('direct_employee', {
        employeeId: empId,
        title: `${empSession.firstName} ${empSession.lastName}`,
      })
    }
    if (conv) {
      localStorage.setItem(`emp_read_${empId}_${conv.id}`, new Date().toISOString())
      setChatConvId(conv.id)
      clearSessionUnread(conv.id)
      setOpenConvId(conv.id)
    }
  }

  const handleOpenTeamChat = async (team) => {
    const conv = await getOrCreate('team', { teamId: team.id, title: team.name })
    if (conv) {
      localStorage.setItem(`emp_read_${empId}_${conv.id}`, new Date().toISOString())
      setChatConvId(conv.id)
      clearSessionUnread(conv.id)
      setOpenConvId(conv.id)
    }
  }

  const handleCloseChat = () => {
    setChatConvId(null)
    setOpenConvId(null)
  }

  const handleCloture = async (mission, { realDuration, notes }) => {
    await updateMission(mission.id, {
      status: 'termine',
      report: { realDuration, notes, incidents: [], consumables: [] },
    })
    toast.success('Mission clôturée avec succès')
  }

  const handleLogout = () => { logoutEmployee(); navigate('/connexion') }

  const dayLabel = isToday(currentDay) ? "Aujourd'hui"
    : isTomorrow(currentDay) ? 'Demain'
    : format(currentDay, 'EEEE d MMMM', { locale: fr })

  return (
    <div className="min-h-screen bg-stone-50 font-sans flex flex-col">
      <header className="relative bg-[#0f2318] text-white px-4 pt-12 pb-8 overflow-hidden">
        {/* Ambient gradient */}
        <div className="absolute inset-0 pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(ellipse at 80% 0%, rgba(217,119,6,0.15) 0%, transparent 60%), radial-gradient(ellipse at 0% 100%, rgba(45,106,79,0.4) 0%, transparent 50%)' }} />

        <div className="relative max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-white text-lg font-bold">
                {getInitials(empSession.firstName, empSession.lastName)}
              </div>
              <div>
                <p className="font-black text-lg leading-tight">{empSession.firstName} {empSession.lastName}</p>
                <p className="text-white/50 text-xs uppercase tracking-widest font-medium">Mon espace</p>
              </div>
            </div>
            <button onClick={() => setShowLogout(true)}
              className="p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/15 transition-colors"
              aria-label="Déconnexion">
              <LogOut size={17} />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Aujourd'hui", value: todayMissions.length, color: 'bg-white/8' },
              { label: 'Ce mois',     value: monthDone,            color: 'bg-white/8' },
              { label: 'Heures',      value: `${monthHours}h`,     color: 'bg-amber-500/20 border-amber-500/30' },
            ].map(({ label, value, color }) => (
              <div key={label} className={`${color} border border-white/10 rounded-2xl p-3 text-center`}>
                <p className="text-2xl font-black font-mono">{value}</p>
                <p className="text-white/50 text-[10px] leading-tight mt-0.5 uppercase tracking-wide">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-5 space-y-4 pb-24">
        <div className="flex gap-1 bg-white rounded-2xl border border-slate-100 p-1">
          {[
            { key: 'today',    label: "Aujourd'hui", icon: '📅' },
            { key: 'week',     label: 'Semaine',     icon: '🗓' },
            { key: 'messages', label: 'Messages',    icon: '💬', badge: notifCount },
          ].map((t) => (
            <button key={t.key}
              onClick={() => { setTab(t.key); handleCloseChat(); if (t.key === 'messages') clearNotif() }}
              className={`relative flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-bold transition-colors ${tab === t.key ? 'bg-primary text-white' : 'text-slate-500 hover:bg-slate-50'}`}>
              <span>{t.icon}</span> {t.label}
              {t.badge > 0 && (
                <span className="absolute top-1.5 right-2 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                  {t.badge > 9 ? '9+' : t.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {tab === 'today' && (
          <div className="space-y-3">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">
              {format(now, 'EEEE d MMMM yyyy', { locale: fr })}
            </p>
            {todayMissions.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-100 p-10 text-center">
                <p className="text-3xl mb-2">😎</p>
                <p className="font-semibold text-slate-600">Aucune mission aujourd'hui</p>
                <p className="text-sm text-slate-400 mt-1">Profitez de votre journée !</p>
              </div>
            ) : (
              todayMissions.map((m) => (
                <MissionCard key={m.id} mission={m} client={getClient(m.clientId)} size="lg"
                  allEmployees={allEmployees} onCloture={(mission) => setClotureModal(mission)} />
              ))
            )}
          </div>
        )}

        {tab === 'messages' && (
          <div className="space-y-3">
            {chatConvId ? (
              /* Chat window */
              (() => {
                const isTeamChat = chatConvId !== directConv?.id
                const teamConv   = isTeamChat ? teamConvs.find((c) => c.id === chatConvId) : null
                const team       = teamConv ? myTeams.find((t) => t.id === teamConv.teamId) : null
                const members    = (team?.memberIds ?? []).map((id) => allEmployees.find((e) => e.id === id)).filter(Boolean)
                const colorCls   = team ? teamColorCls(team.color) : 'bg-slate-400'
                return (
                  <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden flex flex-col" style={{ height: 500 }}>
                    {/* Header */}
                    <div className="border-b border-slate-100 shrink-0">
                      <div className="flex items-center gap-2 px-4 py-3">
                        <button onClick={handleCloseChat}
                          className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100 transition-colors">
                          <ArrowLeft size={18} />
                        </button>
                        {isTeamChat && team && (
                          <div className={`w-7 h-7 rounded-lg ${colorCls} flex items-center justify-center text-white text-[10px] font-black shrink-0`}>
                            {team.name.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                        <p className="font-semibold text-sm text-slate-800">
                          {isTeamChat ? (team?.name ?? 'Chat équipe') : 'Manager'}
                        </p>
                      </div>
                      {/* Participants pour les chats équipe */}
                      {isTeamChat && members.length > 0 && (
                        <div className="px-4 pb-3 flex flex-wrap gap-1.5">
                          <div className="flex items-center gap-1.5 bg-primary/10 rounded-full px-2.5 py-1">
                            <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center text-white text-[9px] font-bold shrink-0">M</div>
                            <span className="text-xs font-medium text-primary">Manager</span>
                          </div>
                          {members.map((emp) => (
                            <div key={emp.id} className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 ${emp.id === empId ? 'bg-primary/10' : 'bg-slate-100'}`}>
                              <div className={`w-5 h-5 rounded-full ${colorCls} flex items-center justify-center text-white text-[9px] font-bold shrink-0`}>
                                {getInitials(emp.firstName, emp.lastName)}
                              </div>
                              <span className={`text-xs font-medium ${emp.id === empId ? 'text-primary' : 'text-slate-700'}`}>
                                {emp.firstName}{emp.id === empId ? ' (moi)' : ''}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-h-0">
                      <ChatPanel
                        convId={chatConvId}
                        senderType="employee"
                        senderId={empId}
                        senderName={`${empSession.firstName} ${empSession.lastName}`}
                      />
                    </div>
                  </div>
                )
              })()
            ) : (
              /* Conversation list */
              <>
                {/* Direct message with manager */}
                {(() => {
                  const unread = sessionUnreadByConv[directConv?.id] ?? 0
                  return (
                    <button onClick={handleOpenDirect}
                      className="w-full flex items-center gap-3 p-4 bg-white rounded-2xl border border-slate-100 text-left hover:bg-primary/5 hover:border-primary/20 transition-colors">
                      <div className="relative w-11 h-11 shrink-0">
                        <div className="w-11 h-11 rounded-2xl bg-primary/10 flex items-center justify-center">
                          <MessageSquare size={20} className="text-primary" />
                        </div>
                        {unread > 0 && (
                          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                            {unread > 9 ? '9+' : unread}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`font-semibold ${unread > 0 ? 'text-slate-900' : 'text-slate-700'}`}>Manager</p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {unread > 0 ? `${unread} message${unread > 1 ? 's' : ''} non lu${unread > 1 ? 's' : ''}` : 'Message direct'}
                        </p>
                      </div>
                      <ChevronRight size={16} className="text-slate-300" />
                    </button>
                  )
                })()}

                {/* Chats d'équipe */}
                {myTeams.length === 0 ? (
                  <div className="text-center py-8 text-slate-400 text-sm bg-white rounded-2xl border border-slate-100">
                    Vous n'êtes membre d'aucune équipe pour l'instant.
                  </div>
                ) : myTeams.map((team) => {
                  const existingConv = teamConvs.find((c) => c.teamId === team.id)
                  const unread       = sessionUnreadByConv[existingConv?.id] ?? 0
                  const colorCls     = teamColorCls(team.color)
                  return (
                    <button key={team.id} onClick={() => handleOpenTeamChat(team)}
                      className="w-full flex items-center gap-3 p-4 bg-white rounded-2xl border border-slate-100 text-left hover:bg-slate-50 transition-colors">
                      <div className="relative w-11 h-11 shrink-0">
                        <div className={`w-11 h-11 rounded-2xl ${colorCls} flex items-center justify-center text-white font-black text-sm`}>
                          {team.name.slice(0, 2).toUpperCase()}
                        </div>
                        {unread > 0 && (
                          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                            {unread > 9 ? '9+' : unread}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`font-semibold text-sm truncate ${unread > 0 ? 'text-slate-900' : 'text-slate-700'}`}>
                          {team.name}
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {unread > 0
                            ? `${unread} message${unread > 1 ? 's' : ''} non lu${unread > 1 ? 's' : ''}`
                            : `${team.memberIds?.length ?? 0} membre${(team.memberIds?.length ?? 0) > 1 ? 's' : ''} · Chat d'équipe`}
                        </p>
                      </div>
                      {!existingConv && unread === 0 && (
                        <span className="text-[10px] text-slate-400 bg-slate-100 rounded-full px-2 py-0.5 shrink-0">Nouveau</span>
                      )}
                      <ChevronRight size={16} className="text-slate-300 shrink-0" />
                    </button>
                  )
                })}
              </>
            )}
          </div>
        )}

        {tab === 'week' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <button onClick={() => setCurrentDay((d) => subDays(d, 1))} className="p-2 rounded-xl hover:bg-white hover:border hover:border-slate-100 transition-colors" aria-label="Jour précédent">
                <ChevronLeft size={20} className="text-slate-600" />
              </button>
              <p className="flex-1 text-center text-sm font-bold text-slate-800 capitalize">{dayLabel}</p>
              <button onClick={() => setCurrentDay((d) => addDays(d, 1))} className="p-2 rounded-xl hover:bg-white hover:border hover:border-slate-100 transition-colors" aria-label="Jour suivant">
                <ChevronRight size={20} className="text-slate-600" />
              </button>
            </div>
            <WeekStrip currentDay={currentDay} missions={empMissions} empId={empId} onDaySelect={setCurrentDay} />
            <div className="space-y-2">
              {selectedDayMissions.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center">
                  <p className="text-slate-400 text-sm">Aucune mission ce jour</p>
                </div>
              ) : (
                selectedDayMissions.map((m) => (
                  <MissionCard key={m.id} mission={m} client={getClient(m.clientId)} size="lg"
                    allEmployees={allEmployees} onCloture={(mission) => setClotureModal(mission)} />
                ))
              )}
            </div>
          </div>
        )}
      </main>

      <NotifPrompt userType="employee" userId={empId} />

      {/* Logout overlay */}
      {showLogout && (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowLogout(false)} />
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden">
            <div className="flex flex-col items-center pt-8 pb-5 px-6 text-center">
              <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mb-4">
                <LogOut size={26} className="text-red-500" />
              </div>
              <p className="text-lg font-bold text-slate-900">Se déconnecter ?</p>
              <p className="text-sm text-slate-500 mt-1">Vous devrez ressaisir votre PIN pour revenir.</p>
            </div>
            <div className="flex gap-3 px-6 pb-6">
              <button onClick={() => setShowLogout(false)} className="flex-1 py-3 rounded-2xl border-2 border-slate-200 text-slate-700 font-semibold text-sm hover:bg-slate-50">Annuler</button>
              <button onClick={handleLogout} className="flex-1 py-3 rounded-2xl bg-red-500 text-white font-semibold text-sm hover:bg-red-600">Déconnecter</button>
            </div>
          </div>
        </div>
      )}

      {/* Cloture modal */}
      {clotureModal && (
        <ClotureModal
          mission={clotureModal}
          onClose={() => setClotureModal(null)}
          onSave={(data) => handleCloture(clotureModal, data)}
        />
      )}
    </div>
  )
}
