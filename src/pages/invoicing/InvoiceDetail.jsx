import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Download, CheckCircle, Mail } from 'lucide-react'
import { useInvoiceStore } from '../../store/useInvoiceStore'
import { useClientStore } from '../../store/useClientStore'
import { useSettingsStore } from '../../store/useSettingsStore'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import { formatCurrency, formatDate, getStatusLabel, getStatusBadgeClass } from '../../utils/formatters'
import { generateInvoicePDF } from '../../utils/pdf'

const STATUSES = ['emise', 'en_attente', 'payee', 'relance1', 'relance2', 'litige']

export default function InvoiceDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const getById = useInvoiceStore((s) => s.getById)
  const update = useInvoiceStore((s) => s.update)
  const getClient = useClientStore((s) => s.getById)
  const settings = useSettingsStore((s) => s.settings)
  const [saving, setSaving] = useState(false)

  const invoice = getById(Number(id))
  if (!invoice) return (
    <div className="text-center py-16 text-slate-400">
      <p>Facture introuvable.</p>
      <button onClick={() => navigate('/invoicing')} className="mt-4 text-primary underline text-sm">Retour</button>
    </div>
  )

  const client = getClient(invoice.clientId)
  const totalHT = (invoice.lines ?? []).reduce((sum, l) => sum + (l.total ?? 0), 0)
  const taxAmount = totalHT * ((invoice.tax ?? 20) / 100)
  const totalTTC = totalHT + taxAmount

  const handleMarkPaid = async () => {
    setSaving(true)
    try {
      await update(invoice.id, { status: 'payee', paidAt: new Date().toISOString() })
    } finally {
      setSaving(false)
    }
  }

  const handleStatusChange = async (status) => {
    await update(invoice.id, { status })
  }

  const handleDownloadPDF = () => {
    generateInvoicePDF(invoice, client, settings)
  }

  const company = settings?.company ?? {}
  const contact = client?.contacts?.find((c) => c.preferred) ?? client?.contacts?.[0]
  const getRelanceMailto = () => {
    const email = contact?.email ?? ''
    const subject = encodeURIComponent(`Relance facture ${invoice.number}`)
    const body = encodeURIComponent(`Bonjour ${contact?.name ?? ''},\n\nNous vous relançons concernant la facture ${invoice.number} d'un montant de ${formatCurrency(totalHT)} HT.\n\nCordialement,\n${company.name}`)
    return `mailto:${email}?subject=${subject}&body=${body}`
  }

  const inputCls = 'w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary'

  return (
    <div className="space-y-4 max-w-2xl">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/invoicing')} className="p-2 rounded-xl hover:bg-slate-100" aria-label="Retour">
          <ArrowLeft size={20} className="text-slate-600" />
        </button>
        <div className="flex-1" />
        <a href={getRelanceMailto()} className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 min-h-[44px]">
          <Mail size={16} /> Relance
        </a>
        <button onClick={handleDownloadPDF} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 text-slate-700 text-sm font-medium hover:bg-slate-200 min-h-[44px]">
          <Download size={16} /> PDF
        </button>
        {invoice.status !== 'payee' && (
          <button onClick={handleMarkPaid} disabled={saving}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary-light min-h-[44px] disabled:opacity-40">
            <CheckCircle size={16} /> Payée
          </button>
        )}
      </div>

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
          </div>
        </div>

        <div className="mt-4 p-3 bg-slate-50 rounded-xl">
          <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Facturer à</p>
          <p className="font-semibold text-slate-900">{client?.name ?? '—'}</p>
          {client?.siret && <p className="text-xs text-slate-500">SIRET : {client.siret}</p>}
          {client?.address && <p className="text-xs text-slate-500">{client.address.street}, {client.address.zip} {client.address.city}</p>}
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
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Total HT</span>
              <span className="font-mono font-medium">{formatCurrency(totalHT)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">TVA ({invoice.tax ?? 20}%)</span>
              <span className="font-mono">{formatCurrency(taxAmount)}</span>
            </div>
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

      {/* Change status */}
      <Card className="p-4">
        <p className="text-xs font-medium text-slate-500 mb-3">Changer le statut</p>
        <div className="flex flex-wrap gap-2">
          {STATUSES.map((s) => (
            <button key={s} onClick={() => handleStatusChange(s)} disabled={invoice.status === s}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${invoice.status === s ? 'bg-primary text-white border-primary' : 'border-slate-200 text-slate-600 hover:border-primary/40'}`}>
              {getStatusLabel(s)}
            </button>
          ))}
        </div>
      </Card>
    </div>
  )
}
