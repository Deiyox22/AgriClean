import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Pencil, Trash2, Phone, Mail, Star } from 'lucide-react'
import { useClientStore } from '../../store/useClientStore'
import { useMissionStore } from '../../store/useMissionStore'
import { useInvoiceStore } from '../../store/useInvoiceStore'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import EmptyState from '../../components/ui/EmptyState'
import {
  getStatusLabel, getStatusBadgeClass, getClientTypeLabel,
  getMissionTypeLabel, formatDate, formatCurrency,
} from '../../utils/formatters'

const tabs = ['Informations', 'Contacts', 'Missions', 'Documents']

const typeColors = {
  avicole: 'bg-amber-100 text-amber-800',
  agricole: 'bg-green-100 text-green-800',
  industriel: 'bg-blue-100 text-blue-800',
  mixte: 'bg-purple-100 text-purple-800',
}

export default function ClientDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const getById = useClientStore((s) => s.getById)
  const update = useClientStore((s) => s.update)
  const remove = useClientStore((s) => s.remove)
  const missions = useMissionStore((s) => s.getByClient(Number(id)))
  const invoices = useInvoiceStore((s) => s.getByClient(Number(id)))
  const [tab, setTab] = useState('Informations')
  const [editing, setEditing] = useState(false)

  const client = getById(Number(id))

  if (!client) return (
    <div className="text-center py-16 text-slate-400">
      <p>Client introuvable.</p>
      <button onClick={() => navigate('/clients')} className="mt-4 text-primary underline text-sm">Retour aux clients</button>
    </div>
  )

  const totalCA = invoices.reduce((sum, inv) => sum + (inv.lines ?? []).reduce((s, l) => s + (l.total ?? 0), 0), 0)

  const handleDelete = async () => {
    if (!confirm(`Supprimer ${client.name} ?`)) return
    await remove(client.id)
    navigate('/clients')
  }

  return (
    <div className="space-y-4 max-w-3xl">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/clients')} className="p-2 rounded-xl hover:bg-slate-100 transition-colors" aria-label="Retour">
          <ArrowLeft size={20} className="text-slate-600" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-slate-900 truncate">{client.name}</h1>
          <div className="flex items-center gap-2 mt-0.5">
            <Badge className={typeColors[client.type] ?? ''}>{getClientTypeLabel(client.type)}</Badge>
            <Badge className={getStatusBadgeClass(client.status)}>{getStatusLabel(client.status)}</Badge>
          </div>
        </div>
        <button onClick={() => setEditing(true)} className="p-2 rounded-xl hover:bg-slate-100 transition-colors" aria-label="Modifier">
          <Pencil size={18} className="text-slate-600" />
        </button>
        <button onClick={handleDelete} className="p-2 rounded-xl hover:bg-red-50 transition-colors" aria-label="Supprimer">
          <Trash2 size={18} className="text-red-500" />
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-slate-900 font-mono">{missions.length}</p>
          <p className="text-xs text-slate-500 mt-0.5">Missions</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-slate-900 font-mono">{invoices.length}</p>
          <p className="text-xs text-slate-500 mt-0.5">Factures</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-lg font-bold text-slate-900 font-mono">{formatCurrency(totalCA)}</p>
          <p className="text-xs text-slate-500 mt-0.5">CA total HT</p>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-100">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${tab === t ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-900'}`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'Informations' && (
        <Card className="p-5 space-y-3">
          {client.siret && <Row label="SIRET" value={client.siret} />}
          {client.address && (
            <Row label="Adresse" value={`${client.address.street}, ${client.address.zip} ${client.address.city}`} />
          )}
          {client.notes && <Row label="Notes" value={client.notes} />}
        </Card>
      )}

      {tab === 'Contacts' && (
        <div className="space-y-3">
          {client.contacts?.length === 0 ? (
            <EmptyState title="Aucun contact" />
          ) : (
            client.contacts?.map((c, i) => (
              <Card key={i} className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                    {c.name?.[0] ?? '?'}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-slate-900">{c.name}</p>
                      {c.preferred && <Star size={14} className="text-amber-500 fill-amber-400" />}
                    </div>
                    {c.role && <p className="text-xs text-slate-500">{c.role}</p>}
                    <div className="flex flex-wrap gap-3 mt-2">
                      {c.phone && (
                        <a href={`tel:${c.phone}`} className="flex items-center gap-1 text-sm text-primary">
                          <Phone size={14} />{c.phone}
                        </a>
                      )}
                      {c.email && (
                        <a href={`mailto:${c.email}`} className="flex items-center gap-1 text-sm text-primary">
                          <Mail size={14} />{c.email}
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      )}

      {tab === 'Missions' && (
        <div className="space-y-3">
          {missions.length === 0 ? (
            <EmptyState title="Aucune mission" description="Créez une mission pour ce client." />
          ) : (
            missions.map((m) => (
              <Card key={m.id} onClick={() => navigate(`/missions/${m.id}`)} className="p-4">
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <p className="font-medium text-slate-900 text-sm">{getMissionTypeLabel(m.type)}</p>
                    <p className="text-xs text-slate-500">{formatDate(m.date)}</p>
                  </div>
                  <Badge className={getStatusBadgeClass(m.status)}>{getStatusLabel(m.status)}</Badge>
                </div>
              </Card>
            ))
          )}
        </div>
      )}

      {tab === 'Documents' && (
        <EmptyState title="Aucun document" description="L'ajout de documents sera disponible prochainement." />
      )}
    </div>
  )
}

function Row({ label, value }) {
  return (
    <div>
      <p className="text-xs text-slate-400 mb-0.5">{label}</p>
      <p className="text-sm text-slate-800">{value}</p>
    </div>
  )
}
