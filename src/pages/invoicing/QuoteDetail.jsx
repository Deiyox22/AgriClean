import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Download, Mail, CheckCircle, XCircle, FileText, Pencil, ClipboardList } from 'lucide-react'
import { useQuoteStore } from '../../store/useQuoteStore'
import { useInvoiceStore } from '../../store/useInvoiceStore'
import { useClientStore } from '../../store/useClientStore'
import { useSettingsStore } from '../../store/useSettingsStore'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Modal from '../../components/ui/Modal'
import LineItemsEditor from '../../components/ui/LineItemsEditor'
import { formatCurrency, formatDate, getStatusLabel, getStatusBadgeClass } from '../../utils/formatters'
import { addDays } from 'date-fns'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

const QUOTE_STATUSES = ['brouillon', 'envoye', 'accepte', 'refuse']

function generateQuotePDF(quote, client, settings) {
  const doc = new jsPDF()
  const company = settings?.company ?? {}
  const primaryColor = [26, 71, 49]

  // Header
  doc.setFillColor(...primaryColor)
  doc.rect(0, 0, 210, 40, 'F')

  if (company.logo) {
    try {
      const fmt = company.logo.startsWith('data:image/png') ? 'PNG' : company.logo.startsWith('data:image/svg') ? 'SVG' : 'JPEG'
      doc.addImage(company.logo, fmt, 10, 4, 32, 32)
    } catch {
      doc.setTextColor(255, 255, 255); doc.setFontSize(22); doc.setFont('helvetica', 'bold')
      doc.text(company.name ?? 'AgriClean', 14, 18)
    }
  } else {
    doc.setTextColor(255, 255, 255); doc.setFontSize(22); doc.setFont('helvetica', 'bold')
    doc.text(company.name ?? 'AgriClean', 14, 18)
  }

  const textX = company.logo ? 46 : 14
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text(company.name ?? '', textX, company.logo ? 14 : 26)
  doc.text(company.address ?? '', textX, company.logo ? 20 : 31)
  doc.text(`Tél : ${company.phone ?? ''}  |  ${company.email ?? ''}`, textX, company.logo ? 26 : 36)

  doc.setTextColor(0, 0, 0)
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text('DEVIS', 14, 56)

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(`N° ${quote.number}`, 14, 64)
  doc.text(`Date : ${formatDate(quote.createdAt)}`, 14, 70)
  if (quote.validUntil) doc.text(`Valable jusqu'au : ${formatDate(quote.validUntil)}`, 14, 76)

  doc.setFillColor(248, 250, 252)
  doc.rect(120, 50, 76, 35, 'F')
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.text('DESTINATAIRE :', 124, 58)
  doc.setFont('helvetica', 'normal')
  doc.text(client?.name ?? '', 124, 65)
  if (client?.siret) doc.text(`SIRET : ${client.siret}`, 124, 71)
  const addr = client?.address
  if (addr) {
    doc.text(addr.street ?? '', 124, 77)
    doc.text(`${addr.zip ?? ''} ${addr.city ?? ''}`, 124, 83)
  }

  const rows = (quote.lines ?? []).map((l) => [
    l.description, l.quantity, l.unit ?? '—',
    formatCurrency(l.unitPrice), formatCurrency(l.total),
  ])
  autoTable(doc, {
    startY: 100,
    head: [['Description', 'Qté', 'Unité', 'Prix unit. HT', 'Total HT']],
    body: rows,
    headStyles: { fillColor: primaryColor, textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    styles: { fontSize: 10 },
    columnStyles: { 0: { cellWidth: 80 }, 1: { halign: 'center', cellWidth: 14 }, 2: { halign: 'center', cellWidth: 18 }, 3: { halign: 'right' }, 4: { halign: 'right' } },
  })

  const finalY = doc.lastAutoTable.finalY + 8
  const totalHT = (quote.lines ?? []).reduce((sum, l) => sum + (l.total ?? 0), 0)
  const taxAmount = totalHT * ((quote.tax ?? 20) / 100)
  const totalTTC = totalHT + taxAmount
  const rightCol = 196

  doc.setFontSize(10)
  doc.text('Total HT :', 130, finalY + 8)
  doc.text(formatCurrency(totalHT), rightCol, finalY + 8, { align: 'right' })
  doc.text(`TVA (${quote.tax ?? 20}%) :`, 130, finalY + 15)
  doc.text(formatCurrency(taxAmount), rightCol, finalY + 15, { align: 'right' })
  doc.setFont('helvetica', 'bold')
  doc.setFillColor(...primaryColor)
  doc.rect(120, finalY + 18, 76, 10, 'F')
  doc.setTextColor(255, 255, 255)
  doc.text('Total TTC :', 130, finalY + 25)
  doc.text(formatCurrency(totalTTC), rightCol, finalY + 25, { align: 'right' })

  if (quote.note) {
    doc.setTextColor(0, 0, 0)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.text('Conditions :', 14, finalY + 40)
    const lines = doc.splitTextToSize(quote.note, 182)
    doc.text(lines, 14, finalY + 47)
  }

  doc.setTextColor(100, 116, 139)
  doc.setFontSize(8)
  const footerY = 275
  doc.line(14, footerY - 4, 196, footerY - 4)
  if (company.siret) doc.text(`SIRET : ${company.siret}`, 14, footerY)
  if (settings?.legalMentions) {
    const lines = doc.splitTextToSize(settings.legalMentions, 182)
    doc.text(lines, 14, footerY + 5)
  }

  doc.save(`${quote.number}.pdf`)
}

export default function QuoteDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const getById = useQuoteStore((s) => s.getById)
  const update = useQuoteStore((s) => s.update)
  const remove = useQuoteStore((s) => s.remove)
  const addInvoice = useInvoiceStore((s) => s.add)
  const getClient = useClientStore((s) => s.getById)
  const settings = useSettingsStore((s) => s.settings)

  const [editing, setEditing] = useState(false)
  const [editLines, setEditLines] = useState(null)
  const [editTax, setEditTax] = useState(20)
  const [editNote, setEditNote] = useState('')

  const quote = getById(Number(id))
  if (!quote) return (
    <div className="text-center py-16 text-slate-400">
      <p>Devis introuvable.</p>
      <button onClick={() => navigate('/invoicing')} className="mt-4 text-primary underline text-sm">Retour</button>
    </div>
  )

  const client = getClient(quote.clientId)
  const company = settings?.company ?? {}
  const totalHT = (quote.lines ?? []).reduce((sum, l) => sum + (l.total ?? 0), 0)
  const taxAmount = totalHT * ((quote.tax ?? 20) / 100)
  const totalTTC = totalHT + taxAmount

  const handleStatusChange = async (status) => {
    await update(quote.id, { status })
  }

  const handleConvertToInvoice = async () => {
    if (!confirm('Convertir ce devis en facture ?')) return
    const dueDate = addDays(new Date(), 30).toISOString()
    const invoiceId = await addInvoice({
      clientId: quote.clientId,
      missionId: quote.missionId ?? null,
      lines: quote.lines,
      tax: quote.tax,
      status: 'emise',
      dueDate,
      paidAt: null,
    })
    await update(quote.id, { status: 'converti', invoiceId })
    navigate(`/invoicing/${invoiceId}`)
  }

  const handleDelete = async () => {
    if (!confirm('Supprimer ce devis ?')) return
    await remove(quote.id)
    navigate('/invoicing')
  }

  const handleCreateMission = () => {
    const params = new URLSearchParams({ clientId: quote.clientId })
    navigate(`/missions/new?${params.toString()}`)
  }

  const openEdit = () => {
    setEditLines(quote.lines.map((l) => ({ ...l })))
    setEditTax(quote.tax ?? 20)
    setEditNote(quote.note ?? '')
    setEditing(true)
  }

  const handleSaveEdit = async () => {
    const updatedLines = editLines.map((l) => ({ ...l, total: l.quantity * l.unitPrice }))
    await update(quote.id, { lines: updatedLines, tax: editTax, note: editNote })
    setEditing(false)
  }

  const getMailto = () => {
    const contact = client?.contacts?.find((c) => c.preferred) ?? client?.contacts?.[0]
    const email = contact?.email ?? ''
    const subject = encodeURIComponent(`Devis ${quote.number} — ${company.name}`)
    const body = encodeURIComponent(`Bonjour ${contact?.name ?? ''},\n\nVeuillez trouver ci-joint notre devis ${quote.number} d'un montant de ${formatCurrency(totalHT)} HT (${formatCurrency(totalTTC)} TTC).\n\nCe devis est valable jusqu'au ${formatDate(quote.validUntil)}.\n\nCordialement,\n${company.name}`)
    return `mailto:${email}?subject=${subject}&body=${body}`
  }

  const inputCls = 'w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary'

  return (
    <div className="space-y-4 max-w-2xl">
      <div className="flex items-center gap-2 flex-wrap">
        <button onClick={() => navigate('/invoicing')} className="p-2 rounded-xl hover:bg-slate-100" aria-label="Retour">
          <ArrowLeft size={20} className="text-slate-600" />
        </button>
        <div className="flex-1" />
        {quote.status !== 'converti' && quote.status !== 'refuse' && (
          <button onClick={openEdit} className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 min-h-[44px]">
            <Pencil size={16} /> Modifier
          </button>
        )}
        <a href={getMailto()} className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 min-h-[44px]">
          <Mail size={16} /> Envoyer
        </a>
        <button onClick={() => generateQuotePDF(quote, client, settings)} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 text-slate-700 text-sm hover:bg-slate-200 min-h-[44px]">
          <Download size={16} /> PDF
        </button>
        {quote.status === 'accepte' && (
          <button onClick={handleConvertToInvoice} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary-light min-h-[44px]">
            <FileText size={16} /> Facturer
          </button>
        )}
      </div>

      {/* Quote preview */}
      <Card className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-2xl font-black text-primary">AgriClean</div>
            <p className="text-xs text-slate-500 mt-1">{company.name}</p>
            <p className="text-xs text-slate-500">{company.address}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-400 uppercase font-semibold tracking-wide mb-1">Devis</p>
            <Badge className={`${getStatusBadgeClass(quote.status)} text-sm px-3 py-1`}>{getStatusLabel(quote.status)}</Badge>
            <p className="font-mono font-bold text-slate-900 text-lg mt-2">{quote.number}</p>
            <p className="text-xs text-slate-500">Créé le : {formatDate(quote.createdAt)}</p>
            {quote.validUntil && <p className="text-xs text-slate-500">Valable jusqu'au : {formatDate(quote.validUntil)}</p>}
          </div>
        </div>

        <div className="mt-4 p-3 bg-slate-50 rounded-xl">
          <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Destinataire</p>
          <p className="font-semibold text-slate-900">{client?.name ?? '—'}</p>
          {client?.siret && <p className="text-xs text-slate-500">SIRET : {client.siret}</p>}
          {client?.address && <p className="text-xs text-slate-500">{client.address.street}, {client.address.zip} {client.address.city}</p>}
        </div>

        {/* Récurrence */}
        {quote.recurrence && quote.recurrence !== 'ponctuel' && (
          <div className="mt-3 flex items-center gap-2 px-3 py-2 bg-primary/5 rounded-xl">
            <span className="text-xs font-bold text-primary">↻</span>
            <p className="text-xs text-primary font-semibold">
              Prestation {
                { hebdomadaire: 'hebdomadaire', bimensuelle: 'bimensuelle', mensuelle: 'mensuelle', trimestrielle: 'trimestrielle', annuelle: 'annuelle (contrat)' }[quote.recurrence] ?? quote.recurrence
              }
            </p>
          </div>
        )}

        <table className="w-full mt-4 text-sm">
          <thead>
            <tr className="bg-primary text-white text-xs">
              <th className="text-left px-3 py-2 rounded-l-lg">Description</th>
              <th className="text-center px-3 py-2">Qté</th>
              <th className="text-center px-3 py-2">Unité</th>
              <th className="text-right px-3 py-2">PU HT</th>
              <th className="text-right px-3 py-2 rounded-r-lg">Total HT</th>
            </tr>
          </thead>
          <tbody>
            {(quote.lines ?? []).map((line, i) => (
              <tr key={i} className={i % 2 === 1 ? 'bg-slate-50' : ''}>
                <td className="px-3 py-2.5 text-slate-800">{line.description}</td>
                <td className="px-3 py-2.5 text-center text-slate-600">{line.quantity}</td>
                <td className="px-3 py-2.5 text-center text-slate-400 text-xs">{line.unit ?? '—'}</td>
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
              <span className="text-slate-500">TVA ({quote.tax ?? 20}%)</span>
              <span className="font-mono">{formatCurrency(taxAmount)}</span>
            </div>
            <div className="flex justify-between text-sm font-bold pt-2 border-t border-slate-200">
              <span className="text-slate-900">Total TTC</span>
              <span className="font-mono text-primary text-base">{formatCurrency(totalTTC)}</span>
            </div>
          </div>
        </div>

        {quote.note && (
          <div className="mt-4 p-3 bg-amber-50 rounded-xl text-xs text-amber-800">
            <p className="font-semibold mb-1">Conditions</p>
            <p>{quote.note}</p>
          </div>
        )}
      </Card>

      {/* Status actions */}
      {quote.status !== 'converti' && (
        <Card className="p-4">
          <p className="text-xs font-medium text-slate-500 mb-3">Mettre à jour le statut</p>
          <div className="flex flex-wrap gap-2">
            {QUOTE_STATUSES.map((s) => (
              <button key={s} onClick={() => handleStatusChange(s)} disabled={quote.status === s}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${quote.status === s ? 'bg-primary text-white border-primary' : 'border-slate-200 text-slate-600 hover:border-primary/40'}`}>
                {s === 'accepte' && <CheckCircle size={12} />}
                {s === 'refuse' && <XCircle size={12} />}
                {getStatusLabel(s)}
              </button>
            ))}
          </div>
          {quote.status === 'accepte' && (
            <div className="mt-3 p-3 bg-green-50 rounded-xl space-y-2">
              <p className="text-sm text-green-700 font-medium">✓ Devis accepté</p>
              <div className="flex gap-2 flex-wrap">
                <button onClick={handleConvertToInvoice} className="flex items-center gap-1.5 px-3 py-2 bg-primary text-white rounded-xl text-xs font-medium hover:bg-primary-light">
                  <FileText size={14} /> Convertir en facture
                </button>
                <button onClick={handleCreateMission} className="flex items-center gap-1.5 px-3 py-2 bg-green-600 text-white rounded-xl text-xs font-medium hover:bg-green-700">
                  <ClipboardList size={14} /> Créer la mission
                </button>
              </div>
            </div>
          )}
        </Card>
      )}

      {quote.status === 'converti' && (
        <Card className="p-4 bg-purple-50 border-purple-100">
          <p className="text-sm text-purple-700 font-medium">✓ Ce devis a été converti en facture.</p>
        </Card>
      )}

      <button onClick={handleDelete} className="text-xs text-red-500 hover:underline w-full text-center py-2">
        Supprimer ce devis
      </button>

      {/* Edit modal */}
      <Modal open={editing} onClose={() => setEditing(false)} title="Modifier le devis" size="lg">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Lignes de prestation</label>
            {editLines && <LineItemsEditor lines={editLines} onChange={setEditLines} />}
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">TVA (%)</label>
            <select className={inputCls} value={editTax} onChange={(e) => setEditTax(Number(e.target.value))}>
              <option value={0}>0 %</option>
              <option value={10}>10 %</option>
              <option value={20}>20 %</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Conditions / notes</label>
            <textarea rows={3} className={inputCls} value={editNote} onChange={(e) => setEditNote(e.target.value)} />
          </div>
          <div className="flex gap-3">
            <button onClick={() => setEditing(false)} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-600 hover:bg-slate-50">Annuler</button>
            <button onClick={handleSaveEdit} className="flex-1 py-2.5 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary-light">Enregistrer</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
