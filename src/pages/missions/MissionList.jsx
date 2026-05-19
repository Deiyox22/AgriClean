import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, ChevronRight, Clock } from 'lucide-react'
import { useMissionStore } from '../../store/useMissionStore'
import { useClientStore } from '../../store/useClientStore'
import { useEmployeeStore } from '../../store/useEmployeeStore'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import EmptyState from '../../components/ui/EmptyState'
import SearchInput from '../../components/ui/SearchInput'
import { getMissionTypeLabel, getMissionTypeColor, getStatusLabel, getStatusBadgeClass, formatDate, getInitials } from '../../utils/formatters'

const STATUS_TABS = [
  { key: 'all',      label: 'Toutes'    },
  { key: 'planifie', label: 'Planifié'  },
  { key: 'en_cours', label: 'En cours'  },
  { key: 'termine',  label: 'Terminé'   },
  { key: 'facture',  label: 'Facturé'   },
]

const avatarColors = ['bg-primary', 'bg-accent', 'bg-blue-500', 'bg-purple-500', 'bg-teal-500']

export default function MissionList() {
  const missions    = useMissionStore((s) => s.missions)
  const getClient   = useClientStore((s) => s.getById)
  const employees   = useEmployeeStore((s) => s.employees)
  const getEmployee = useEmployeeStore((s) => s.getById)
  const navigate    = useNavigate()
  const [tab,        setTab]       = useState('all')
  const [search,     setSearch]    = useState('')
  const [empFilter,  setEmpFilter] = useState('')
  const [loading]   = useMissionStore((s) => [s.loading])

  const activeEmployees = useMemo(() => employees.filter((e) => e.status === 'actif'), [employees])

  const filtered = useMemo(() =>
    missions.filter((m) => {
      const matchTab    = tab === 'all' || m.status === tab
      const clientName  = getClient(m.clientId)?.name ?? ''
      const matchSearch = getMissionTypeLabel(m.type).toLowerCase().includes(search.toLowerCase()) ||
        clientName.toLowerCase().includes(search.toLowerCase())
      const matchEmp    = !empFilter || (m.teamIds ?? []).includes(Number(empFilter))
      return matchTab && matchSearch && matchEmp
    }),
    [missions, tab, search, empFilter])

  const totalHours = useMemo(() =>
    filtered.reduce((sum, m) => sum + (m.report?.realDuration ?? m.duration ?? 0), 0),
    [filtered])

  const totalDone = useMemo(() =>
    filtered.filter((m) => ['termine', 'facture', 'paye'].includes(m.status)).length,
    [filtered])

  return (
    <div className="space-y-4">
      {/* Search + filters row */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 min-w-0">
          <SearchInput value={search} onChange={setSearch} placeholder="Rechercher une mission…" />
        </div>
        <select
          value={empFilter}
          onChange={(e) => setEmpFilter(e.target.value)}
          className="px-3 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 text-slate-600 sm:w-48 shrink-0"
        >
          <option value="">Tous les employés</option>
          {activeEmployees.map((e) => (
            <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>
          ))}
        </select>
        <button
          onClick={() => navigate('/missions/new')}
          className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary-light transition-colors min-h-[44px] shrink-0"
        >
          <Plus size={16} /> Nouvelle mission
        </button>
      </div>

      {/* Status tabs */}
      <div className="flex gap-1 overflow-x-auto border-b border-slate-100 pb-0">
        {STATUS_TABS.map((t) => {
          const count = t.key === 'all'
            ? missions.length
            : missions.filter((m) => m.status === t.key).length
          return (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors border-b-2 -mb-px ${tab === t.key ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-900'}`}>
              {t.label} <span className="ml-1 text-xs opacity-60">({count})</span>
            </button>
          )
        })}
      </div>

      {/* Summary bar */}
      {filtered.length > 0 && (
        <div className="flex items-center gap-4 px-1 text-xs text-slate-500">
          <span className="font-medium text-slate-700">{filtered.length} mission{filtered.length > 1 ? 's' : ''}</span>
          <span className="flex items-center gap-1">
            <Clock size={12} className="text-slate-400" />
            {totalHours}h estimées au total
          </span>
          {totalDone > 0 && (
            <span className="text-green-600 font-medium">{totalDone} terminée{totalDone > 1 ? 's' : ''}</span>
          )}
          {(empFilter || search) && (
            <button
              onClick={() => { setEmpFilter(''); setSearch('') }}
              className="ml-auto text-primary hover:underline"
            >
              Effacer les filtres
            </button>
          )}
        </div>
      )}

      {/* List */}
      {filtered.length === 0 ? (
        <EmptyState title="Aucune mission" description="Créez votre première mission." action={
          <button onClick={() => navigate('/missions/new')} className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-medium">Nouvelle mission</button>
        } />
      ) : (
        <div className="space-y-3">
          {filtered.map((m) => {
            const client = getClient(m.clientId)
            const team   = (m.teamIds ?? []).slice(0, 3).map((id) => getEmployee(id)).filter(Boolean)
            return (
              <Card key={m.id} onClick={() => navigate(`/missions/${m.id}`)} className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-lg shrink-0">
                    {{ ramassage: '🥚', nettoyage_agricole: '🌿', nettoyage_industriel: '🏭' }[m.type] ?? '📋'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 min-w-0">
                      <p className="font-semibold text-slate-900 text-sm truncate">{getMissionTypeLabel(m.type)}</p>
                      <Badge className={`${getMissionTypeColor(m.type)} shrink-0 hidden sm:inline-flex`}>
                        {m.type === 'ramassage' ? 'Ramassage' : 'Nettoyage'}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-500 truncate">{client?.name ?? '—'} · {formatDate(m.date)}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {team.map((emp, i) => (
                        <div key={emp.id} className={`w-6 h-6 rounded-full ${avatarColors[i % avatarColors.length]} flex items-center justify-center text-white text-xs font-bold`}>
                          {getInitials(emp.firstName, emp.lastName)}
                        </div>
                      ))}
                      {(m.teamIds?.length ?? 0) > 3 && <span className="text-xs text-slate-400">+{m.teamIds.length - 3}</span>}
                      <span className="text-xs text-slate-400 ml-1">{m.duration}h</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge className={getStatusBadgeClass(m.status)}>{getStatusLabel(m.status)}</Badge>
                    <ChevronRight size={16} className="text-slate-300" />
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
