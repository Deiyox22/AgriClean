import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Trash2, Pencil, Phone, Mail, CalendarDays, FileDown } from 'lucide-react'
import { useEmployeeStore } from '../../store/useEmployeeStore'
import { useMissionStore } from '../../store/useMissionStore'
import { useClientStore } from '../../store/useClientStore'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Modal from '../../components/ui/Modal'
import EmptyState from '../../components/ui/EmptyState'
import EmployeeForm from './EmployeeForm'
import { exportHoursCSV } from '../../utils/reports'
import { getInitials, getStatusBadgeClass, getStatusLabel, getRoleLabel, getMissionTypeLabel, formatDate } from '../../utils/formatters'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { format, startOfMonth, endOfMonth, subMonths, isWithinInterval } from 'date-fns'
import { fr } from 'date-fns/locale'

export default function EmployeeDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const getById = useEmployeeStore((s) => s.getById)
  const update = useEmployeeStore((s) => s.update)
  const remove = useEmployeeStore((s) => s.remove)
  const missions = useMissionStore((s) => s.missions)
  const getClient = useClientStore((s) => s.getById)
  const [editing, setEditing] = useState(false)

  const emp = getById(Number(id))

  if (!emp) return (
    <div className="text-center py-16 text-slate-400">
      <p>Employé introuvable.</p>
      <button onClick={() => navigate('/team')} className="mt-4 text-primary underline text-sm">Retour</button>
    </div>
  )

  const empMissions = missions.filter((m) => m.teamIds?.includes(emp.id))

  const chartData = Array.from({ length: 6 }, (_, i) => {
    const month = subMonths(new Date(), 5 - i)
    const label = format(month, 'MMM', { locale: fr })
    const start = startOfMonth(month)
    const end = endOfMonth(month)
    const hours = empMissions
      .filter((m) => isWithinInterval(new Date(m.date), { start, end }) && (m.status === 'termine' || m.status === 'facture'))
      .reduce((sum, m) => sum + (m.report?.realDuration ?? m.duration ?? 0), 0)
    return { label, hours }
  })

  const handleSave = async (data) => {
    await update(emp.id, data)
    setEditing(false)
  }

  const handleDelete = async () => {
    if (!confirm(`Supprimer ${emp.firstName} ${emp.lastName} ?`)) return
    await remove(emp.id)
    navigate('/team')
  }

  return (
    <div className="space-y-4 max-w-2xl">
      <div className="flex items-center gap-2">
        <button onClick={() => navigate('/team')} className="p-2 rounded-xl hover:bg-slate-100" aria-label="Retour">
          <ArrowLeft size={20} className="text-slate-600" />
        </button>
        <div className="flex-1" />
        <button
          onClick={() => exportHoursCSV([emp], missions)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
          title="Exporter les heures en CSV"
        >
          <FileDown size={16} />
        </button>
        <button
          onClick={() => navigate(`/team/${emp.id}/agenda`)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
        >
          <CalendarDays size={16} /> Vue employé
        </button>
        <button onClick={() => setEditing(true)} className="p-2 rounded-xl hover:bg-slate-100 transition-colors" aria-label="Modifier">
          <Pencil size={18} className="text-slate-600" />
        </button>
        <button onClick={handleDelete} className="p-2 rounded-xl hover:bg-red-50 transition-colors" aria-label="Supprimer">
          <Trash2 size={18} className="text-red-500" />
        </button>
      </div>

      <Card className="p-5">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center text-white text-xl font-bold">
            {getInitials(emp.firstName, emp.lastName)}
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">{emp.firstName} {emp.lastName}</h1>
            <p className="text-slate-500 text-sm">{getRoleLabel(emp.role)}</p>
            <Badge className={`mt-1 ${getStatusBadgeClass(emp.status)}`}>{getStatusLabel(emp.status)}</Badge>
          </div>
        </div>
        <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-slate-50">
          {emp.phone && (
            <a href={`tel:${emp.phone}`} className="flex items-center gap-2 text-sm text-primary">
              <Phone size={16} />{emp.phone}
            </a>
          )}
          {emp.email && (
            <a href={`mailto:${emp.email}`} className="flex items-center gap-2 text-sm text-primary">
              <Mail size={16} />{emp.email}
            </a>
          )}
        </div>
        {emp.licenses?.length > 0 && (
          <div className="flex items-center gap-2 mt-3">
            <span className="text-xs text-slate-400">Permis :</span>
            {emp.licenses.map((l) => (
              <span key={l} className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium">{l}</span>
            ))}
          </div>
        )}
        {emp.availability?.length > 0 && (
          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs text-slate-400">Dispo :</span>
            {emp.availability.map((d) => (
              <span key={d} className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded capitalize">{d.slice(0, 3)}</span>
            ))}
          </div>
        )}
        {emp.notes && <p className="text-sm text-slate-500 mt-3 italic">{emp.notes}</p>}
      </Card>

      <Card className="p-5">
        <h2 className="font-semibold text-slate-900 mb-4">Heures par mois</h2>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94a3b8' }} />
            <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} />
            <Tooltip formatter={(v) => `${v}h`} />
            <Bar dataKey="hours" fill="#1a4731" radius={[4, 4, 0, 0]} name="Heures" />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <div>
        <h2 className="font-semibold text-slate-900 mb-3">Missions ({empMissions.length})</h2>
        {empMissions.length === 0 ? (
          <EmptyState title="Aucune mission assignée" />
        ) : (
          <div className="space-y-2">
            {empMissions.slice(0, 10).map((m) => (
              <Card key={m.id} onClick={() => navigate(`/missions/${m.id}`)} className="p-3">
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-900">{getMissionTypeLabel(m.type)}</p>
                    <p className="text-xs text-slate-500">{getClient(m.clientId)?.name} · {formatDate(m.date)}</p>
                  </div>
                  <Badge className={getStatusBadgeClass(m.status)}>{getStatusLabel(m.status)}</Badge>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Modal open={editing} onClose={() => setEditing(false)} title={`Modifier — ${emp.firstName} ${emp.lastName}`} size="lg">
        <EmployeeForm initial={emp} onSave={handleSave} onClose={() => setEditing(false)} />
      </Modal>
    </div>
  )
}
