import { useState } from 'react'
import { Plus, Truck, Wrench, AlertTriangle, History, X, ChevronDown, ChevronUp } from 'lucide-react'
import { useVehicleStore } from '../../store/useVehicleStore'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Modal from '../../components/ui/Modal'
import EmptyState from '../../components/ui/EmptyState'
import { getStatusLabel, getStatusBadgeClass, formatDate } from '../../utils/formatters'
import { differenceInDays, format } from 'date-fns'
import { toast } from '../../store/useToastStore'

const TABS = ['Véhicules', 'Matériel']

const MAINTENANCE_TYPES = [
  { value: 'revision',   label: 'Révision'        },
  { value: 'ct',         label: 'Contrôle technique' },
  { value: 'reparation', label: 'Réparation'      },
  { value: 'vidange',    label: 'Vidange'          },
  { value: 'pneus',      label: 'Pneumatiques'    },
  { value: 'autre',      label: 'Autre'            },
]

const catLabel = { haute_pression: 'Haute pression', aspirateur: 'Aspirateur', pompe: 'Pompe', autre: 'Autre' }
const inputCls = 'w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary'
const labelCls = 'block text-xs font-medium text-slate-600 mb-1'

// ── Forms ────────────────────────────────────────────────────────────────────

function VehicleForm({ initial, onSave, onClose }) {
  const [form, setForm] = useState(initial ?? { name: '', plate: '', type: 'utilitaire', mileage: 0, nextService: '', nextCT: '', status: 'operationnel' })
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSave(form) }} className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div><label className={labelCls}>Nom *</label><input required className={inputCls} value={form.name} onChange={(e) => set('name', e.target.value)} /></div>
        <div><label className={labelCls}>Immatriculation</label><input className={inputCls} value={form.plate} onChange={(e) => set('plate', e.target.value)} /></div>
        <div><label className={labelCls}>Type</label>
          <select className={inputCls} value={form.type} onChange={(e) => set('type', e.target.value)}>
            <option value="utilitaire">Utilitaire</option><option value="camion">Camion</option><option value="tracteur">Tracteur</option>
          </select>
        </div>
        <div><label className={labelCls}>Kilométrage</label><input type="number" min="0" className={inputCls} value={form.mileage} onChange={(e) => set('mileage', Number(e.target.value))} /></div>
        <div><label className={labelCls}>Prochaine révision</label><input type="date" className={inputCls} value={form.nextService?.substring(0, 10) ?? ''} onChange={(e) => set('nextService', e.target.value)} /></div>
        <div><label className={labelCls}>Prochain CT</label><input type="date" className={inputCls} value={form.nextCT?.substring(0, 10) ?? ''} onChange={(e) => set('nextCT', e.target.value)} /></div>
        <div><label className={labelCls}>Statut</label>
          <select className={inputCls} value={form.status} onChange={(e) => set('status', e.target.value)}>
            <option value="operationnel">Opérationnel</option><option value="maintenance">En maintenance</option><option value="hors_service">Hors service</option>
          </select>
        </div>
      </div>
      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50">Annuler</button>
        <button type="submit" className="flex-1 py-2.5 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary-light">Enregistrer</button>
      </div>
    </form>
  )
}

function EquipmentForm({ initial, onSave, onClose }) {
  const [form, setForm] = useState(initial ?? { name: '', category: 'haute_pression', status: 'operationnel', lastCheck: '' })
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSave(form) }} className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="col-span-2"><label className={labelCls}>Nom *</label><input required className={inputCls} value={form.name} onChange={(e) => set('name', e.target.value)} /></div>
        <div><label className={labelCls}>Catégorie</label>
          <select className={inputCls} value={form.category} onChange={(e) => set('category', e.target.value)}>
            <option value="haute_pression">Haute pression</option><option value="aspirateur">Aspirateur industriel</option><option value="pompe">Pompe</option><option value="autre">Autre</option>
          </select>
        </div>
        <div><label className={labelCls}>Statut</label>
          <select className={inputCls} value={form.status} onChange={(e) => set('status', e.target.value)}>
            <option value="operationnel">Opérationnel</option><option value="maintenance">En maintenance</option><option value="hors_service">Hors service</option>
          </select>
        </div>
        <div><label className={labelCls}>Dernier contrôle</label><input type="date" className={inputCls} value={form.lastCheck?.substring(0, 10) ?? ''} onChange={(e) => set('lastCheck', e.target.value)} /></div>
      </div>
      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50">Annuler</button>
        <button type="submit" className="flex-1 py-2.5 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary-light">Enregistrer</button>
      </div>
    </form>
  )
}

// ── Maintenance log section ────────────────────────────────────────────────────

function MaintenanceLog({ vehicle, onUpdate }) {
  const log     = vehicle.maintenanceLog ?? []
  const [open,   setOpen]   = useState(false)
  const [adding, setAdding] = useState(false)
  const [form,   setForm]   = useState({ date: format(new Date(), 'yyyy-MM-dd'), type: 'revision', km: vehicle.mileage ?? '', notes: '' })
  const [saving, setSaving] = useState(false)
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const handleAdd = async () => {
    if (!form.date) return
    setSaving(true)
    try {
      const entry = { id: Date.now(), ...form, km: Number(form.km) || 0 }
      await onUpdate([entry, ...log])
      setForm({ date: format(new Date(), 'yyyy-MM-dd'), type: 'revision', km: vehicle.mileage ?? '', notes: '' })
      setAdding(false)
      toast.success('Entrée de maintenance ajoutée')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    await onUpdate(log.filter((e) => e.id !== id))
  }

  return (
    <div className="mt-3 border-t border-slate-100 pt-3">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-700 transition-colors w-full"
      >
        <History size={13} />
        Historique maintenance ({log.length})
        {open ? <ChevronUp size={13} className="ml-auto" /> : <ChevronDown size={13} className="ml-auto" />}
      </button>

      {open && (
        <div className="mt-3 space-y-2">
          {log.map((entry) => {
            const typeLabel = MAINTENANCE_TYPES.find((t) => t.value === entry.type)?.label ?? entry.type
            return (
              <div key={entry.id} className="flex items-start gap-2 p-2.5 bg-slate-50 rounded-xl">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-700">{typeLabel}</span>
                    <span className="text-xs text-slate-400">{formatDate(entry.date)}</span>
                    {entry.km > 0 && <span className="text-xs text-slate-400">{entry.km.toLocaleString('fr-FR')} km</span>}
                  </div>
                  {entry.notes && <p className="text-xs text-slate-500 mt-0.5 truncate">{entry.notes}</p>}
                </div>
                <button onClick={() => handleDelete(entry.id)} className="p-1 text-slate-300 hover:text-red-400 rounded transition-colors shrink-0" aria-label="Supprimer">
                  <X size={13} />
                </button>
              </div>
            )
          })}

          {adding ? (
            <div className="p-3 bg-white border border-primary/20 rounded-xl space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div><label className="block text-[10px] font-medium text-slate-500 mb-1">Date</label><input type="date" className={inputCls} value={form.date} onChange={(e) => set('date', e.target.value)} /></div>
                <div><label className="block text-[10px] font-medium text-slate-500 mb-1">Type</label>
                  <select className={inputCls} value={form.type} onChange={(e) => set('type', e.target.value)}>
                    {MAINTENANCE_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div><label className="block text-[10px] font-medium text-slate-500 mb-1">Kilométrage</label><input type="number" min="0" className={inputCls} value={form.km} onChange={(e) => set('km', e.target.value)} /></div>
                <div><label className="block text-[10px] font-medium text-slate-500 mb-1">Notes</label><input className={inputCls} value={form.notes} onChange={(e) => set('notes', e.target.value)} placeholder="Prestataire, observations…" /></div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setAdding(false)} className="flex-1 py-2 rounded-xl border border-slate-200 text-xs text-slate-600 hover:bg-slate-50">Annuler</button>
                <button onClick={handleAdd} disabled={saving} className="flex-1 py-2 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary-light disabled:opacity-40">{saving ? '…' : 'Ajouter'}</button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setAdding(true)}
              className="w-full py-2 rounded-xl border-2 border-dashed border-slate-200 text-xs text-slate-400 hover:border-primary/30 hover:text-primary transition-colors flex items-center justify-center gap-1"
            >
              <Plus size={12} /> Ajouter une entrée
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function Fleet() {
  const vehicles       = useVehicleStore((s) => s.vehicles)
  const equipment      = useVehicleStore((s) => s.equipment)
  const addVehicle     = useVehicleStore((s) => s.addVehicle)
  const updateVehicle  = useVehicleStore((s) => s.updateVehicle)
  const removeVehicle  = useVehicleStore((s) => s.removeVehicle)
  const addEquipment   = useVehicleStore((s) => s.addEquipment)
  const updateEquipment = useVehicleStore((s) => s.updateEquipment)
  const removeEquipment = useVehicleStore((s) => s.removeEquipment)
  const [tab,   setTab]   = useState('Véhicules')
  const [modal, setModal] = useState(null)

  const getDaysUntil  = (date) => date ? differenceInDays(new Date(date), new Date()) : null
  const getServiceAlert = (v) => {
    const days = getDaysUntil(v.nextService)
    return days !== null && days < 30 ? days : null
  }
  const getCtAlert = (v) => {
    const days = getDaysUntil(v.nextCT)
    return days !== null && days < 60 ? days : null
  }

  const handleSaveVehicle = async (data) => {
    if (modal.data) await updateVehicle(modal.data.id, data)
    else await addVehicle(data)
    setModal(null)
    toast.success(modal.data ? 'Véhicule mis à jour' : 'Véhicule ajouté')
  }

  const handleSaveEquipment = async (data) => {
    if (modal.data) await updateEquipment(modal.data.id, data)
    else await addEquipment(data)
    setModal(null)
    toast.success(modal.data ? 'Matériel mis à jour' : 'Matériel ajouté')
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex gap-1 border-b border-slate-100">
          {TABS.map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${tab === t ? 'border-primary text-primary' : 'border-transparent text-slate-500'}`}>
              {t}
            </button>
          ))}
        </div>
        <button onClick={() => setModal({ type: tab === 'Véhicules' ? 'vehicle' : 'equipment' })}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary-light min-h-[44px]">
          <Plus size={16} /> Ajouter
        </button>
      </div>

      {tab === 'Véhicules' && (
        vehicles.length === 0 ? <EmptyState title="Aucun véhicule" /> : (
          <div className="space-y-3">
            {vehicles.map((v) => {
              const sAlert = getServiceAlert(v)
              const ctAlert = getCtAlert(v)
              return (
                <Card key={v.id} className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                      <Truck size={20} className="text-slate-500" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-slate-900">{v.name}</p>
                        {sAlert !== null && (
                          <span className="flex items-center gap-1 text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                            <AlertTriangle size={11} /> Révision {sAlert < 0 ? `en retard` : `dans ${sAlert}j`}
                          </span>
                        )}
                        {ctAlert !== null && (
                          <span className="flex items-center gap-1 text-xs text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                            <AlertTriangle size={11} /> CT {ctAlert < 0 ? `expiré` : `dans ${ctAlert}j`}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500">{v.plate} · {(v.mileage ?? 0).toLocaleString('fr-FR')} km</p>
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <Badge className={getStatusBadgeClass(v.status)}>{getStatusLabel(v.status)}</Badge>
                        {v.nextService && <span className="text-xs text-slate-400">Révision : {formatDate(v.nextService)}</span>}
                        {v.nextCT && <span className="text-xs text-slate-400">CT : {formatDate(v.nextCT)}</span>}
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button onClick={() => setModal({ type: 'vehicle', data: v })} className="text-xs text-primary hover:underline">Modifier</button>
                      <button onClick={() => { if (confirm('Supprimer ?')) { removeVehicle(v.id); toast.success('Véhicule supprimé') } }} className="text-xs text-red-500 hover:underline">Suppr.</button>
                    </div>
                  </div>
                  <MaintenanceLog
                    vehicle={v}
                    onUpdate={(log) => updateVehicle(v.id, { maintenanceLog: log })}
                  />
                </Card>
              )
            })}
          </div>
        )
      )}

      {tab === 'Matériel' && (
        equipment.length === 0 ? <EmptyState title="Aucun matériel" /> : (
          <div className="space-y-3">
            {equipment.map((eq) => (
              <Card key={eq.id} className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                    <Wrench size={20} className="text-slate-500" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-slate-900">{eq.name}</p>
                    <p className="text-xs text-slate-500">{catLabel[eq.category] ?? eq.category}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge className={getStatusBadgeClass(eq.status)}>{getStatusLabel(eq.status)}</Badge>
                      {eq.lastCheck && <span className="text-xs text-slate-400">Dernier contrôle : {formatDate(eq.lastCheck)}</span>}
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button onClick={() => setModal({ type: 'equipment', data: eq })} className="text-xs text-primary hover:underline">Modifier</button>
                    <button onClick={() => { if (confirm('Supprimer ?')) { removeEquipment(eq.id); toast.success('Matériel supprimé') } }} className="text-xs text-red-500 hover:underline">Suppr.</button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )
      )}

      <Modal
        open={!!modal}
        onClose={() => setModal(null)}
        title={modal?.type === 'vehicle'
          ? (modal.data ? 'Modifier véhicule' : 'Nouveau véhicule')
          : (modal?.data ? 'Modifier matériel' : 'Nouveau matériel')}
      >
        {modal?.type === 'vehicle' && (
          <VehicleForm initial={modal.data} onSave={handleSaveVehicle} onClose={() => setModal(null)} />
        )}
        {modal?.type === 'equipment' && (
          <EquipmentForm initial={modal.data} onSave={handleSaveEquipment} onClose={() => setModal(null)} />
        )}
      </Modal>
    </div>
  )
}
