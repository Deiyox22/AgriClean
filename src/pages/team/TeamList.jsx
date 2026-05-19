import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Phone, ChevronRight, Pencil, Trash2, Users, Check } from 'lucide-react'
import { useEmployeeStore } from '../../store/useEmployeeStore'
import { useMissionStore } from '../../store/useMissionStore'
import { useTeamStore, TEAM_COLORS, teamColorCls } from '../../store/useTeamStore'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Modal from '../../components/ui/Modal'
import EmptyState from '../../components/ui/EmptyState'
import SearchInput from '../../components/ui/SearchInput'
import { getInitials, getStatusLabel, getStatusBadgeClass, getRoleLabel } from '../../utils/formatters'
import { isToday } from 'date-fns'
import EmployeeForm from './EmployeeForm'
import { toast } from '../../store/useToastStore'

const avatarColors = ['bg-primary', 'bg-accent', 'bg-blue-500', 'bg-purple-500', 'bg-pink-500', 'bg-teal-500']
const EMP_COLORS   = ['bg-[#1a4731]','bg-[#d97706]','bg-blue-500','bg-purple-500','bg-teal-500','bg-pink-500','bg-rose-500','bg-cyan-600']

// ── Formulaire d'équipe ───────────────────────────────────────────────────────

function TeamForm({ initial, employees, onSave, onClose }) {
  const [form, setForm] = useState(initial ?? { name: '', description: '', color: 'green', memberIds: [] })
  const [saving, setSaving] = useState(false)
  const active = employees.filter((e) => e.status === 'actif')
  const inputCls = 'w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary'

  const toggle = (id) =>
    setForm((f) => ({
      ...f,
      memberIds: f.memberIds.includes(id) ? f.memberIds.filter((x) => x !== id) : [...f.memberIds, id],
    }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) return
    setSaving(true)
    try {
      await onSave(form)
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Nom */}
      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1">Nom de l'équipe *</label>
        <input required className={inputCls} value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Équipe Ramassage A…" />
      </div>

      {/* Description */}
      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1">Description (optionnel)</label>
        <input className={inputCls} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Zone Nord, lundi–mercredi…" />
      </div>

      {/* Couleur */}
      <div>
        <label className="block text-xs font-medium text-slate-600 mb-2">Couleur</label>
        <div className="flex gap-2 flex-wrap">
          {TEAM_COLORS.map((c) => (
            <button
              key={c.value}
              type="button"
              onClick={() => setForm((f) => ({ ...f, color: c.value }))}
              className={`w-8 h-8 rounded-full ${c.cls} flex items-center justify-center transition-all ${form.color === c.value ? 'ring-2 ring-offset-2 ring-slate-400 scale-110' : 'opacity-70 hover:opacity-100'}`}
              title={c.label}
            >
              {form.color === c.value && <Check size={14} className="text-white" />}
            </button>
          ))}
        </div>
      </div>

      {/* Membres */}
      <div>
        <label className="block text-xs font-medium text-slate-600 mb-2">
          Membres — {form.memberIds.length} sélectionné{form.memberIds.length > 1 ? 's' : ''}
        </label>
        {active.length === 0 ? (
          <p className="text-sm text-slate-400">Aucun employé actif disponible</p>
        ) : (
          <div className="space-y-2 max-h-52 overflow-y-auto">
            {active.map((emp, i) => {
              const sel = form.memberIds.includes(emp.id)
              return (
                <button
                  key={emp.id}
                  type="button"
                  onClick={() => toggle(emp.id)}
                  className={`w-full flex items-center gap-3 p-2.5 rounded-xl border-2 text-left transition-all ${sel ? 'border-primary bg-primary/5' : 'border-slate-100 hover:border-slate-200'}`}
                >
                  <div className={`w-8 h-8 rounded-full ${EMP_COLORS[i % EMP_COLORS.length]} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
                    {getInitials(emp.firstName, emp.lastName)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900">{emp.firstName} {emp.lastName}</p>
                    <p className="text-xs text-slate-400 capitalize">{emp.role}</p>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${sel ? 'bg-primary border-primary' : 'border-slate-300'}`}>
                    {sel && <Check size={11} className="text-white" />}
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>

      <div className="flex gap-3 pt-1">
        <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-600 hover:bg-slate-50">Annuler</button>
        <button type="submit" disabled={!form.name.trim() || saving} className="flex-1 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary-light disabled:opacity-40">
          {saving ? 'Enregistrement…' : initial ? 'Modifier' : 'Créer l\'équipe'}
        </button>
      </div>
    </form>
  )
}

// ── Carte d'équipe ────────────────────────────────────────────────────────────

function TeamCard({ team, employees, onEdit, onDelete }) {
  const members = (team.memberIds ?? []).map((id) => employees.find((e) => e.id === id)).filter(Boolean)
  const colorDot = teamColorCls(team.color)

  return (
    <Card className="p-4">
      <div className="flex items-start gap-3">
        {/* Color indicator */}
        <div className={`w-3 h-3 rounded-full ${colorDot} mt-1 shrink-0`} />

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="font-semibold text-slate-900 truncate">{team.name}</p>
              {team.description && <p className="text-xs text-slate-400 mt-0.5 truncate">{team.description}</p>}
            </div>
            <div className="flex gap-1 shrink-0">
              <button onClick={() => onEdit(team)} className="p-1.5 rounded-lg text-slate-400 hover:text-primary hover:bg-primary/5 transition-colors" aria-label="Modifier">
                <Pencil size={14} />
              </button>
              <button onClick={() => onDelete(team.id)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors" aria-label="Supprimer">
                <Trash2 size={14} />
              </button>
            </div>
          </div>

          {/* Members */}
          <div className="flex items-center gap-2 mt-3">
            <div className="flex -space-x-2">
              {members.slice(0, 5).map((emp, i) => (
                <div
                  key={emp.id}
                  className={`w-7 h-7 rounded-full ${EMP_COLORS[i % EMP_COLORS.length]} border-2 border-white flex items-center justify-center text-white text-[10px] font-bold`}
                  title={`${emp.firstName} ${emp.lastName}`}
                >
                  {getInitials(emp.firstName, emp.lastName)}
                </div>
              ))}
              {members.length > 5 && (
                <div className="w-7 h-7 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-slate-500 text-[10px] font-bold">
                  +{members.length - 5}
                </div>
              )}
            </div>
            <span className="text-xs text-slate-400">
              {members.length === 0 ? 'Aucun membre' : `${members.length} membre${members.length > 1 ? 's' : ''}`}
            </span>
          </div>
        </div>
      </div>
    </Card>
  )
}

// ── Page principale ───────────────────────────────────────────────────────────

export default function TeamList() {
  const employees = useEmployeeStore((s) => s.employees)
  const add       = useEmployeeStore((s) => s.add)
  const loading   = useEmployeeStore((s) => s.loading)
  const missions  = useMissionStore((s) => s.missions)
  const teams     = useTeamStore((s) => s.teams)
  const addTeam   = useTeamStore((s) => s.add)
  const updateTeam= useTeamStore((s) => s.update)
  const removeTeam= useTeamStore((s) => s.remove)
  const navigate  = useNavigate()
  const [activeTab, setActiveTab] = useState('employes') // 'employes' | 'equipes'
  const [search,    setSearch]    = useState('')
  const [showModal, setShowModal] = useState(false)
  const [teamModal, setTeamModal] = useState(null) // null | 'new' | team object

  const filtered = employees.filter((e) =>
    `${e.firstName} ${e.lastName}`.toLowerCase().includes(search.toLowerCase())
  )

  const getEmployeeStatus = (emp) => {
    if (emp.status !== 'actif') return emp.status
    return missions.some((m) => m.teamIds?.includes(emp.id) && m.status === 'en_cours' && isToday(new Date(m.date)))
      ? 'en_mission' : 'disponible'
  }

  const statusLabel = { disponible: 'Disponible', en_mission: 'En mission', conge: 'Congé', arret: 'Arrêt' }
  const statusClass = { disponible: 'bg-green-100 text-green-700', en_mission: 'bg-amber-100 text-amber-700', conge: 'bg-amber-100 text-amber-700', arret: 'bg-red-100 text-red-700' }

  const getMonthHours = (empId) => {
    const now = new Date()
    return missions
      .filter((m) => m.teamIds?.includes(empId) && (m.status === 'termine' || m.status === 'facture') && new Date(m.date).getMonth() === now.getMonth())
      .reduce((sum, m) => sum + (m.report?.realDuration ?? m.duration ?? 0), 0)
  }

  const handleSaveTeam = async (data) => {
    if (teamModal === 'new') {
      await addTeam(data)
      toast.success('Équipe créée')
    } else {
      await updateTeam(teamModal.id, data)
      toast.success('Équipe mise à jour')
    }
    setTeamModal(null)
  }

  const handleDeleteTeam = async (id) => {
    if (!confirm('Supprimer cette équipe ?')) return
    await removeTeam(id)
    toast.success('Équipe supprimée')
  }

  return (
    <div className="space-y-4">

      {/* ── Onglets ────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div className="flex gap-1 border-b border-slate-100 dark:border-slate-700 w-full">
          {[
            { key: 'employes', label: `Employés (${employees.length})` },
            { key: 'equipes',  label: `Équipes (${teams.length})` },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`px-4 py-2.5 text-sm font-semibold transition-colors border-b-2 -mb-px ${
                activeTab === t.key
                  ? 'border-primary text-primary'
                  : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Onglet Employés ────────────────────────────────────────────── */}
      {activeTab === 'employes' && (
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
              {[1, 2, 3, 4].map((i) => <div key={i} className="h-28 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />)}
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState title="Aucun employé" action={<button onClick={() => setShowModal(true)} className="px-4 py-2 bg-primary text-white rounded-xl text-sm">Nouvel employé</button>} />
          ) : (
            <div className="grid sm:grid-cols-2 gap-3">
              {filtered.map((emp, idx) => {
                const status = getEmployeeStatus(emp)
                const hours  = getMonthHours(emp.id)
                return (
                  <Card key={emp.id} onClick={() => navigate(`/team/${emp.id}`)} className="p-4">
                    <div className="flex items-start gap-3">
                      <div className={`w-12 h-12 rounded-2xl ${avatarColors[idx % avatarColors.length]} flex items-center justify-center text-white font-bold text-base shrink-0`}>
                        {getInitials(emp.firstName, emp.lastName)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="font-semibold text-slate-900 dark:text-white truncate">{emp.firstName} {emp.lastName}</p>
                          <ChevronRight size={16} className="text-slate-300 shrink-0" />
                        </div>
                        <p className="text-xs text-slate-500">{getRoleLabel(emp.role)}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge className={statusClass[status] ?? ''}>{statusLabel[status] ?? status}</Badge>
                          <span className="text-xs text-slate-400">{hours}h ce mois</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-3 mt-3 pt-3 border-t border-slate-50 dark:border-slate-700">
                      {emp.phone && <a href={`tel:${emp.phone}`} onClick={(e) => e.stopPropagation()} className="flex items-center gap-1 text-xs text-primary"><Phone size={12} />{emp.phone}</a>}
                      {emp.licenses?.length > 0 && <div className="flex gap-1">{emp.licenses.map((l) => <span key={l} className="text-xs bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-1.5 py-0.5 rounded">{l}</span>)}</div>}
                    </div>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Onglet Équipes ─────────────────────────────────────────────── */}
      {activeTab === 'equipes' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Groupes réutilisables pour l'assignation rapide aux missions
            </p>
            <button
              onClick={() => setTeamModal('new')}
              className="flex items-center gap-1.5 px-3 py-2 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary-light transition-colors shrink-0"
            >
              <Plus size={15} /> Nouvelle équipe
            </button>
          </div>

          {teams.length === 0 ? (
            <div
              onClick={() => setTeamModal('new')}
              className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl p-10 text-center cursor-pointer hover:border-primary/40 hover:bg-primary/[0.02] transition-all group"
            >
              <Users size={32} className="mx-auto text-slate-300 group-hover:text-primary/40 mb-3 transition-colors" />
              <p className="text-sm font-semibold text-slate-500 group-hover:text-primary/60">Créer votre première équipe</p>
              <p className="text-xs text-slate-400 mt-1">Ex : Équipe Ramassage, Équipe Nettoyage Nord…</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {teams.map((team) => (
                <TeamCard
                  key={team.id}
                  team={team}
                  employees={employees}
                  onEdit={(t) => setTeamModal(t)}
                  onDelete={handleDeleteTeam}
                />
              ))}
              <button
                onClick={() => setTeamModal('new')}
                className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl p-5 text-slate-400 hover:border-primary/40 hover:text-primary transition-all flex items-center justify-center gap-2 text-sm font-medium"
              >
                <Plus size={16} /> Nouvelle équipe
              </button>
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title="Nouvel employé" size="lg">
        <EmployeeForm onSave={async (data) => { await add(data); setShowModal(false) }} onClose={() => setShowModal(false)} />
      </Modal>

      <Modal
        open={!!teamModal}
        onClose={() => setTeamModal(null)}
        title={teamModal === 'new' ? 'Nouvelle équipe' : 'Modifier l\'équipe'}
        size="md"
      >
        <TeamForm
          initial={teamModal !== 'new' ? teamModal : undefined}
          employees={employees}
          onSave={handleSaveTeam}
          onClose={() => setTeamModal(null)}
        />
      </Modal>
    </div>
  )
}
