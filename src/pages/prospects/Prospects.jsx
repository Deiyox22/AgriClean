import { useState, useEffect, useMemo } from 'react'
import {
  Plus, Search, Phone, Mail, MapPin,
  Target, Trash2, Pencil, ArrowRight, UserPlus,
  X, Calendar, StickyNote, Building2,
} from 'lucide-react'
import { useProspectStore } from '../../store/useProspectStore'
import { useClientStore } from '../../store/useClientStore'
import { toast } from '../../store/useToastStore'
import Modal from '../../components/ui/Modal'
import Badge from '../../components/ui/Badge'
import EmptyState from '../../components/ui/EmptyState'

// ── Constantes ────────────────────────────────────────────────────────────────

const STATUSES = [
  { value: 'a_contacter',  label: 'À contacter',   color: 'bg-slate-100 text-slate-600' },
  { value: 'contacte',     label: 'Contacté',       color: 'bg-blue-100 text-blue-700' },
  { value: 'devis_envoye', label: 'Devis envoyé',   color: 'bg-amber-100 text-amber-700' },
  { value: 'client',       label: 'Converti',       color: 'bg-green-100 text-green-700' },
]

const TYPES = [
  { value: 'avicole',    label: 'Élevage avicole' },
  { value: 'agricole',   label: 'Agricole' },
  { value: 'industriel', label: 'Industriel' },
  { value: 'mixte',      label: 'Mixte' },
]

const DEPARTMENTS = [
  { value: '22', label: "22 — Côtes-d'Armor" },
  { value: '29', label: '29 — Finistère' },
  { value: '35', label: '35 — Ille-et-Vilaine' },
  { value: '56', label: '56 — Morbihan' },
]

const TYPE_COLORS = {
  avicole:    'bg-amber-100 text-amber-800',
  agricole:   'bg-green-100 text-green-800',
  industriel: 'bg-blue-100 text-blue-800',
  mixte:      'bg-purple-100 text-purple-800',
}

function statusMeta(value) {
  return STATUSES.find((s) => s.value === value) ?? STATUSES[0]
}

function deptLabel(value) {
  return DEPARTMENTS.find((d) => d.value === value)?.label ?? value
}

// ── Formulaire ────────────────────────────────────────────────────────────────

const EMPTY_FORM = {
  name: '', contactName: '', phone: '', email: '',
  type: 'avicole', department: '22', status: 'a_contacter',
  notes: '', lastContactAt: '',
}

function ProspectForm({ initial, onSave, onClose }) {
  const [form, setForm] = useState(initial ? {
    ...EMPTY_FORM,
    ...initial,
    lastContactAt: initial.lastContactAt ? initial.lastContactAt.slice(0, 10) : '',
  } : EMPTY_FORM)

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const handleSubmit = (e) => {
    e.preventDefault()
    onSave({
      ...form,
      lastContactAt: form.lastContactAt ? new Date(form.lastContactAt).toISOString() : null,
    })
  }

  const inputCls = 'w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary dark:bg-slate-800 dark:border-slate-700 dark:text-white'
  const labelCls = 'block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1'

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid sm:grid-cols-2 gap-3">
        <div className="sm:col-span-2">
          <label className={labelCls}>Nom de l'exploitation *</label>
          <input required className={inputCls} placeholder="EARL Dupont" value={form.name} onChange={(e) => set('name', e.target.value)} />
        </div>
        <div>
          <label className={labelCls}>Responsable</label>
          <input className={inputCls} placeholder="Jean Dupont" value={form.contactName} onChange={(e) => set('contactName', e.target.value)} />
        </div>
        <div>
          <label className={labelCls}>Téléphone</label>
          <input type="tel" className={inputCls} placeholder="06 00 00 00 00" value={form.phone} onChange={(e) => set('phone', e.target.value)} />
        </div>
        <div className="sm:col-span-2">
          <label className={labelCls}>Email</label>
          <input type="email" className={inputCls} placeholder="contact@exploitation.fr" value={form.email} onChange={(e) => set('email', e.target.value)} />
        </div>
        <div>
          <label className={labelCls}>Type d'activité</label>
          <select className={inputCls} value={form.type} onChange={(e) => set('type', e.target.value)}>
            {TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
        <div>
          <label className={labelCls}>Département</label>
          <select className={inputCls} value={form.department} onChange={(e) => set('department', e.target.value)}>
            {DEPARTMENTS.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
          </select>
        </div>
        <div>
          <label className={labelCls}>Statut</label>
          <select className={inputCls} value={form.status} onChange={(e) => set('status', e.target.value)}>
            {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>
        <div>
          <label className={labelCls}>Dernier contact</label>
          <input type="date" className={inputCls} value={form.lastContactAt} onChange={(e) => set('lastContactAt', e.target.value)} />
        </div>
        <div className="sm:col-span-2">
          <label className={labelCls}>Notes</label>
          <textarea rows={3} className={inputCls} placeholder="Contexte, besoins identifiés, prochaine étape…" value={form.notes} onChange={(e) => set('notes', e.target.value)} />
        </div>
      </div>
      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onClose}
          className="flex-1 py-2.5 rounded-2xl border-2 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-sm hover:bg-slate-50 dark:hover:bg-slate-800">
          Annuler
        </button>
        <button type="submit"
          className="flex-1 py-2.5 rounded-2xl bg-primary text-white font-semibold text-sm hover:bg-primary/90">
          Enregistrer
        </button>
      </div>
    </form>
  )
}

// ── Panneau de détail ────────────────────────────────────────────────────────

function ProspectDrawer({ prospect, onClose, onEdit, onDelete, onConvert, onStatusChange }) {
  const meta = statusMeta(prospect.status)

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm" onClick={onClose} />

      {/* Panneau */}
      <div className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md bg-white dark:bg-slate-900 shadow-2xl flex flex-col">

        {/* Header */}
        <div className="flex items-start justify-between gap-3 px-6 py-5 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="min-w-0">
            <p className="text-lg font-bold text-slate-900 dark:text-white leading-tight">{prospect.name}</p>
            {prospect.contactName && (
              <p className="text-sm text-slate-500 mt-0.5">{prospect.contactName}</p>
            )}
          </div>
          <button onClick={onClose} className="shrink-0 p-2 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Contenu scrollable */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

          {/* Statut + type */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-xs font-semibold px-3 py-1 rounded-full ${meta.color}`}>{meta.label}</span>
            <span className={`text-xs font-semibold px-3 py-1 rounded-full ${TYPE_COLORS[prospect.type] ?? 'bg-slate-100 text-slate-600'}`}>
              {TYPES.find((t) => t.value === prospect.type)?.label ?? prospect.type}
            </span>
          </div>

          {/* Coordonnées */}
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3">Coordonnées</p>
            <div className="space-y-3">
              {prospect.phone ? (
                <a href={`tel:${prospect.phone}`}
                  className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-primary/5 transition-colors group">
                  <div className="w-8 h-8 rounded-lg bg-white dark:bg-slate-700 flex items-center justify-center shrink-0 shadow-sm">
                    <Phone size={14} className="text-primary" />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400">Téléphone</p>
                    <p className="text-sm font-semibold text-slate-800 dark:text-white group-hover:text-primary transition-colors">{prospect.phone}</p>
                  </div>
                </a>
              ) : (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800 opacity-50">
                  <div className="w-8 h-8 rounded-lg bg-white dark:bg-slate-700 flex items-center justify-center shrink-0">
                    <Phone size={14} className="text-slate-400" />
                  </div>
                  <p className="text-sm text-slate-400 italic">Téléphone non renseigné</p>
                </div>
              )}
              {prospect.email ? (
                <a href={`mailto:${prospect.email}`}
                  className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-primary/5 transition-colors group">
                  <div className="w-8 h-8 rounded-lg bg-white dark:bg-slate-700 flex items-center justify-center shrink-0 shadow-sm">
                    <Mail size={14} className="text-primary" />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400">Email</p>
                    <p className="text-sm font-semibold text-slate-800 dark:text-white group-hover:text-primary transition-colors">{prospect.email}</p>
                  </div>
                </a>
              ) : (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800 opacity-50">
                  <div className="w-8 h-8 rounded-lg bg-white dark:bg-slate-700 flex items-center justify-center shrink-0">
                    <Mail size={14} className="text-slate-400" />
                  </div>
                  <p className="text-sm text-slate-400 italic">Email non renseigné</p>
                </div>
              )}
              {prospect.department && (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800">
                  <div className="w-8 h-8 rounded-lg bg-white dark:bg-slate-700 flex items-center justify-center shrink-0 shadow-sm">
                    <MapPin size={14} className="text-primary" />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400">Département</p>
                    <p className="text-sm font-semibold text-slate-800 dark:text-white">{deptLabel(prospect.department)}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Dernier contact */}
          {prospect.lastContactAt && (
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3">Suivi commercial</p>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800">
                <div className="w-8 h-8 rounded-lg bg-white dark:bg-slate-700 flex items-center justify-center shrink-0 shadow-sm">
                  <Calendar size={14} className="text-primary" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-400">Dernier contact</p>
                  <p className="text-sm font-semibold text-slate-800 dark:text-white">
                    {new Date(prospect.lastContactAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3">Notes</p>
            {prospect.notes ? (
              <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800">
                <div className="flex gap-2">
                  <StickyNote size={15} className="text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">{prospect.notes}</p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-400 italic p-4 rounded-xl bg-slate-50 dark:bg-slate-800">Aucune note.</p>
            )}
          </div>

          {/* Changer le statut */}
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3">Avancement</p>
            <div className="grid grid-cols-2 gap-2">
              {STATUSES.filter((s) => s.value !== 'client').map((s) => (
                <button key={s.value}
                  onClick={() => onStatusChange(prospect.id, s.value)}
                  className={`py-2.5 rounded-xl text-xs font-semibold transition-colors border ${
                    prospect.status === s.value
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:border-slate-300 dark:hover:border-slate-600'
                  }`}>
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Actions footer */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 shrink-0 flex gap-2">
          <button onClick={() => onEdit(prospect)}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
            <Pencil size={15} /> Modifier
          </button>
          <button onClick={() => onConvert(prospect)}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-green-600 text-white font-semibold text-sm hover:bg-green-700 transition-colors">
            <UserPlus size={15} /> Convertir
          </button>
          <button onClick={() => onDelete(prospect.id)}
            className="p-2.5 rounded-xl border-2 border-red-100 text-red-400 hover:bg-red-50 hover:border-red-200 hover:text-red-500 transition-colors">
            <Trash2 size={15} />
          </button>
        </div>
      </div>
    </>
  )
}

// ── Carte prospect ────────────────────────────────────────────────────────────

function ProspectCard({ prospect, onOpen, onStatusChange }) {
  const meta = statusMeta(prospect.status)

  return (
    <div
      onClick={onOpen}
      className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-4 hover:shadow-md hover:border-primary/20 transition-all cursor-pointer"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <p className="font-semibold text-slate-900 dark:text-white truncate">{prospect.name}</p>
          {prospect.contactName && (
            <p className="text-xs text-slate-500 mt-0.5">{prospect.contactName}</p>
          )}
        </div>
        <span className={`shrink-0 text-[11px] font-semibold px-2.5 py-1 rounded-full ${meta.color}`}>
          {meta.label}
        </span>
      </div>

      <div className="space-y-1.5 mb-3">
        {prospect.phone && (
          <p className="flex items-center gap-2 text-xs text-slate-500">
            <Phone size={13} /> {prospect.phone}
          </p>
        )}
        {prospect.email && (
          <p className="flex items-center gap-2 text-xs text-slate-500 truncate">
            <Mail size={13} /> {prospect.email}
          </p>
        )}
        {prospect.department && (
          <p className="flex items-center gap-2 text-xs text-slate-500">
            <MapPin size={13} /> {deptLabel(prospect.department)}
          </p>
        )}
      </div>

      <div className="flex items-center gap-2 mb-3">
        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${TYPE_COLORS[prospect.type] ?? 'bg-slate-100 text-slate-600'}`}>
          {TYPES.find((t) => t.value === prospect.type)?.label ?? prospect.type}
        </span>
        {prospect.lastContactAt && (
          <span className="text-[11px] text-slate-400">
            {new Date(prospect.lastContactAt).toLocaleDateString('fr-FR')}
          </span>
        )}
      </div>

      {prospect.notes && (
        <p className="text-xs text-slate-400 italic line-clamp-2">{prospect.notes}</p>
      )}

      {/* Barre de statut rapide */}
      <div className="flex items-center gap-1 pt-3 mt-3 border-t border-slate-100 dark:border-slate-800" onClick={(e) => e.stopPropagation()}>
        {STATUSES.filter((s) => s.value !== 'client').map((s) => (
          <button key={s.value}
            onClick={() => onStatusChange(prospect.id, s.value)}
            className={`flex-1 py-1 rounded-lg text-[10px] font-semibold transition-colors border ${
              prospect.status === s.value
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-slate-200 dark:border-slate-700 text-slate-400 hover:border-slate-300'
            }`}>
            {s.label}
          </button>
        ))}
      </div>
    </div>
  )
}

// ── Pipeline kanban ───────────────────────────────────────────────────────────

function Pipeline({ prospects, onOpen, onStatusChange }) {
  const cols = STATUSES.map((s) => ({
    ...s,
    items: prospects.filter((p) => p.status === s.value),
  }))

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {cols.map((col) => (
        <div key={col.value}>
          <div className="flex items-center gap-2 mb-3">
            <span className={`w-2 h-2 rounded-full ${col.color.split(' ')[0]}`} />
            <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide">{col.label}</span>
            <span className="ml-auto text-xs font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
              {col.items.length}
            </span>
          </div>
          <div className="space-y-3">
            {col.items.length === 0 ? (
              <div className="border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl py-8 text-center">
                <p className="text-xs text-slate-400">Aucun prospect</p>
              </div>
            ) : (
              col.items.map((p) => (
                <ProspectCard key={p.id} prospect={p}
                  onOpen={() => onOpen(p)}
                  onStatusChange={onStatusChange} />
              ))
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Page principale ───────────────────────────────────────────────────────────

export default function Prospects() {
  const { prospects, loading, load, add, update, remove } = useProspectStore()
  const addClient = useClientStore((s) => s.add)

  const [search, setSearch]       = useState('')
  const [filterDept, setFilterDept] = useState('')
  const [filterType, setFilterType] = useState('')
  const [modal, setModal]         = useState(null) // null | { mode: 'add' | 'edit', data? }
  const [selected, setSelected]   = useState(null) // prospect ouvert dans le drawer
  const [convertTarget, setConvertTarget] = useState(null)
  const [deleteTarget, setDeleteTarget]   = useState(null)

  useEffect(() => { load() }, [])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return prospects.filter((p) =>
      (!q || p.name.toLowerCase().includes(q) || (p.contactName ?? '').toLowerCase().includes(q)) &&
      (!filterDept || p.department === filterDept) &&
      (!filterType || p.type === filterType)
    )
  }, [prospects, search, filterDept, filterType])

  const handleSave = async (form) => {
    try {
      if (modal.mode === 'add') {
        await add(form)
        toast.success('Prospect ajouté')
      } else {
        await update(modal.data.id, form)
        toast.success('Prospect mis à jour')
      }
      setModal(null)
    } catch {
      toast.error('Erreur lors de la sauvegarde')
    }
  }

  const handleDelete = async (id) => {
    try {
      await remove(id)
      setDeleteTarget(null)
      toast.success('Prospect supprimé')
    } catch {
      toast.error('Erreur lors de la suppression')
    }
  }

  const handleStatusChange = async (id, status) => {
    try {
      await update(id, { status })
      if (selected?.id === id) setSelected((p) => ({ ...p, status }))
    } catch {
      toast.error('Erreur de mise à jour')
    }
  }

  const handleConvert = async (prospect) => {
    try {
      await addClient({
        name: prospect.name,
        siret: '',
        type: prospect.type,
        status: 'actif',
        address: { street: '', city: '', zip: '', country: 'France' },
        contacts: prospect.contactName
          ? [{ name: prospect.contactName, role: '', phone: prospect.phone ?? '', email: prospect.email ?? '', preferred: true }]
          : [],
        notes: prospect.notes ?? '',
        documents: [],
      })
      await update(prospect.id, { status: 'client' })
      setConvertTarget(null)
      toast.success(`${prospect.name} converti en client`)
    } catch {
      toast.error('Erreur lors de la conversion')
    }
  }

  const counts = useMemo(() =>
    Object.fromEntries(STATUSES.map((s) => [s.value, prospects.filter((p) => p.status === s.value).length])),
    [prospects]
  )

  return (
    <div className="p-4 md:p-6 max-w-screen-2xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">Prospects</h1>
          <p className="text-sm text-slate-500 mt-0.5">{prospects.length} prospect{prospects.length > 1 ? 's' : ''} au total</p>
        </div>
        <button onClick={() => setModal({ mode: 'add' })}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-2xl font-semibold text-sm hover:bg-primary/90 shadow-sm shadow-primary/20 transition-colors">
          <Plus size={17} /> Nouveau prospect
        </button>
      </div>

      {/* KPI pipeline */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {STATUSES.map((s) => (
          <div key={s.value} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 px-4 py-3">
            <p className="text-2xl font-black text-slate-900 dark:text-white">{counts[s.value] ?? 0}</p>
            <p className={`text-xs font-semibold mt-0.5 px-2 py-0.5 rounded-full inline-block ${s.color}`}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filtres */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un prospect…"
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm bg-white dark:bg-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          />
        </div>
        <select value={filterDept} onChange={(e) => setFilterDept(e.target.value)}
          className="px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm bg-white dark:bg-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary">
          <option value="">Tous les départements</option>
          {DEPARTMENTS.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
        </select>
        <select value={filterType} onChange={(e) => setFilterType(e.target.value)}
          className="px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm bg-white dark:bg-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary">
          <option value="">Tous les types</option>
          {TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
      </div>

      {/* Pipeline */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Target}
          title="Aucun prospect"
          description="Ajoutez vos premiers prospects pour démarrer votre pipeline commercial."
          action={
            <button onClick={() => setModal({ mode: 'add' })}
              className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-2xl font-semibold text-sm hover:bg-primary/90 transition-colors">
              <Plus size={16} /> Ajouter un prospect
            </button>
          }
        />
      ) : (
        <Pipeline
          prospects={filtered}
          onOpen={setSelected}
          onStatusChange={handleStatusChange}
        />
      )}

      {/* Modal ajout/édition */}
      {modal && (
        <Modal
          open
          title={modal.mode === 'add' ? 'Nouveau prospect' : 'Modifier le prospect'}
          onClose={() => setModal(null)}
        >
          <ProspectForm
            initial={modal.data}
            onSave={handleSave}
            onClose={() => setModal(null)}
          />
        </Modal>
      )}

      {/* Modal suppression */}
      {deleteTarget && (
        <Modal open title="Supprimer ce prospect ?" onClose={() => setDeleteTarget(null)}>
          <p className="text-sm text-slate-500 mb-6">Cette action est irréversible.</p>
          <div className="flex gap-3">
            <button onClick={() => setDeleteTarget(null)}
              className="flex-1 py-2.5 rounded-2xl border-2 border-slate-200 text-slate-700 font-semibold text-sm hover:bg-slate-50">
              Annuler
            </button>
            <button onClick={() => handleDelete(deleteTarget)}
              className="flex-1 py-2.5 rounded-2xl bg-red-500 text-white font-semibold text-sm hover:bg-red-600">
              Supprimer
            </button>
          </div>
        </Modal>
      )}

      {/* Modal conversion en client */}
      {convertTarget && (
        <Modal open title="Convertir en client ?" onClose={() => setConvertTarget(null)}>
          <p className="text-sm text-slate-500 mb-1">
            <span className="font-semibold text-slate-800 dark:text-white">{convertTarget.name}</span> sera créé comme client actif.
          </p>
          <p className="text-sm text-slate-500 mb-6">Les coordonnées et le type d'activité seront repris automatiquement.</p>
          <div className="flex gap-3">
            <button onClick={() => setConvertTarget(null)}
              className="flex-1 py-2.5 rounded-2xl border-2 border-slate-200 text-slate-700 font-semibold text-sm hover:bg-slate-50">
              Annuler
            </button>
            <button onClick={() => handleConvert(convertTarget)}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-green-600 text-white font-semibold text-sm hover:bg-green-700">
              <ArrowRight size={16} /> Convertir
            </button>
          </div>
        </Modal>
      )}

      {/* Panneau de détail */}
      {selected && (
        <ProspectDrawer
          prospect={selected}
          onClose={() => setSelected(null)}
          onEdit={(p) => {
            setSelected(null)
            setModal({ mode: 'edit', data: p })
          }}
          onDelete={(id) => {
            setSelected(null)
            setDeleteTarget(id)
          }}
          onConvert={(p) => {
            setSelected(null)
            setConvertTarget(p)
          }}
          onStatusChange={handleStatusChange}
        />
      )}
    </div>
  )
}
