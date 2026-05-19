import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Download, CheckCircle, Mail, Copy, AlertTriangle, ClipboardList } from 'lucide-react'
import { useInvoiceStore } from '../../store/useInvoiceStore'
import { useClientStore } from '../../store/useClientStore'
import { useSettingsStore } from '../../store/useSettingsStore'
import { useMissionStore } from '../../store/useMissionStore'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import { formatCurrency, formatDate, getStatusLabel, getStatusBadgeClass } from '../../utils/formatters'
import { generateInvoicePDF } from '../../utils/pdf'
import { addDays, isPast } from 'date-fns'
import { toast } from '../../store/useToastStore'

const STATUSES = ['emise', 'en_attente', 'payee', 'relance1', 'relance2', 'litige']

const RELANCE_CONFIG = {
  relance1: {
    label: 'Relance 1',
    color: 'bg-amber-50 border-amber-200 text-amber-800',
    subject: (num) => `Relance facture ${num} — Paiement en attente`,
    body: (num, ht, date, company) =>
      `Bonjour,\n\nSauf erreur de notre part, la facture ${num} d'un montant de ${ht} HT, dont l'échéance était le ${date}, reste impayée.\n\nNous vous remercions de procéder au règlement dans les meilleurs délais.\n\nCordialement,\n${company}`,
  },
  relance2: {
    label: 'Relance 2 — Urgente',
    color: 'bg-red-50 border-red-200 text-red-800',
    subject: (num) => `URGENT — 2e relance facture ${num}`,
    body: (num, ht, date, company) =>
      `Bonjour,\n\nMalgré notre précédente relance, la facture ${num} d'un montant de ${ht} HT demeure impayée depuis le ${date}.\n\nSans règlement sous 8 jours, nous serons contraints d'engager une procédure de recouvrement.\n\nCordialement,\n${company}`,
  },
}

export default function InvoiceDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const getById    = useInvoiceStore((s) => s.getById)
  const add        = useInvoiceStore((s) => s.add)
  const update     = useInvoiceStore((s) => s.update)
  const getClient  = useClientStore((s) => s.getById)
  const getMission = useMissionStore((s) => s.getById)
  const settings  = useSettingsStore((s) => s.settings)
  const [saving, setSaving] = useState(false)

  const invoice = getById(Number(id))
  if (!invoice) return (
    <div className="text-center py-16 text-slate-400">
      <p>Facture introuvable.</p>
      <button onClick={() => navigate('/invoicing')} className="mt-4 text-primary underline text-sm">Retour</button>
    </div>
  )

  const client        = getClient(invoice.clientId)
  const linkedMission = invoice.missionId ? getMission(invoice.missionId) : null
  const totalHT       = (invoice.lines ?? []).reduce((sum, l) => sum + (l.total ?? 0), 0)
  const taxAmount = totalHT * ((invoice.tax ?? 20) / 100)
  const totalTTC = totalHT + taxAmount
  const company  = settings?.company ?? {}
  const contact  = client?.contacts?.find((c) => c.preferred) ?? client?.contacts?.[0]
  const isLate   = invoice.dueDate && isPast(new Date(invoice.dueDate)) && invoice.status !== 'payee'

  const handleMarkPaid = async () => {
    setSaving(true)
    try {
      await update(invoice.id, { status: 'payee', paidAt: new Date().toISOString() })
      toast.success('Facture marquée comme payée')
    } finally {
      setSaving(false)
    }
  }

  const handleStatusChange = async (status) => {
    await update(invoice.id, { status })
    toast.success(`Statut mis à jour : ${getStatusLabel(status)}`)
  }

  const handleDuplicate = async () => {
    const newId = await add({
      clientId:  invoice.clientId,
      missionId: null,
      lines:     invoice.lines,
      tax:       invoice.tax,
      status:    'emise',
      dueDate:   addDays(new Date(), 30).toISOString(),
      paidAt:    null,
    })
    toast.success('Facture dupliquée')
    navigate(`/invoicing/${newId}`)
  }

  const getRelanceMailto = (level = null) => {
    const email   = contact?.email ?? ''
    const cfg     = level ? RELANCE_CONFIG[level] : null
    const subject = cfg
      ? cfg.subject(invoice.number)
      : `Relance facture ${invoice.number}`
    const body    = cfg
      ? cfg.body(invoice.number, formatCurrency(totalHT), formatDate(invoice.dueDate), company.name ?? 'AgriClean')
      : `Bonjour ${contact?.name ?? ''},\n\nNous vous relançons concernant la facture ${invoice.number} d'un montant de ${formatCurrency(totalHT)} HT.\n\nCordialement,\n${company.name}`
    return `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
  }

  const handleSendRelance = async (level) => {
    await update(invoice.id, { status: level })
    window.open(getRelanceMailto(level), '_self')
    toast.success(`Relance ${level === 'relance1' ? '1' : '2'} envoyée`)
  }

  return (
    <div className="space-y-4 max-w-2xl">
      {/* Header actions */}
      <div className="flex items-center gap-2 flex-wrap">
        <button onClick={() => navigate('/invoicing')} className="p-2 rounded-xl hover:bg-slate-100" aria-label="Retour">
          <ArrowLeft size={20} className="text-slate-600" />
        </button>
        <div className="flex-1" />
        {linkedMission && (
          <button
            onClick={() => navigate(`/missions/${linkedMission.id}`)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 min-h-[44px]"
          >
            <ClipboardList size={15} /> Mission
          </button>
        )}
        <button onClick={handleDuplicate}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 min-h-[44px]">
          <Copy size={15} /> Dupliquer
        </button>
        <button onClick={() => generateInvoicePDF(invoice, client, settings)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 text-slate-700 text-sm font-medium hover:bg-slate-200 min-h-[44px]">
          <Download size={16} /> PDF
        </button>
        {invoice.status !== 'payee' && (
          <button onClick={handleMarkPaid} disabled={saving}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary-light min-h-[44px] disabled:opacity-40">
            <CheckCircle size={16} /> Payée
          </button>
        )}
      </div>

      {/* Late banner */}
      {isLate && invoice.status !== 'litige' && (
        <div className={`flex items-center gap-3 p-4 rounded-2xl border ${
          invoice.status === 'relance2' ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'
        }`}>
          <AlertTriangle size={18} className={invoice.status === 'relance2' ? 'text-red-500' : 'text-amber-500'} />
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-semibold ${invoice.status === 'relance2' ? 'text-red-800' : 'text-amber-800'}`}>
              {invoice.status === 'relance2' ? 'Deuxième relance — action urgente requise' : 'Paiement en retard'}
            </p>
            <p className={`text-xs mt-0.5 ${invoice.status === 'relance2' ? 'text-red-600' : 'text-amber-600'}`}>
              Échéance : {formatDate(invoice.dueDate)}
            </p>
          </div>
          {contact?.email && (
            <a
              href={getRelanceMailto(invoice.status === 'relance1' ? 'relance2' : 'relance1')}
              onClick={() => handleSendRelance(invoice.status === 'relance1' ? 'relance2' : 'relance1')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold shrink-0 ${
                invoice.status === 'relance2'
                  ? 'bg-red-500 text-white hover:bg-red-600'
                  : 'bg-amber-500 text-white hover:bg-amber-600'
              }`}
            >
              <Mail size={13} />
              {invoice.status === 'relance2' ? 'Mise en demeure' : 'Envoyer relance 2'}
            </a>
          )}
        </div>
      )}

      {/* Invoice preview */}
      <Card className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-2xl font-black text-primary">AgriClean</div>
            <p className="text-xs text-slate-500 mt-1">{company.name}</p>
            <p className="text-xs text-slate-500">{company.address}</p>
            {company.siret && <p className="text-xs text-slate-500">SIRET : {company.siret}</p>}
          </div>
          <div className="text-right">
            <Badge className={`${getStatusBadgeClass(invoice.status)} text-sm px-3 py-1`}>{getStatusLabel(invoice.status)}</Badge>
            <p className="font-mono font-bold text-slate-900 text-lg mt-2">{invoice.number}</p>
            <p className="text-xs text-slate-500">Date : {formatDate(invoice.createdAt)}</p>
            <p className="text-xs text-slate-500">Échéance : {formatDate(invoice.dueDate)}</p>
            {invoice.paidAt && <p className="text-xs text-green-600">Payée le : {formatDate(invoice.paidAt)}</p>}
          </div>
        </div>

        <div className="mt-4 p-3 bg-slate-50 rounded-xl">
          <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Facturer à</p>
          <p className="font-semibold text-slate-900">{client?.name ?? '—'}</p>
          {client?.siret && <p className="text-xs text-slate-500">SIRET : {client.siret}</p>}
          {client?.address && <p className="text-xs text-slate-500">{client.address.street}, {client.address.zip} {client.address.city}</p>}
          {contact && <p className="text-xs text-slate-500 mt-1">{contact.name} — {contact.email}</p>}
        </div>

        <table className="w-full mt-4 text-sm">
          <thead>
            <tr className="bg-primary text-white text-xs">
              <th className="text-left px-3 py-2 rounded-l-lg">Description</th>
              <th className="text-center px-3 py-2">Qté</th>
              <th className="text-right px-3 py-2">PU HT</th>
              <th className="text-right px-3 py-2 rounded-r-lg">Total HT</th>
            </tr>
          </thead>
          <tbody>
            {(invoice.lines ?? []).map((line, i) => (
              <tr key={i} className={i % 2 === 1 ? 'bg-slate-50' : ''}>
                <td className="px-3 py-2.5 text-slate-800">{line.description}</td>
                <td className="px-3 py-2.5 text-center text-slate-600">{line.quantity}</td>
                <td className="px-3 py-2.5 text-right text-slate-600 font-mono">{formatCurrency(line.unitPrice)}</td>
                <td className="px-3 py-2.5 text-right font-medium text-slate-900 font-mono">{formatCurrency(line.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-4 flex justify-end">
          <div className="w-56 space-y-1">
            <div className="flex justify-between text-sm"><span className="text-slate-500">Total HT</span><span className="font-mono font-medium">{formatCurrency(totalHT)}</span></div>
            <div className="flex justify-between text-sm"><span className="text-slate-500">TVA ({invoice.tax ?? 20}%)</span><span className="font-mono">{formatCurrency(taxAmount)}</span></div>
            <div className="flex justify-between text-sm font-bold pt-2 border-t border-slate-200">
              <span className="text-slate-900">Total TTC</span>
              <span className="font-mono text-primary text-base">{formatCurrency(totalTTC)}</span>
            </div>
          </div>
        </div>

        {(company.rib || settings?.legalMentions) && (
          <div className="mt-6 pt-4 border-t border-slate-100 text-xs text-slate-400 space-y-1">
            {company.rib && <p>RIB : {company.rib}</p>}
            {settings?.legalMentions && <p>{settings.legalMentions}</p>}
          </div>
        )}
      </Card>

      {/* Status + relances */}
      <Card className="p-4 space-y-4">
        <div>
          <p className="text-xs font-medium text-slate-500 mb-3">Changer le statut</p>
          <div className="flex flex-wrap gap-2">
            {STATUSES.map((s) => (
              <button key={s} onClick={() => handleStatusChange(s)} disabled={invoice.status === s}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${invoice.status === s ? 'bg-primary text-white border-primary' : 'border-slate-200 text-slate-600 hover:border-primary/40'}`}>
                {getStatusLabel(s)}
              </button>
            ))}
          </div>
        </div>

        {/* Relances rapides */}
        {contact?.email && invoice.status !== 'payee' && (
          <div className="border-t border-slate-100 pt-4">
            <p className="text-xs font-medium text-slate-500 mb-3">Envoyer une relance</p>
            <div className="flex gap-2 flex-wrap">
              <a
                href={getRelanceMailto('relance1')}
                onClick={() => update(invoice.id, { status: 'relance1' })}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 text-xs font-semibold hover:bg-amber-100 transition-colors"
              >
                <Mail size={13} /> Relance 1 — aimable
              </a>
              <a
                href={getRelanceMailto('relance2')}
                onClick={() => update(invoice.id, { status: 'relance2' })}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold hover:bg-red-100 transition-colors"
              >
                <Mail size={13} /> Relance 2 — formelle
              </a>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
