import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { formatDate, formatCurrency } from './formatters'

export function generateInvoicePDF(invoice, client, settings) {
  const doc = new jsPDF()
  const company = settings?.company ?? {}
  const primaryColor = [26, 71, 49]

  // Header background
  doc.setFillColor(...primaryColor)
  doc.rect(0, 0, 210, 40, 'F')

  doc.setTextColor(255, 255, 255)
  doc.setFontSize(22)
  doc.setFont('helvetica', 'bold')
  doc.text('AgriClean', 14, 18)

  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text(company.name ?? '', 14, 26)
  doc.text(company.address ?? '', 14, 31)
  doc.text(`Tél : ${company.phone ?? ''}  |  ${company.email ?? ''}`, 14, 36)

  if (company.siret) {
    doc.text(`SIRET : ${company.siret}`, 140, 26)
  }

  // Invoice title
  doc.setTextColor(0, 0, 0)
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text('FACTURE', 14, 56)

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(`N° ${invoice.number}`, 14, 64)
  doc.text(`Date : ${formatDate(invoice.createdAt)}`, 14, 70)
  doc.text(`Échéance : ${formatDate(invoice.dueDate)}`, 14, 76)

  // Client block
  doc.setFillColor(248, 250, 252)
  doc.rect(120, 50, 76, 38, 'F')
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.text('FACTURER À :', 124, 58)
  doc.setFont('helvetica', 'normal')
  doc.text(client?.name ?? '', 124, 65)
  if (client?.siret) doc.text(`SIRET : ${client.siret}`, 124, 71)
  const addr = client?.address
  if (addr) {
    doc.text(addr.street ?? '', 124, 77)
    doc.text(`${addr.zip ?? ''} ${addr.city ?? ''}`, 124, 83)
  }

  // Lines table
  const rows = (invoice.lines ?? []).map((l) => [
    l.description,
    l.quantity,
    formatCurrency(l.unitPrice),
    formatCurrency(l.total),
  ])

  autoTable(doc, {
    startY: 100,
    head: [['Description', 'Qté', 'Prix unitaire HT', 'Total HT']],
    body: rows,
    headStyles: { fillColor: primaryColor, textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    styles: { fontSize: 10 },
    columnStyles: { 0: { cellWidth: 90 }, 1: { halign: 'center' }, 2: { halign: 'right' }, 3: { halign: 'right' } },
  })

  const finalY = doc.lastAutoTable.finalY + 8
  const totalHT = (invoice.lines ?? []).reduce((sum, l) => sum + (l.total ?? 0), 0)
  const taxAmount = totalHT * ((invoice.tax ?? 20) / 100)
  const totalTTC = totalHT + taxAmount

  doc.setDrawColor(226, 232, 240)
  doc.line(120, finalY, 196, finalY)

  const rightCol = 196
  doc.setFontSize(10)
  doc.text('Total HT :', 130, finalY + 8)
  doc.text(formatCurrency(totalHT), rightCol, finalY + 8, { align: 'right' })
  doc.text(`TVA (${invoice.tax ?? 20}%) :`, 130, finalY + 15)
  doc.text(formatCurrency(taxAmount), rightCol, finalY + 15, { align: 'right' })

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.setFillColor(...primaryColor)
  doc.rect(120, finalY + 18, 76, 10, 'F')
  doc.setTextColor(255, 255, 255)
  doc.text('Total TTC :', 130, finalY + 25)
  doc.text(formatCurrency(totalTTC), rightCol, finalY + 25, { align: 'right' })

  // Footer
  doc.setTextColor(100, 116, 139)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  const footerY = 275
  doc.line(14, footerY - 4, 196, footerY - 4)
  if (company.siret) doc.text(`SIRET : ${company.siret}`, 14, footerY)
  if (company.rib) doc.text(`RIB : ${company.rib}`, 14, footerY + 5)
  if (settings?.legalMentions) {
    const lines = doc.splitTextToSize(settings.legalMentions, 182)
    doc.text(lines, 14, footerY + 10)
  }

  doc.save(`${invoice.number}.pdf`)
}
