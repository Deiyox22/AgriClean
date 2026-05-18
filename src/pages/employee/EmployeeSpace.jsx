import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LogOut, CalendarDays, Clock, CheckCircle, Circle, MapPin, Phone, ChevronLeft, ChevronRight } from 'lucide-react'
import {
  isToday, isTomorrow, addDays, subDays, startOfWeek, endOfWeek,
  startOfMonth, endOfMonth, isWithinInterval, format, isSameDay,
} from 'date-fns'
import { fr } from 'date-fns/locale'
import { useAuthStore } from '../../store/useAuthStore'
import { useMissionStore } from '../../store/useMissionStore'
import { useClientStore } from '../../store/useClientStore'
import { getMissionTypeLabel, getStatusLabel, getStatusBadgeClass, getInitials } from '../../utils/formatters'
import Badge from '../../components/ui/Badge'

const TYPE_BG = {
  ramassage:           'bg-amber-50  border-amber-200',
  nettoyage_agricole:  'bg-blue-50   border-blue-200',
  nettoyage_industriel:'bg-indigo-50 border-indigo-200',
}
const TYPE_ICON = { ramassage: '🥚', nettoyage_agricole: '🌿', nettoyage_industriel: '🏭' }

// ── Mission card ──────────────────────────────────────────────────────────────
function MissionCard({ mission, client, size = 'md' }) {
  const bg = TYPE_BG[mission.type] ?? 'bg-slate-50 border-slate-200'

  if (size === 'lg') {
    return (
      <div className={`p-4 rounded-2xl border-2 ${bg}`}>
        <div className="flex items-start justify-between gap-2 mb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">{TYPE_ICON[mission.type] ?? '📋'}</span>
              <div>
                <p className="font-bold text-slate-900">{getMissionTypeLabel(mission.type)}</p>
                <p className="text-sm text-slate-600 font-medium">{client?.name ?? '—'}</p>
              </div>
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
          <div className="mt-3 p-2.5 bg-white/60 rounded-xl text-xs text-slate-600 border border-white">
            <p className="font-semibold text-slate-500 mb-1">Instructions</p>
            {mission.instructions}
          </div>
        )}

        {/* Checklist */}
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
            className={`flex flex-col items-center py-2 px-1 rounded-xl transition-colors ${
              active ? 'bg-primary text-white' : today ? 'bg-primary/10 text-primary' : 'hover:bg-slate-50 text-slate-600'
            }`}>
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
  const empSession   = useAuthStore((s) => s.employeeSession)
  const logoutEmployee = useAuthStore((s) => s.logoutEmployee)
  const missions     = useMissionStore((s) => s.missions)
  const getClient    = useClientStore((s) => s.getById)
  const navigate     = useNavigate()
  const [currentDay, setCurrentDay] = useState(new Date())
  const [tab, setTab] = useState('today') // 'today' | 'week'
  const [showLogout, setShowLogout] = useState(false)

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

  const handleLogout = () => { logoutEmployee(); navigate('/connexion') }

  const dayLabel = isToday(currentDay)
    ? "Aujourd'hui"
    : isTomorrow(currentDay)
    ? 'Demain'
    : format(currentDay, 'EEEE d MMMM', { locale: fr })

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col">
      {/* Header */}
      <header className="bg-primary text-white px-4 pt-12 pb-6">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center text-white text-lg font-bold">
                {getInitials(empSession.firstName, empSession.lastName)}
              </div>
              <div>
                <p className="font-black text-lg leading-tight">{empSession.firstName} {empSession.lastName}</p>
                <p className="text-white/70 text-sm">Mon espace</p>
              </div>
            </div>
            <button onClick={() => setShowLogout(true)}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors" aria-label="Déconnexion">
              <LogOut size={18} />
            </button>
          </div>

          {/* Stats bar */}
          <div className="grid grid-cols-3 gap-2 mt-2">
            {[
              { label: "Missions aujourd'hui", value: todayMissions.length },
              { label: 'Missions ce mois', value: monthDone },
              { label: 'Heures ce mois', value: `${monthHours}h` },
            ].map(({ label, value }) => (
              <div key={label} className="bg-white/10 rounded-2xl p-3 text-center">
                <p className="text-2xl font-black font-mono">{value}</p>
                <p className="text-white/60 text-[10px] leading-tight mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-5 space-y-4 pb-24">

        {/* Tabs */}
        <div className="flex gap-1 bg-white rounded-2xl border border-slate-100 p-1">
          {[
            { key: 'today', label: "Aujourd'hui", icon: '📅' },
            { key: 'week',  label: 'Semaine',     icon: '🗓' },
          ].map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-colors ${
                tab === t.key ? 'bg-primary text-white' : 'text-slate-500 hover:bg-slate-50'
              }`}>
              <span>{t.icon}</span> {t.label}
            </button>
          ))}
        </div>

        {/* Today tab */}
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
                <MissionCard key={m.id} mission={m} client={getClient(m.clientId)} size="lg" />
              ))
            )}
          </div>
        )}

        {/* Week tab */}
        {tab === 'week' && (
          <div className="space-y-4">
            {/* Day navigator */}
            <div className="flex items-center gap-2">
              <button onClick={() => setCurrentDay((d) => subDays(d, 1))}
                className="p-2 rounded-xl hover:bg-white hover:border hover:border-slate-100 transition-colors" aria-label="Jour précédent">
                <ChevronLeft size={20} className="text-slate-600" />
              </button>
              <p className="flex-1 text-center text-sm font-bold text-slate-800 capitalize">{dayLabel}</p>
              <button onClick={() => setCurrentDay((d) => addDays(d, 1))}
                className="p-2 rounded-xl hover:bg-white hover:border hover:border-slate-100 transition-colors" aria-label="Jour suivant">
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
                  <MissionCard key={m.id} mission={m} client={getClient(m.clientId)} size="lg" />
                ))
              )}
            </div>
          </div>
        )}
      </main>

      {/* Logout confirm overlay */}
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
              <button onClick={() => setShowLogout(false)}
                className="flex-1 py-3 rounded-2xl border-2 border-slate-200 text-slate-700 font-semibold text-sm hover:bg-slate-50">
                Annuler
              </button>
              <button onClick={handleLogout}
                className="flex-1 py-3 rounded-2xl bg-red-500 text-white font-semibold text-sm hover:bg-red-600">
                Déconnecter
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
