import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, ChevronRight } from 'lucide-react'
import { useClientStore } from '../../store/useClientStore'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Modal from '../../components/ui/Modal'
import EmptyState from '../../components/ui/EmptyState'
import SearchInput from '../../components/ui/SearchInput'
import { getStatusLabel, getStatusBadgeClass, getClientTypeLabel } from '../../utils/formatters'

const typeColors = {
  avicole: 'bg-amber-100 text-amber-800',
  agricole: 'bg-green-100 text-green-800',
  industriel: 'bg-blue-100 text-blue-800',
  mixte: 'bg-purple-100 text-purple-800',
}

function ClientForm({ initial, onSave, onClose }) {
  const [form, setForm] = useState(initial ?? {
    name: '', siret: '', type: 'avicole', status: 'actif',
    address: { street: '', city: '', zip: '', country: 'France' },
    contacts: [{ name: '', role: '', phone: '', email: '', preferred: true }],
    notes: '', documents: [],
  })

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }))
  const setAddr = (key, val) => setForm((f) => ({ ...f, address: { ...f.address, [key]: val } }))

  const addContact = () => setForm((f) => ({
    ...f,
    contacts: [...f.contacts, { name: '', role: '', phone: '', email: '', preferred: false }],
  }))

  const setContact = (i, key, val) => setForm((f) => {
    const contacts = [...f.contacts]
    contacts[i] = { ...contacts[i], [key]: val }
    return { ...f, contacts }
  })

  const removeContact = (i) => setForm((f) => ({
    ...f, contacts: f.contacts.filter((_, idx) => idx !== i),
  }))

  const handleSubmit = (e) => {
    e.preventDefault()
    onSave(form)
  }

  const inputCls = 'w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary'
  const labelCls = 'block text-xs font-medium text-slate-600 mb-1'

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className={labelCls}>Raison sociale *</label>
          <input required className={inputCls} value={form.name} onChange={(e) => set('name', e.target.value)} />
        </div>
        <div>
          <label className={labelCls}>SIRET</label>
          <input className={inputCls} value={form.siret} onChange={(e) => set('siret', e.target.value)} />
        </div>
        <div>
          <label className={labelCls}>Type *</label>
          <select required className={inputCls} value={form.type} onChange={(e) => set('type', e.target.value)}>
            <option value="avicole">Élevage avicole</option>
            <option value="agricole">Agricole</option>
            <option value="industriel">Industriel</option>
            <option value="mixte">Mixte</option>
          </select>
        </div>
        <div>
          <label className={labelCls}>Statut</label>
          <select className={inputCls} value={form.status} onChange={(e) => set('status', e.target.value)}>
            <option value="actif">Actif</option>
            <option value="inactif">Inactif</option>
            <option value="prospect">Prospect</option>
          </select>
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Adresse</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className={labelCls}>Rue</label>
            <input className={inputCls} value={form.address.street} onChange={(e) => setAddr('street', e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Code postal</label>
            <input className={inputCls} value={form.address.zip} onChange={(e) => setAddr('zip', e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Ville</label>
            <input className={inputCls} value={form.address.city} onChange={(e) => setAddr('city', e.target.value)} />
          </div>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Contacts</p>
          <button type="button" onClick={addContact} className="text-xs text-primary font-medium hover:underline">+ Ajouter</button>
        </div>
        {form.contacts.map((c, i) => (
          <div key={i} className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3 p-3 bg-slate-50 rounded-xl">
            <div>
              <label className={labelCls}>Nom</label>
              <input className={inputCls} value={c.name} onChange={(e) => setContact(i, 'name', e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Fonction</label>
              <input className={inputCls} value={c.role} onChange={(e) => setContact(i, 'role', e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Téléphone</label>
              <input className={inputCls} value={c.phone} onChange={(e) => setContact(i, 'phone', e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Email</label>
              <input className={inputCls} value={c.email} onChange={(e) => setContact(i, 'email', e.target.value)} />
            </div>
            <div className="col-span-2 flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
                <input type="checkbox" checked={c.preferred} onChange={(e) => setContact(i, 'preferred', e.target.checked)} className="accent-primary" />
                Contact privilégié
              </label>
              {form.contacts.length > 1 && (
                <button type="button" onClick={() => removeContact(i)} className="text-xs text-red-500 hover:underline">Supprimer</button>
              )}
            </div>
          </div>
        ))}
      </div>

      <div>
        <label className={labelCls}>Notes</label>
        <textarea rows={3} className={inputCls} value={form.notes} onChange={(e) => set('notes', e.target.value)} />
      </div>

      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
          Annuler
        </button>
        <button type="submit" className="flex-1 py-2.5 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary-light transition-colors">
          Enregistrer
        </button>
      </div>
    </form>
  )
}

export default function ClientList() {
  const clients = useClientStore((s) => s.clients)
  const add = useClientStore((s) => s.add)
  const loading = useClientStore((s) => s.loading)
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [showModal, setShowModal] = useState(false)

  const filtered = clients.filter((c) => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase())
    const matchType = !filterType || c.type === filterType
    const matchStatus = !filterStatus || c.status === filterStatus
    return matchSearch && matchType && matchStatus
  })

  const handleSave = async (data) => {
    await add(data)
    setShowModal(false)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3">
        <div className="flex gap-2">
          <div className="flex-1 min-w-0">
            <SearchInput value={search} onChange={setSearch} placeholder="Rechercher un client…" />
          </div>
          <button onClick={() => setShowModal(true)} className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary-light transition-colors min-h-[44px] shrink-0">
            <Plus size={16} /> <span className="hidden sm:inline">Nouveau client</span><span className="sm:hidden">Nouveau</span>
          </button>
        </div>
        <div className="flex gap-2">
          <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="flex-1 px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white">
            <option value="">Tous les types</option>
            <option value="avicole">Avicole</option>
            <option value="agricole">Agricole</option>
            <option value="industriel">Industriel</option>
            <option value="mixte">Mixte</option>
          </select>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="flex-1 px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white">
            <option value="">Tous les statuts</option>
            <option value="actif">Actif</option>
            <option value="inactif">Inactif</option>
            <option value="prospect">Prospect</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-20 bg-slate-100 rounded-xl animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState title="Aucun client trouvé" description="Ajoutez votre premier client pour commencer." action={
          <button onClick={() => setShowModal(true)} className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-medium">Nouveau client</button>
        } />
      ) : (
        <div className="space-y-3">
          {filtered.map((client) => (
            <Card key={client.id} onClick={() => navigate(`/clients/${client.id}`)} className="p-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                  {client.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-900 truncate">{client.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Badge className={typeColors[client.type] ?? 'bg-gray-100 text-gray-700'}>{getClientTypeLabel(client.type)}</Badge>
                    {client.address?.city && <span className="text-xs text-slate-400">{client.address.city}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge className={getStatusBadgeClass(client.status)}>{getStatusLabel(client.status)}</Badge>
                  <ChevronRight size={16} className="text-slate-300" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Nouveau client" size="lg">
        <ClientForm onSave={handleSave} onClose={() => setShowModal(false)} />
      </Modal>
    </div>
  )
}
