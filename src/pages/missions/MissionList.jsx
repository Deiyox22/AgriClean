import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, ChevronRight } from 'lucide-react'
import { useMissionStore } from '../../store/useMissionStore'
import { useClientStore } from '../../store/useClientStore'
import { useEmployeeStore } from '../../store/useEmployeeStore'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import EmptyState from '../../components/ui/EmptyState'
import SearchInput from '../../components/ui/SearchInput'
import { getMissionTypeLabel, getMissionTypeColor, getStatusLabel, getStatusBadgeClass, formatDate, getInitials } from '../../utils/formatters'

const STATUS_TABS = [
  { key: 'all', label: 'Toutes' },
  { key: 'planifie', label: 'Planifié' },
  { key: 'en_cours', label: 'En cours' },
  { key: 'termine', label: 'Terminé' },
  { key: 'facture', label: 'Facturé' },
]

const avatarColors = ['bg-primary', 'bg-accent', 'bg-blue-500', 'bg-purple-500', 'bg-teal-500']

export default function MissionList() {
  const missions = useMissionStore((s) => s.missions)
  const getClient = useClientStore((s) => s.getById)
  const getEmployee = useEmployeeStore((s) => s.getById)
  const navigate = useNavigate()
  const [tab, setTab] = useState('all')
  const [search, setSearch] = useState('')
  const [loading] = useMissionStore((s) => [s.loading])

  const filtered = useMemo(() =>
    missions.filter((m) => {
      const matchTab = tab === 'all' || m.status === tab
      const clientName = getClient(m.clientId)?.name ?? ''
      const matchSearch = getMissionTypeLabel(m.type).toLowerCase().includes(search.toLowerCase()) ||
        clientName.toLowerCase().includes(search.toLowerCase())
      return matchTab && matchSearch
    }),
    [missions, tab, search])

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 min-w-0">
          <SearchInput value={search} onChange={setSearch} placeholder="Rechercher une mission…" />
        </div>
        <button onClick={() => navigate('/missions/new')} className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary-light transition-colors min-h-[44px] shrink-0">
          <Plus size={16} /> Nouvelle mission
        </button>
      </div>

      <div className="flex gap-1 overflow-x-auto border-b border-slate-100 pb-0">
        {STATUS_TABS.map((t) => {
          const count = t.key === 'all' ? missions.length : missions.filter((m) => m.status === t.key).length
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors border-b-2 -mb-px ${tab === t.key ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-900'}`}
            >
              {t.label} <span className="ml-1 text-xs opacity-60">({count})</span>
            </button>
          )
        })}
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="Aucune mission" description="Créez votre première mission." action={
          <button onClick={() => navigate('/missions/new')} className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-medium">Nouvelle mission</button>
        } />
      ) : (
        <div className="space-y-3">
          {filtered.map((m) => {
            const client = getClient(m.clientId)
            const team = m.teamIds?.slice(0, 3).map((id) => getEmployee(id)).filter(Boolean) ?? []
            return (
              <Card key={m.id} onClick={() => navigate(`/missions/${m.id}`)} className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-lg shrink-0">
                    {m.type === 'ramassage' ? '🥚' : '🧹'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 min-w-0">
                      <p className="font-semibold text-slate-900 text-sm truncate">{getMissionTypeLabel(m.type)}</p>
                      <Badge className={`${getMissionTypeColor(m.type)} shrink-0 hidden sm:inline-flex`}>{m.type === 'ramassage' ? 'Ramassage' : 'Nettoyage'}</Badge>
                    </div>
                    <p className="text-xs text-slate-500 truncate">{client?.name ?? '—'} · {formatDate(m.date)}</p>
                    {team.length > 0 && (
                      <div className="flex items-center gap-1 mt-1">
                        {team.map((emp, i) => (
                          <div key={emp.id} className={`w-6 h-6 rounded-full ${avatarColors[i % avatarColors.length]} flex items-center justify-center text-white text-xs font-bold`}>
                            {getInitials(emp.firstName, emp.lastName)}
                          </div>
                        ))}
                        {(m.teamIds?.length ?? 0) > 3 && <span className="text-xs text-slate-400">+{m.teamIds.length - 3}</span>}
                      </div>
                    )}
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
