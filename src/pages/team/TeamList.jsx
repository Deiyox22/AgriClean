import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Phone, Mail, ChevronRight } from 'lucide-react'
import { useEmployeeStore } from '../../store/useEmployeeStore'
import { useMissionStore } from '../../store/useMissionStore'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Modal from '../../components/ui/Modal'
import EmptyState from '../../components/ui/EmptyState'
import SearchInput from '../../components/ui/SearchInput'
import { getInitials, getStatusLabel, getStatusBadgeClass, getRoleLabel } from '../../utils/formatters'
import { isToday } from 'date-fns'
import EmployeeForm from './EmployeeForm'

const avatarColors = ['bg-primary', 'bg-accent', 'bg-blue-500', 'bg-purple-500', 'bg-pink-500', 'bg-teal-500']

export default function TeamList() {
  const employees = useEmployeeStore((s) => s.employees)
  const add = useEmployeeStore((s) => s.add)
  const loading = useEmployeeStore((s) => s.loading)
  const missions = useMissionStore((s) => s.missions)
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)

  const filtered = employees.filter((e) =>
    `${e.firstName} ${e.lastName}`.toLowerCase().includes(search.toLowerCase())
  )

  const getEmployeeStatus = (emp) => {
    if (emp.status !== 'actif') return emp.status
    const hasActiveMission = missions.some((m) =>
      m.teamIds?.includes(emp.id) && m.status === 'en_cours' && isToday(new Date(m.date))
    )
    if (hasActiveMission) return 'en_mission'
    return 'disponible'
  }

  const statusLabel = { disponible: 'Disponible', en_mission: 'En mission', conge: 'Congé', arret: 'Arrêt' }
  const statusClass = { disponible: 'bg-green-100 text-green-700', en_mission: 'bg-amber-100 text-amber-700', conge: 'bg-amber-100 text-amber-700', arret: 'bg-red-100 text-red-700' }

  const getMonthHours = (empId) => {
    const now = new Date()
    return missions
      .filter((m) => m.teamIds?.includes(empId) && (m.status === 'termine' || m.status === 'facture') && new Date(m.date).getMonth() === now.getMonth())
      .reduce((sum, m) => sum + (m.report?.realDuration ?? m.duration ?? 0), 0)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 min-w-0">
          <SearchInput value={search} onChange={setSearch} placeholder="Rechercher un employé…" />
        </div>
        <button onClick={() => setShowModal(true)} className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary-light transition-colors min-h-[44px] shrink-0">
          <Plus size={16} /> Nouvel employé
        </button>
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-28 bg-slate-100 rounded-xl animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState title="Aucun employé" action={<button onClick={() => setShowModal(true)} className="px-4 py-2 bg-primary text-white rounded-xl text-sm">Nouvel employé</button>} />
      ) : (
        <div className="grid sm:grid-cols-2 gap-3">
          {filtered.map((emp, idx) => {
            const status = getEmployeeStatus(emp)
            const hours = getMonthHours(emp.id)
            return (
              <Card key={emp.id} onClick={() => navigate(`/team/${emp.id}`)} className="p-4">
                <div className="flex items-start gap-3">
                  <div className={`w-12 h-12 rounded-2xl ${avatarColors[idx % avatarColors.length]} flex items-center justify-center text-white font-bold text-base shrink-0`}>
                    {getInitials(emp.firstName, emp.lastName)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-slate-900 truncate">{emp.firstName} {emp.lastName}</p>
                      <ChevronRight size={16} className="text-slate-300 shrink-0" />
                    </div>
                    <p className="text-xs text-slate-500">{getRoleLabel(emp.role)}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge className={statusClass[status] ?? ''}>{statusLabel[status] ?? status}</Badge>
                      <span className="text-xs text-slate-400">{hours}h ce mois</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-3 mt-3 pt-3 border-t border-slate-50">
                  {emp.phone && <a href={`tel:${emp.phone}`} onClick={(e) => e.stopPropagation()} className="flex items-center gap-1 text-xs text-primary"><Phone size={12} />{emp.phone}</a>}
                  {emp.licenses?.length > 0 && <div className="flex gap-1">{emp.licenses.map((l) => <span key={l} className="text-xs bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">{l}</span>)}</div>}
                </div>
              </Card>
            )
          })}
        </div>
      )}

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Nouvel employé" size="lg">
        <EmployeeForm onSave={async (data) => { await add(data); setShowModal(false) }} onClose={() => setShowModal(false)} />
      </Modal>
    </div>
  )
}
