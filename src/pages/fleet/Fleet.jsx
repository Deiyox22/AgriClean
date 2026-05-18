import { useState } from 'react'
import { Plus, Truck, Wrench, AlertTriangle } from 'lucide-react'
import { useVehicleStore } from '../../store/useVehicleStore'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Modal from '../../components/ui/Modal'
import EmptyState from '../../components/ui/EmptyState'
import { getStatusLabel, getStatusBadgeClass, formatDate } from '../../utils/formatters'
import { differenceInDays } from 'date-fns'

const TABS = ['Véhicules', 'Matériel']

function VehicleForm({ initial, onSave, onClose }) {
  const [form, setForm] = useState(initial ?? { name: '', plate: '', type: 'utilitaire', mileage: 0, nextService: '', nextCT: '', status: 'operationnel' })
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))
  const inputCls = 'w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary'
  const labelCls = 'block text-xs font-medium text-slate-600 mb-1'
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
        <div><label className={labelCls}>Kilométrage</label><input type="number" className={inputCls} value={form.mileage} onChange={(e) => set('mileage', Number(e.target.value))} /></div>
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
  const inputCls = 'w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary'
  const labelCls = 'block text-xs font-medium text-slate-600 mb-1'
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

export default function Fleet() {
  const vehicles = useVehicleStore((s) => s.vehicles)
  const equipment = useVehicleStore((s) => s.equipment)
  const addVehicle = useVehicleStore((s) => s.addVehicle)
  const updateVehicle = useVehicleStore((s) => s.updateVehicle)
  const removeVehicle = useVehicleStore((s) => s.removeVehicle)
  const addEquipment = useVehicleStore((s) => s.addEquipment)
  const updateEquipment = useVehicleStore((s) => s.updateEquipment)
  const removeEquipment = useVehicleStore((s) => s.removeEquipment)
  const [tab, setTab] = useState('Véhicules')
  const [modal, setModal] = useState(null)

  const getDaysUntil = (date) => date ? differenceInDays(new Date(date), new Date()) : null

  const getServiceAlert = (v) => {
    const days = getDaysUntil(v.nextService)
    return days !== null && days < 30 ? days : null
  }

  const catLabel = { haute_pression: 'Haute pression', aspirateur: 'Aspirateur', pompe: 'Pompe', autre: 'Autre' }

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
              const alert = getServiceAlert(v)
              return (
                <Card key={v.id} className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                      <Truck size={20} className="text-slate-500" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-slate-900">{v.name}</p>
                        {alert !== null && (
                          <span className="flex items-center gap-1 text-xs text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                            <AlertTriangle size={12} /> Révision dans {alert}j
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500">{v.plate} · {v.mileage?.toLocaleString('fr-FR')} km</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge className={getStatusBadgeClass(v.status)}>{getStatusLabel(v.status)}</Badge>
                        {v.nextService && <span className="text-xs text-slate-400">Révision : {formatDate(v.nextService)}</span>}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => setModal({ type: 'vehicle', data: v })} className="text-xs text-primary hover:underline">Modifier</button>
                      <button onClick={() => { if (confirm('Supprimer ?')) removeVehicle(v.id) }} className="text-xs text-red-500 hover:underline">Suppr.</button>
                    </div>
                  </div>
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
                  <div className="flex gap-2">
                    <button onClick={() => setModal({ type: 'equipment', data: eq })} className="text-xs text-primary hover:underline">Modifier</button>
                    <button onClick={() => { if (confirm('Supprimer ?')) removeEquipment(eq.id) }} className="text-xs text-red-500 hover:underline">Suppr.</button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )
      )}

      <Modal open={!!modal} onClose={() => setModal(null)} title={modal?.type === 'vehicle' ? (modal.data ? 'Modifier véhicule' : 'Nouveau véhicule') : (modal?.data ? 'Modifier matériel' : 'Nouveau matériel')}>
        {modal?.type === 'vehicle' && (
          <VehicleForm initial={modal.data} onSave={async (data) => { modal.data ? await updateVehicle(modal.data.id, data) : await addVehicle(data); setModal(null) }} onClose={() => setModal(null)} />
        )}
        {modal?.type === 'equipment' && (
          <EquipmentForm initial={modal.data} onSave={async (data) => { modal.data ? await updateEquipment(modal.data.id, data) : await addEquipment(data); setModal(null) }} onClose={() => setModal(null)} />
        )}
      </Modal>
    </div>
  )
}
