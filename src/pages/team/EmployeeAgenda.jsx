import { useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, MapPin, Clock, Phone, Users, CheckCircle, Circle } from 'lucide-react'
import { useEmployeeStore } from '../../store/useEmployeeStore'
import { useMissionStore } from '../../store/useMissionStore'
import { useClientStore } from '../../store/useClientStore'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import {
  getInitials, getMissionTypeLabel, getStatusLabel, getStatusBadgeClass,
  getRoleLabel, formatDate,
} from '../../utils/formatters'
import {
  isToday, isTomorrow, isThisWeek, startOfDay, endOfDay,
  addDays, format, isWithinInterval, startOfMonth, endOfMonth, isFuture, isPast,
} from 'date-fns'
import { fr } from 'date-fns/locale'

const missionTypeStyle = {
  ramassage: { bg: 'bg-amber-50 border-amber-200', dot: 'bg-amber-400', icon: '🥚' },
  nettoyage_agricole: { bg: 'bg-blue-50 border-blue-200', dot: 'bg-blue-400', icon: '🌿' },
  nettoyage_industriel: { bg: 'bg-indigo-50 border-indigo-200', dot: 'bg-indigo-400', icon: '🏭' },
}

function MissionCard({ mission, client, onClick, size = 'md' }) {
  const style = missionTypeStyle[mission.type] ?? { bg: 'bg-slate-50 border-slate-200', dot: 'bg-slate-400', icon: '📋' }

  if (size === 'lg') {
    return (
      <button onClick={onClick} className={`w-full text-left p-4 rounded-2xl border-2 ${style.bg} transition-all active:scale-[0.98]`}>
        <div className="flex items-start gap-3">
          <span className="text-2xl">{style.icon}</span>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-slate-900 text-base">{getMissionTypeLabel(mission.type)}</p>
            <p className="text-sm text-slate-600 font-medium">{client?.name ?? '—'}</p>
            {mission.siteAddress && (
              <p className="flex items-center gap-1 text-xs text-slate-500 mt-1">
                <MapPin size={12} className="shrink-0" />
                <span className="truncate">{mission.siteAddress}</span>
              </p>
            )}
            <div className="flex items-center gap-3 mt-2">
              <span className="flex items-center gap-1 text-xs text-slate-500">
                <Clock size={12} />
                {format(new Date(mission.date), 'HH:mm')} · {mission.duration}h
              </span>
              <Badge className={getStatusBadgeClass(mission.status)}>{getStatusLabel(mission.status)}</Badge>
            </div>
            {mission.instructions && (
              <p className="mt-2 text-xs text-slate-500 bg-white/60 rounded-lg px-2 py-1.5 border border-white">
                {mission.instructions}
              </p>
            )}
            {/* Checklist if nettoyage */}
            {mission.cleaningData?.checklist?.length > 0 && (
              <div className="mt-2 space-y-1">
                {mission.cleaningData.checklist.map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-slate-600">
                    {item.done
                      ? <CheckCircle size={12} className="text-green-500 shrink-0" />
                      : <Circle size={12} className="text-slate-300 shrink-0" />
                    }
                    {item.label}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </button>
    )
  }

  return (
    <button onClick={onClick} className={`w-full text-left p-3 rounded-xl border ${style.bg} transition-all active:scale-[0.98]`}>
      <div className="flex items-center gap-3">
        <span className="text-lg">{style.icon}</span>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-slate-900 text-sm truncate">{getMissionTypeLabel(mission.type)}</p>
          <p className="text-xs text-slate-500 truncate">{client?.name ?? '—'} · {format(new Date(mission.date), 'HH:mm')}</p>
        </div>
        <Badge className={getStatusBadgeClass(mission.status)}>{getStatusLabel(mission.status)}</Badge>
      </div>
    </button>
  )
}

function Section({ title, children, empty }) {
  return (
    <div>
      <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">{title}</h2>
      {children ?? <p className="text-sm text-slate-400 text-center py-4">{empty}</p>}
    </div>
  )
}

export default function EmployeeAgenda() {
  const { id } = useParams()
  const navigate = useNavigate()
  const getById = useEmployeeStore((s) => s.getById)
  const missions = useMissionStore((s) => s.missions)
  const getClient = useClientStore((s) => s.getById)

  const emp = getById(Number(id))
  if (!emp) return (
    <div className="text-center py-16 text-slate-400">
      <p>Employé introuvable.</p>
      <button onClick={() => navigate('/team')} className="mt-4 text-primary underline text-sm">Retour</button>
    </div>
  )

  const now = new Date()
  const empMissions = useMemo(
    () => missions.filter((m) => m.teamIds?.includes(emp.id) && m.status !== 'annule'),
    [missions, emp.id]
  )

  const todayMissions = useMemo(
    () => empMissions.filter((m) => isToday(new Date(m.date))).sort((a, b) => new Date(a.date) - new Date(b.date)),
    [empMissions]
  )

  const tomorrowMissions = useMemo(
    () => empMissions.filter((m) => isTomorrow(new Date(m.date))),
    [empMissions]
  )

  const upcomingMissions = useMemo(
    () => empMissions
      .filter((m) => {
        const d = new Date(m.date)
        return isFuture(d) && !isToday(d) && !isTomorrow(d) && isWithinInterval(d, { start: now, end: addDays(now, 14) })
      })
      .sort((a, b) => new Date(a.date) - new Date(b.date)),
    [empMissions]
  )

  const monthHours = useMemo(() => {
    const start = startOfMonth(now)
    const end = endOfMonth(now)
    return empMissions
      .filter((m) => isWithinInterval(new Date(m.date), { start, end }) && (m.status === 'termine' || m.status === 'facture'))
      .reduce((sum, m) => sum + (m.report?.realDuration ?? m.duration ?? 0), 0)
  }, [empMissions])

  const monthMissions = useMemo(() => {
    const start = startOfMonth(now)
    const end = endOfMonth(now)
    return empMissions.filter((m) => isWithinInterval(new Date(m.date), { start, end }))
  }, [empMissions])

  const todayDate = format(now, 'EEEE d MMMM yyyy', { locale: fr })

  return (
    <div className="max-w-lg mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(`/team/${id}`)} className="p-2 rounded-xl hover:bg-slate-100" aria-label="Retour">
          <ArrowLeft size={20} className="text-slate-600" />
        </button>
        <div className="flex-1" />
        <p className="text-xs text-slate-400 capitalize">{todayDate}</p>
      </div>

      {/* Identity card */}
      <div className="bg-primary rounded-2xl p-5 text-white">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center text-white text-xl font-bold">
            {getInitials(emp.firstName, emp.lastName)}
          </div>
          <div>
            <p className="text-xl font-bold">{emp.firstName} {emp.lastName}</p>
            <p className="text-white/70 text-sm">{getRoleLabel(emp.role)}</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-white/20">
          <div className="text-center">
            <p className="text-2xl font-bold font-mono">{todayMissions.length}</p>
            <p className="text-white/60 text-xs">Aujourd'hui</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold font-mono">{monthMissions.length}</p>
            <p className="text-white/60 text-xs">Ce mois</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold font-mono">{monthHours}h</p>
            <p className="text-white/60 text-xs">Heures</p>
          </div>
        </div>
        {emp.phone && (
          <a href={`tel:${emp.phone}`} className="flex items-center gap-2 mt-3 text-white/80 text-sm">
            <Phone size={14} /> {emp.phone}
          </a>
        )}
      </div>

      {/* Today */}
      <Section title="Aujourd'hui">
        {todayMissions.length > 0 ? (
          <div className="space-y-3">
            {todayMissions.map((m) => (
              <MissionCard key={m.id} mission={m} client={getClient(m.clientId)} size="lg"
                onClick={() => navigate(`/missions/${m.id}`)} />
            ))}
          </div>
        ) : (
          <Card className="p-6 text-center">
            <p className="text-3xl mb-2">😴</p>
            <p className="text-slate-500 text-sm font-medium">Pas de mission aujourd'hui</p>
          </Card>
        )}
      </Section>

      {/* Tomorrow */}
      {tomorrowMissions.length > 0 && (
        <Section title="Demain">
          <div className="space-y-2">
            {tomorrowMissions.map((m) => (
              <MissionCard key={m.id} mission={m} client={getClient(m.clientId)}
                onClick={() => navigate(`/missions/${m.id}`)} />
            ))}
          </div>
        </Section>
      )}

      {/* Upcoming */}
      {upcomingMissions.length > 0 && (
        <Section title="À venir (14 jours)">
          <div className="space-y-2">
            {upcomingMissions.map((m) => {
              const d = new Date(m.date)
              const label = format(d, 'EEEE d MMM', { locale: fr })
              return (
                <button key={m.id} onClick={() => navigate(`/missions/${m.id}`)}
                  className="w-full flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-100 hover:border-primary/30 transition-colors text-left">
                  <div className="text-center w-10 shrink-0">
                    <p className="text-xs text-slate-400 capitalize">{format(d, 'EEE', { locale: fr })}</p>
                    <p className="text-lg font-bold text-slate-900 leading-tight">{format(d, 'd')}</p>
                  </div>
                  <div className="w-px h-8 bg-slate-100 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{getMissionTypeLabel(m.type)}</p>
                    <p className="text-xs text-slate-500 truncate">{getClient(m.clientId)?.name}</p>
                  </div>
                  <Badge className={getStatusBadgeClass(m.status)}>{getStatusLabel(m.status)}</Badge>
                </button>
              )
            })}
          </div>
        </Section>
      )}

      {todayMissions.length === 0 && tomorrowMissions.length === 0 && upcomingMissions.length === 0 && (
        <Card className="p-8 text-center">
          <p className="text-4xl mb-3">🗓️</p>
          <p className="text-slate-600 font-medium">Aucune mission planifiée</p>
          <p className="text-slate-400 text-sm mt-1">Les prochaines missions apparaîtront ici</p>
        </Card>
      )}

      {/* Availability reminder */}
      {emp.availability?.length > 0 && (
        <Section title="Mes jours de travail">
          <div className="flex gap-2 flex-wrap">
            {['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'].map((d) => {
              const active = emp.availability.includes(d)
              return (
                <span key={d} className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize ${active ? 'bg-primary/10 text-primary' : 'bg-slate-100 text-slate-300'}`}>
                  {d.slice(0, 3)}
                </span>
              )
            })}
          </div>
        </Section>
      )}
    </div>
  )
}
