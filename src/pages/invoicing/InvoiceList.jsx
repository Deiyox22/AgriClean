import { useState, useMemo, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Mail, ChevronRight, AlertTriangle, Plus, Euro, FileCheck, Search } from 'lucide-react'
import { useInvoiceStore } from '../../store/useInvoiceStore'
import { useQuoteStore } from '../../store/useQuoteStore'
import { useClientStore } from '../../store/useClientStore'
import { useSettingsStore } from '../../store/useSettingsStore'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import StatCard from '../../components/ui/StatCard'
import Modal from '../../components/ui/Modal'
import EmptyState from '../../components/ui/EmptyState'
import LineItemsEditor from '../../components/ui/LineItemsEditor'
import { formatCurrency, formatDate, getStatusLabel, getStatusBadgeClass } from '../../utils/formatters'
import { startOfMonth, endOfMonth, subMonths, startOfYear, isWithinInterval, isPast, addDays, format } from 'date-fns'

const INVOICE_STATUS_TABS = [
  { key: 'all', label: 'Toutes' },
  { key: 'emise', label: 'Émises' },
  { key: 'en_attente', label: 'En attente' },
  { key: 'payee', label: 'Payées' },
]

const QUOTE_STATUS_TABS = [
  { key: 'all', label: 'Tous' },
  { key: 'brouillon', label: 'Brouillon' },
  { key: 'envoye', label: 'Envoyés' },
  { key: 'accepte', label: 'Acceptés' },
  { key: 'refuse', label: 'Refusés' },
]

const defaultLines = () => [{ description: '', quantity: 1, unitPrice: 0, total: 0 }]

function InvoiceForm({ onSave, onClose, clients, settings }) {
  const [form, setForm] = useState({
    clientId: '',
    lines: defaultLines(),
    tax: 20,
    dueDate: format(addDays(new Date(), 30), 'yyyy-MM-dd'),
    status: 'emise',
    note: '',
  })
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))
  const totalHT = form.lines.reduce((s, l) => s + (l.total ?? 0), 0)
  const inputCls = 'w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary'
  const labelCls = 'block text-xs font-medium text-slate-600 mb-1'

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.clientId) return
    onSave({ ...form, clientId: Number(form.clientId), dueDate: new Date(form.dueDate).toISOString() })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className={labelCls}>Client *</label>
          <select required className={inputCls} value={form.clientId} onChange={(e) => set('clientId', e.target.value)}>
            <option value="">Sélectionner un client…</option>
            {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className={labelCls}>Date d'échéance</label>
          <input type="date" className={inputCls} value={form.dueDate} onChange={(e) => set('dueDate', e.target.value)} />
        </div>
        <div>
          <label className={labelCls}>TVA (%)</label>
          <select className={inputCls} value={form.tax} onChange={(e) => set('tax', Number(e.target.value))}>
            <option value={0}>0 % (exonéré)</option>
            <option value={10}>10 %</option>
            <option value={20}>20 %</option>
          </select>
        </div>
      </div>

      <div>
        <label className={labelCls}>Lignes de prestation *</label>
        <LineItemsEditor lines={form.lines} onChange={(lines) => set('lines', lines)} />
      </div>

      <div className="bg-slate-50 rounded-xl p-3 text-sm space-y-1">
        <div className="flex justify-between text-slate-600"><span>Total HT</span><span className="font-mono">{formatCurrency(totalHT)}</span></div>
        <div className="flex justify-between text-slate-600"><span>TVA ({form.tax}%)</span><span className="font-mono">{formatCurrency(totalHT * form.tax / 100)}</span></div>
        <div className="flex justify-between font-bold text-slate-900 pt-1 border-t border-slate-200"><span>Total TTC</span><span className="font-mono text-primary">{formatCurrency(totalHT * (1 + form.tax / 100))}</span></div>
      </div>

      <div>
        <label className={labelCls}>Note interne (optionnel)</label>
        <textarea rows={2} className={inputCls} value={form.note} onChange={(e) => set('note', e.target.value)} placeholder="Note visible uniquement en interne…" />
      </div>

      <div className="flex gap-3 pt-1">
        <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50">Annuler</button>
        <button type="submit" disabled={!form.clientId || form.lines.every((l) => !l.description)}
          className="flex-1 py-2.5 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary-light disabled:opacity-40">
          Créer la facture
        </button>
      </div>
    </form>
  )
}

const CONDITION_TEMPLATES = {
  standard: 'Paiement à 30 jours fin de mois. Tout retard de paiement entraîne des pénalités de 3 fois le taux légal en vigueur. TVA non applicable si franchise en base.',
  contrat:  "Contrat annuel renouvelable par tacite reconduction. Résiliation avec préavis écrit de 3 mois. Révision tarifaire annuelle selon indice INSEE du coût de la main-d'œuvre.",
  urgent:   'Intervention prioritaire sous 48h ouvrées. Majoration urgence de 20% applicable. Paiement à réception de facture, sans escompte.',
}

const RECURRENCE_LABELS = {
  ponctuel:   'Ponctuelle (une seule intervention)',
  hebdomadaire: 'Hebdomadaire',
  bimensuelle:  'Bimensuelle (2× par mois)',
  mensuelle:  'Mensuelle',
  trimestrielle: 'Trimestrielle',
  annuelle:   'Annuelle (contrat)',
}

function QuoteForm({ onSave, onClose, clients, settings }) {
  const rates = settings?.defaultRates ?? {}
  const [form, setForm] = useState({
    clientId:   '',
    lines:      defaultLines(),
    tax:        settings?.defaultRates?.tvaDefault ?? 20,
    validUntil: format(addDays(new Date(), 30), 'yyyy-MM-dd'),
    recurrence: 'ponctuel',
    status:     'brouillon',
    note:       '',
  })
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))
  const totalHT = form.lines.reduce((s, l) => s + (l.total ?? 0), 0)
  const inputCls = 'w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary'
  const labelCls = 'block text-xs font-medium text-slate-600 mb-1'

  const addServiceLine = (type) => {
    const SERVICES = {
      ramassage:            { description: 'Ramassage d\'œufs — collecte et comptage en exploitations avicoles', unitPrice: rates.ramassage ?? 68, unit: 'h' },
      nettoyage_agricole:   { description: 'Nettoyage agricole — désinfection et lavage des bâtiments d\'élevage', unitPrice: rates.nettoyage_agricole ?? 78, unit: 'h' },
      nettoyage_industriel: { description: 'Nettoyage industriel — dégraissage, désinfection et rinçage haute pression', unitPrice: rates.nettoyage_industriel ?? 98, unit: 'h' },
      deplacement:          { description: 'Frais de déplacement (aller-retour)', unitPrice: settings?.travelSettings?.ratePerKm ?? 0.68, unit: 'km' },
    }
    const svc = SERVICES[type]
    if (!svc) return
    const newLine = { description: svc.description, quantity: 1, unitPrice: svc.unitPrice, unit: svc.unit, total: svc.unitPrice }
    const isEmpty = form.lines.length === 1 && !form.lines[0].description && form.lines[0].unitPrice === 0
    set('lines', isEmpty ? [newLine] : [...form.lines, newLine])
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.clientId) return
    onSave({ ...form, clientId: Number(form.clientId), validUntil: new Date(form.validUntil).toISOString(), missionId: null })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">

      {/* Client + dates */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className={labelCls}>Client *</label>
          <select required className={inputCls} value={form.clientId} onChange={(e) => set('clientId', e.target.value)}>
            <option value="">Sélectionner un client…</option>
            {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className={labelCls}>Valable jusqu'au</label>
          <input type="date" className={inputCls} value={form.validUntil} onChange={(e) => set('validUntil', e.target.value)} />
        </div>
        <div>
          <label className={labelCls}>TVA (%)</label>
          <select className={inputCls} value={form.tax} onChange={(e) => set('tax', Number(e.target.value))}>
            <option value={0}>0 % (franchise / exonéré)</option>
            <option value={10}>10 % (services agricoles ETA)</option>
            <option value={20}>20 % (taux normal)</option>
          </select>
        </div>
      </div>

      {/* Récurrence */}
      <div>
        <label className={labelCls}>Fréquence d'intervention</label>
        <select className={inputCls} value={form.recurrence} onChange={(e) => set('recurrence', e.target.value)}>
          {Object.entries(RECURRENCE_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </div>

      {/* Prestations rapides */}
      <div>
        <label className={labelCls}>Ajouter une prestation type</label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[
            { key: 'ramassage',            emoji: '🥚', label: 'Ramassage', price: rates.ramassage ?? 68 },
            { key: 'nettoyage_agricole',   emoji: '🌿', label: 'Nett. agricole', price: rates.nettoyage_agricole ?? 78 },
            { key: 'nettoyage_industriel', emoji: '🏭', label: 'Nett. industriel', price: rates.nettoyage_industriel ?? 98 },
            { key: 'deplacement',          emoji: '🚗', label: 'Déplacement', price: `${settings?.travelSettings?.ratePerKm ?? 0.68}€/km` },
          ].map((s) => (
            <button key={s.key} type="button" onClick={() => addServiceLine(s.key)}
              className="flex flex-col items-center gap-1 p-3 rounded-xl border border-slate-200 hover:border-primary/50 hover:bg-primary/5 transition-all text-center">
              <span className="text-xl">{s.emoji}</span>
              <span className="text-xs font-semibold text-slate-700">{s.label}</span>
              <span className="text-[10px] text-slate-400 font-mono">{typeof s.price === 'number' ? `${s.price}€/h` : s.price}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Lignes */}
      <div>
        <label className={labelCls}>Lignes de prestation *</label>
        <LineItemsEditor lines={form.lines} onChange={(lines) => set('lines', lines)} showUnit />
      </div>

      {/* Totaux */}
      <div className="bg-slate-50 rounded-xl p-3 text-sm space-y-1">
        <div className="flex justify-between text-slate-600"><span>Total HT</span><span className="font-mono">{formatCurrency(totalHT)}</span></div>
        <div className="flex justify-between text-slate-600"><span>TVA ({form.tax}%)</span><span className="font-mono">{formatCurrency(totalHT * form.tax / 100)}</span></div>
        <div className="flex justify-between font-bold text-slate-900 pt-1 border-t border-slate-200"><span>Total TTC</span><span className="font-mono text-primary">{formatCurrency(totalHT * (1 + form.tax / 100))}</span></div>
        {form.recurrence !== 'ponctuel' && totalHT > 0 && (
          <div className="flex justify-between text-xs text-primary font-medium pt-1 border-t border-slate-100">
            <span>Engagement {RECURRENCE_LABELS[form.recurrence]?.toLowerCase()}</span>
            <span className="font-mono">{formatCurrency(totalHT)} HT × occurrence</span>
          </div>
        )}
      </div>

      {/* Conditions */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className={labelCls}>Conditions</label>
          <div className="flex gap-1">
            {Object.entries({ standard: 'Standard', contrat: 'Contrat', urgent: 'Urgence' }).map(([k, v]) => (
              <button key={k} type="button" onClick={() => set('note', CONDITION_TEMPLATES[k])}
                className="text-[10px] px-2 py-1 rounded-lg bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors font-medium">
                {v}
              </button>
            ))}
          </div>
        </div>
        <textarea rows={3} className={inputCls} value={form.note} onChange={(e) => set('note', e.target.value)}
          placeholder="Conditions particulières, délai d'intervention, remarques…" />
      </div>

      <div className="flex gap-3 pt-1">
        <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50">Annuler</button>
        <button type="submit" disabled={!form.clientId || form.lines.every((l) => !l.description)}
          className="flex-1 py-2.5 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary-light disabled:opacity-40">
          Créer le devis
        </button>
      </div>
    </form>
  )
}

export default function InvoiceList() {
  const invoices = useInvoiceStore((s) => s.invoices)
  const addInvoice = useInvoiceStore((s) => s.add)
  const quotes = useQuoteStore((s) => s.quotes)
  const addQuote = useQuoteStore((s) => s.add)
  const getClient = useClientStore((s) => s.getById)
  const clients = useClientStore((s) => s.clients)
  const settings = useSettingsStore((s) => s.settings)
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [mainTab, setMainTab] = useState(() => searchParams.get('tab') === 'devis' ? 'devis' : 'factures')

  useEffect(() => {
    const tab = searchParams.get('tab')
    if (tab === 'devis' || tab === 'factures') setMainTab(tab)
  }, [searchParams])
  const [invoiceTab,    setInvoiceTab]    = useState('all')
  const [quoteTab,      setQuoteTab]      = useState('all')
  const [search,        setSearch]        = useState('')
  const [periodFilter,  setPeriodFilter]  = useState('all')
  const [modal,         setModal]         = useState(null)

  const getHT = (doc) => (doc.lines ?? []).reduce((sum, l) => sum + (l.total ?? 0), 0)
  const getTTC = (doc) => getHT(doc) * (1 + (doc.tax ?? 20) / 100)

  const now = new Date()
  const monthStart = startOfMonth(now)
  const monthEnd = endOfMonth(now)

  const kpis = useMemo(() => {
    const monthInvoices = invoices.filter((i) => isWithinInterval(new Date(i.createdAt), { start: monthStart, end: monthEnd }))
    const emis = monthInvoices.reduce((sum, i) => sum + getHT(i), 0)
    const encaisse = invoices.filter((i) => i.status === 'payee').reduce((sum, i) => sum + getHT(i), 0)
    const retard = invoices.filter((i) => i.status === 'en_attente' && i.dueDate && isPast(new Date(i.dueDate))).reduce((sum, i) => sum + getHT(i), 0)
    const devisEnCours = quotes.filter((q) => q.status === 'envoye' || q.status === 'brouillon').reduce((sum, q) => sum + getHT(q), 0)
    return { emis, encaisse, retard, devisEnCours }
  }, [invoices, quotes])

  const getPeriodRange = () => {
    const n = new Date()
    if (periodFilter === 'this_month')   return { start: startOfMonth(n), end: endOfMonth(n) }
    if (periodFilter === 'last_month')   { const m = subMonths(n, 1); return { start: startOfMonth(m), end: endOfMonth(m) } }
    if (periodFilter === 'last_3months') return { start: startOfMonth(subMonths(n, 2)), end: endOfMonth(n) }
    if (periodFilter === 'this_year')    return { start: startOfYear(n), end: endOfMonth(n) }
    return null
  }

  const filteredInvoices = useMemo(() => {
    let list = invoiceTab === 'all' ? invoices : invoices.filter((i) => i.status === invoiceTab)
    const range = getPeriodRange()
    if (range) list = list.filter((i) => i.createdAt && isWithinInterval(new Date(i.createdAt), range))
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter((i) => {
        const c = getClient(i.clientId)
        return c?.name.toLowerCase().includes(q) || (i.number ?? '').toLowerCase().includes(q)
      })
    }
    return list
  }, [invoices, invoiceTab, search, periodFilter, getClient])

  const filteredQuotes = useMemo(() => {
    let list = quoteTab === 'all' ? quotes : quotes.filter((q) => q.status === quoteTab)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter((qu) => {
        const c = getClient(qu.clientId)
        return c?.name.toLowerCase().includes(q) || (qu.number ?? '').toLowerCase().includes(q)
      })
    }
    return list
  }, [quotes, quoteTab, search, getClient])

  const isLate = (inv) => inv.status === 'en_attente' && inv.dueDate && isPast(new Date(inv.dueDate))

  const getRelanceMailto = (inv) => {
    const client = getClient(inv.clientId)
    const contact = client?.contacts?.find((c) => c.preferred) ?? client?.contacts?.[0]
    const email = contact?.email ?? ''
    const subject = encodeURIComponent(`Relance facture ${inv.number}`)
    const body = encodeURIComponent(`Bonjour,\n\nNous vous relançons concernant la facture ${inv.number} d'un montant de ${formatCurrency(getHT(inv))} HT, dont l'échéance était le ${formatDate(inv.dueDate)}.\n\nCordialement,\n${settings?.company?.name ?? 'AgriClean'}`)
    return `mailto:${email}?subject=${subject}&body=${body}`
  }

  const handleCreateInvoice = async (data) => {
    const id = await addInvoice(data)
    setModal(null)
    navigate(`/invoicing/${id}`)
  }

  const handleCreateQuote = async (data) => {
    const id = await addQuote(data)
    setModal(null)
    navigate(`/invoicing/devis/${id}`)
  }

  return (
    <div className="space-y-4">
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Émis ce mois" value={formatCurrency(kpis.emis)} icon={Euro} color="primary" />
        <StatCard label="Encaissé" value={formatCurrency(kpis.encaisse)} icon={Euro} color="green" />
        <StatCard label="En retard" value={formatCurrency(kpis.retard)} icon={AlertTriangle} color="red" />
        <StatCard label="Devis en cours" value={formatCurrency(kpis.devisEnCours)} icon={FileCheck} color="blue" />
      </div>

      {/* Search + period */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher par client ou numéro…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          />
        </div>
        <select
          value={periodFilter}
          onChange={(e) => setPeriodFilter(e.target.value)}
          className="px-3 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 text-slate-600 shrink-0"
        >
          <option value="all">Toutes les dates</option>
          <option value="this_month">Ce mois</option>
          <option value="last_month">Mois dernier</option>
          <option value="last_3months">3 derniers mois</option>
          <option value="this_year">Cette année</option>
        </select>
      </div>

      {/* Main tabs + button */}
      <div className="flex items-center justify-between">
        <div className="flex gap-1 border-b border-slate-100">
          {[{ key: 'factures', label: `Factures (${invoices.length})` }, { key: 'devis', label: `Devis (${quotes.length})` }].map((t) => (
            <button key={t.key} onClick={() => setMainTab(t.key)}
              className={`px-4 py-2.5 text-sm font-semibold transition-colors border-b-2 -mb-px ${mainTab === t.key ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-900'}`}>
              {t.label}
            </button>
          ))}
        </div>
        <button
          onClick={() => setModal(mainTab === 'factures' ? 'invoice' : 'quote')}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary-light transition-colors min-h-[44px]"
        >
          <Plus size={16} />
          {mainTab === 'factures' ? 'Nouvelle facture' : 'Nouveau devis'}
        </button>
      </div>

      {/* FACTURES */}
      {mainTab === 'factures' && (
        <div className="space-y-3">
          <div className="flex gap-1 overflow-x-auto">
            {INVOICE_STATUS_TABS.map((t) => {
              const count = t.key === 'all' ? invoices.length : invoices.filter((i) => i.status === t.key).length
              return (
                <button key={t.key} onClick={() => setInvoiceTab(t.key)}
                  className={`px-4 py-2 text-xs font-medium whitespace-nowrap rounded-lg transition-colors ${invoiceTab === t.key ? 'bg-primary/10 text-primary' : 'text-slate-500 hover:bg-slate-100'}`}>
                  {t.label} ({count})
                </button>
              )
            })}
          </div>

          {filteredInvoices.length === 0 ? (
            <EmptyState title="Aucune facture" description="Créez une facture manuellement ou depuis une mission terminée." action={
              <button onClick={() => setModal('invoice')} className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-medium">Nouvelle facture</button>
            } />
          ) : (
            filteredInvoices.map((inv) => {
              const client = getClient(inv.clientId)
              const late = isLate(inv)
              return (
                <Card key={inv.id} className={`p-4 ${late ? 'border-red-200' : ''}`}>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-mono font-semibold text-slate-900 text-sm">{inv.number}</p>
                        {late && <span className="flex items-center gap-1 text-xs text-red-600"><AlertTriangle size={12} />En retard</span>}
                      </div>
                      <p className="text-xs text-slate-500 truncate">{client?.name ?? '—'}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-slate-600 font-medium">{formatCurrency(getHT(inv))} HT</span>
                        <span className="text-xs text-slate-400">·</span>
                        <span className="text-xs text-slate-400">{formatCurrency(getTTC(inv))} TTC</span>
                        <span className="text-xs text-slate-400">· Éch. {formatDate(inv.dueDate)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge className={getStatusBadgeClass(inv.status)}>{getStatusLabel(inv.status)}</Badge>
                      {late && (
                        <a href={getRelanceMailto(inv)} onClick={(e) => e.stopPropagation()}
                          className="flex items-center gap-1 px-2 py-1.5 bg-red-50 text-red-600 rounded-lg text-xs hover:bg-red-100 transition-colors" aria-label="Envoyer relance">
                          <Mail size={12} /> Relance
                        </a>
                      )}
                      <button onClick={() => navigate(`/invoicing/${inv.id}`)} className="p-1.5 hover:bg-slate-100 rounded-lg" aria-label="Voir la facture">
                        <ChevronRight size={16} className="text-slate-300" />
                      </button>
                    </div>
                  </div>
                </Card>
              )
            })
          )}
        </div>
      )}

      {/* DEVIS */}
      {mainTab === 'devis' && (
        <div className="space-y-3">
          <div className="flex gap-1 overflow-x-auto">
            {QUOTE_STATUS_TABS.map((t) => {
              const count = t.key === 'all' ? quotes.length : quotes.filter((q) => q.status === t.key).length
              return (
                <button key={t.key} onClick={() => setQuoteTab(t.key)}
                  className={`px-4 py-2 text-xs font-medium whitespace-nowrap rounded-lg transition-colors ${quoteTab === t.key ? 'bg-primary/10 text-primary' : 'text-slate-500 hover:bg-slate-100'}`}>
                  {t.label} ({count})
                </button>
              )
            })}
          </div>

          {filteredQuotes.length === 0 ? (
            <EmptyState title="Aucun devis" description="Créez un devis pour proposer un prix à un client avant d'intervenir." action={
              <button onClick={() => setModal('quote')} className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-medium">Nouveau devis</button>
            } />
          ) : (
            filteredQuotes.map((q) => {
              const client = getClient(q.clientId)
              const expired = q.validUntil && isPast(new Date(q.validUntil)) && q.status !== 'accepte' && q.status !== 'refuse' && q.status !== 'converti'
              return (
                <Card key={q.id} className={`p-4 ${expired ? 'border-amber-200' : ''}`}>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-mono font-semibold text-slate-900 text-sm">{q.number}</p>
                        {expired && <span className="text-xs text-amber-600">Expiré</span>}
                      </div>
                      <p className="text-xs text-slate-500 truncate">{client?.name ?? '—'}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-slate-600 font-medium">{formatCurrency(getHT(q))} HT</span>
                        <span className="text-xs text-slate-400">· Valable jusqu'au {formatDate(q.validUntil)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge className={getStatusBadgeClass(q.status)}>{getStatusLabel(q.status)}</Badge>
                      <button onClick={() => navigate(`/invoicing/devis/${q.id}`)} className="p-1.5 hover:bg-slate-100 rounded-lg" aria-label="Voir le devis">
                        <ChevronRight size={16} className="text-slate-300" />
                      </button>
                    </div>
                  </div>
                </Card>
              )
            })
          )}
        </div>
      )}

      {/* Modals */}
      <Modal open={modal === 'invoice'} onClose={() => setModal(null)} title="Nouvelle facture" size="lg">
        <InvoiceForm onSave={handleCreateInvoice} onClose={() => setModal(null)} clients={clients} settings={settings} />
      </Modal>

      <Modal open={modal === 'quote'} onClose={() => setModal(null)} title="Nouveau devis" size="lg">
        <QuoteForm onSave={handleCreateQuote} onClose={() => setModal(null)} clients={clients} settings={settings} />
      </Modal>
    </div>
  )
}
