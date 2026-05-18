import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { format, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns'
import { fr } from 'date-fns/locale'
import { formatCurrency } from './formatters'

// ─── CSV export — heures par employé ─────────────────────────────────────────
export function exportHoursCSV(employees, missions, month = new Date()) {
  const start = startOfMonth(month)
  const end   = endOfMonth(month)
  const label = format(month, 'MMMM yyyy', { locale: fr })

  const rows = [['Prénom', 'Nom', 'Rôle', 'Mois', 'Nb missions', 'Heures réelles', 'Heures estimées']]

  for (const emp of employees) {
    const empMissions = missions.filter(
      (m) =>
        m.teamIds?.includes(emp.id) &&
        isWithinInterval(new Date(m.date), { start, end }) &&
        (m.status === 'termine' || m.status === 'facture' || m.status === 'paye')
    )
    const realH      = empMissions.reduce((s, m) => s + (m.report?.realDuration ?? 0), 0)
    const estimatedH = empMissions.reduce((s, m) => s + (m.duration ?? 0), 0)
    rows.push([emp.firstName, emp.lastName, emp.role, label, empMissions.length, realH, estimatedH])
  }

  const csv = rows.map((r) => r.map((v) => `"${v}"`).join(',')).join('\n')
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
  const url  = URL.createObjectURL(blob)
  const a    = Object.assign(document.createElement('a'), {
    href: url,
    download: `heures-${format(month, 'yyyy-MM')}.csv`,
  })
  a.click()
  URL.revokeObjectURL(url)
}

// ─── PDF — Rapport mensuel ────────────────────────────────────────────────────
export function generateMonthlyReport({ employees, missions, invoices, clients, settings, month = new Date() }) {
  const start      = startOfMonth(month)
  const end        = endOfMonth(month)
  const monthLabel = format(month, 'MMMM yyyy', { locale: fr })
  const primary    = [26, 71, 49]
  const doc        = new jsPDF()
  const company    = settings?.company ?? {}

  // ── Header ──────────────────────────────────────────────────────────────
  doc.setFillColor(...primary)
  doc.rect(0, 0, 210, 36, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.text('AgriClean', 14, 15)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text(`Rapport mensuel — ${monthLabel}`, 14, 23)
  doc.text(`Généré le ${format(new Date(), 'dd/MM/yyyy', { locale: fr })}`, 14, 29)
  if (company.name) doc.text(company.name, 140, 23)

  let y = 48

  const section = (title) => {
    doc.setFillColor(248, 250, 252)
    doc.rect(14, y - 4, 182, 8, 'F')
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...primary)
    doc.text(title, 16, y + 1)
    doc.setTextColor(0, 0, 0)
    y += 10
  }

  // ── KPI summary ──────────────────────────────────────────────────────────
  const monthMissions = missions.filter((m) => isWithinInterval(new Date(m.date), { start, end }))
  const done          = monthMissions.filter((m) => ['termine', 'facture', 'paye'].includes(m.status))
  const monthInvoices = invoices.filter((i) => isWithinInterval(new Date(i.createdAt), { start, end }))
  const caHT          = monthInvoices.reduce((s, i) => s + (i.lines ?? []).reduce((ss, l) => ss + (l.total ?? 0), 0), 0)
  const caPaid        = invoices.filter((i) => i.status === 'payee').reduce((s, i) => s + (i.lines ?? []).reduce((ss, l) => ss + (l.total ?? 0), 0), 0)
  const totalHours    = done.reduce((s, m) => s + (m.report?.realDuration ?? m.duration ?? 0), 0)

  section('Synthèse du mois')
  const kpis = [
    ['Missions planifiées', monthMissions.length],
    ['Missions réalisées', done.length],
    ['Heures d\'équipe totales', `${totalHours}h`],
    ['CA facturé HT', formatCurrency(caHT)],
    ['CA encaissé HT', formatCurrency(caPaid)],
    ['Factures en attente', invoices.filter((i) => i.status === 'en_attente' || i.status === 'relance1' || i.status === 'relance2').length],
  ]
  autoTable(doc, {
    startY: y,
    body: kpis,
    theme: 'plain',
    styles: { fontSize: 10, cellPadding: 3 },
    columnStyles: { 0: { textColor: [100, 116, 139] }, 1: { fontStyle: 'bold', halign: 'right' } },
  })
  y = doc.lastAutoTable.finalY + 10

  // ── Missions du mois ─────────────────────────────────────────────────────
  if (y > 240) { doc.addPage(); y = 20 }
  section('Missions réalisées')
  if (done.length === 0) {
    doc.setFontSize(9); doc.setTextColor(150, 150, 150)
    doc.text('Aucune mission réalisée ce mois.', 16, y); y += 8
  } else {
    const missionRows = done.map((m) => {
      const client = clients.find((c) => c.id === m.clientId)
      const typeLabel = { ramassage: 'Ramassage', nettoyage_agricole: 'Nett. agricole', nettoyage_industriel: 'Nett. industriel' }[m.type] ?? m.type
      return [
        format(new Date(m.date), 'dd/MM', { locale: fr }),
        typeLabel,
        client?.name ?? '—',
        `${m.report?.realDuration ?? m.duration ?? 0}h`,
      ]
    })
    autoTable(doc, {
      startY: y,
      head: [['Date', 'Type', 'Client', 'Durée']],
      body: missionRows,
      headStyles: { fillColor: primary, textColor: 255, fontSize: 9 },
      styles: { fontSize: 9 },
      columnStyles: { 3: { halign: 'right' } },
    })
    y = doc.lastAutoTable.finalY + 10
  }

  // ── Heures par employé ───────────────────────────────────────────────────
  if (y > 230) { doc.addPage(); y = 20 }
  section('Heures par employé')
  const empRows = employees
    .filter((e) => e.status === 'actif')
    .map((emp) => {
      const empMs  = done.filter((m) => m.teamIds?.includes(emp.id))
      const realH  = empMs.reduce((s, m) => s + (m.report?.realDuration ?? 0), 0)
      const estH   = empMs.reduce((s, m) => s + (m.duration ?? 0), 0)
      return [`${emp.firstName} ${emp.lastName}`, emp.role, empMs.length, `${estH}h`, `${realH}h`]
    })
  autoTable(doc, {
    startY: y,
    head: [['Employé', 'Rôle', 'Missions', 'Estimé', 'Réel']],
    body: empRows,
    headStyles: { fillColor: primary, textColor: 255, fontSize: 9 },
    styles: { fontSize: 9 },
    columnStyles: { 2: { halign: 'center' }, 3: { halign: 'right' }, 4: { halign: 'right', fontStyle: 'bold' } },
  })
  y = doc.lastAutoTable.finalY + 10

  // ── Factures en attente ──────────────────────────────────────────────────
  const pendingInvoices = invoices.filter((i) => ['emise', 'en_attente', 'relance1', 'relance2'].includes(i.status))
  if (pendingInvoices.length > 0) {
    if (y > 220) { doc.addPage(); y = 20 }
    section('Factures en attente de paiement')
    const invRows = pendingInvoices.map((inv) => {
      const client = clients.find((c) => c.id === inv.clientId)
      const totalHT = (inv.lines ?? []).reduce((s, l) => s + (l.total ?? 0), 0)
      const statusLabel = { emise: 'Émise', en_attente: 'En attente', relance1: 'Relance 1', relance2: 'Relance 2' }[inv.status] ?? inv.status
      return [inv.number, client?.name ?? '—', formatCurrency(totalHT), inv.dueDate ? format(new Date(inv.dueDate), 'dd/MM/yy') : '—', statusLabel]
    })
    autoTable(doc, {
      startY: y,
      head: [['N°', 'Client', 'Montant HT', 'Échéance', 'Statut']],
      body: invRows,
      headStyles: { fillColor: primary, textColor: 255, fontSize: 9 },
      styles: { fontSize: 9 },
      columnStyles: { 2: { halign: 'right' }, 3: { halign: 'center' } },
    })
  }

  // ── Footer ───────────────────────────────────────────────────────────────
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setTextColor(150, 150, 150)
    doc.text(`Page ${i}/${pageCount} — AgriClean Manager — ${monthLabel}`, 14, 290)
  }

  doc.save(`rapport-${format(month, 'yyyy-MM')}.pdf`)
}
