import { useState, useEffect } from 'react'
import { LogOut, FileText, FileCheck, Download, Mail } from 'lucide-react'
import PublicLayout from '../../components/layout/PublicLayout'
import Badge from '../../components/ui/Badge'
import Card from '../../components/ui/Card'
import { useAuthStore } from '../../store/useAuthStore'
import { db } from '../../db/db'
import { formatCurrency, formatDate, getStatusLabel, getStatusBadgeClass } from '../../utils/formatters'
import { generateInvoicePDF } from '../../utils/pdf'

function LoginForm() {
  const [form, setForm] = useState({ email: '', company: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const loginClient = useAuthStore((s) => s.loginClient)
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const result = await loginClient(form.email, form.company)
      if (!result.ok) setError(result.error)
    } finally {
      setLoading(false)
    }
  }

  const inputCls = 'w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors'

  return (
    <div className="min-h-[60vh] flex items-center justify-center py-16 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <FileText size={28} className="text-primary" />
          </div>
          <h1 className="text-2xl font-black text-slate-900">Espace Professionnel</h1>
          <p className="text-slate-500 mt-2 text-sm">Accédez à vos devis et factures en ligne.</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Votre email de contact *</label>
              <input required type="email" className={inputCls} value={form.email}
                onChange={(e) => set('email', e.target.value)} placeholder="contact@monentreprise.fr" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Nom de la société *</label>
              <input required className={inputCls} value={form.company}
                onChange={(e) => set('company', e.target.value)} placeholder="EARL Dupont Avicole" />
            </div>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
                {error}
              </div>
            )}
            <button type="submit" disabled={loading}
              className="w-full py-3.5 bg-primary text-white font-semibold rounded-xl hover:bg-primary-light transition-colors disabled:opacity-50">
              {loading ? 'Vérification…' : 'Accéder à mon espace'}
            </button>
          </form>
          <p className="text-xs text-slate-400 text-center mt-4">
            L'email doit correspondre à un contact enregistré par AgriClean.<br />
            En cas de problème, contactez-nous au <a href="tel:0466001122" className="underline">04 66 00 11 22</a>.
          </p>
        </div>
      </div>
    </div>
  )
}

function ClientDashboard({ clientId, clientName }) {
  const [invoices, setInvoices] = useState([])
  const [quotes, setQuotes] = useState([])
  const [client, setClient] = useState(null)
  const [settings, setSettings] = useState(null)
  const [tab, setTab] = useState('factures')
  const logoutClient = useAuthStore((s) => s.logoutClient)

  useEffect(() => {
    const load = async () => {
      const [invs, qts, cls, sts] = await Promise.all([
        db.invoices.where('clientId').equals(clientId).reverse().sortBy('createdAt'),
        db.quotes.where('clientId').equals(clientId).reverse().sortBy('createdAt'),
        db.clients.get(clientId),
        db.settings.toArray(),
      ])
      setInvoices(invs)
      setQuotes(qts)
      setClient(cls)
      setSettings(sts[0])
    }
    load()
  }, [clientId])

  const getHT = (doc) => (doc.lines ?? []).reduce((s, l) => s + (l.total ?? 0), 0)
  const getTTC = (doc) => getHT(doc) * (1 + (doc.tax ?? 20) / 100)

  const totalDue = invoices
    .filter((i) => i.status === 'en_attente' || i.status === 'emise')
    .reduce((s, i) => s + getTTC(i), 0)
  const totalPaid = invoices.filter((i) => i.status === 'payee').reduce((s, i) => s + getTTC(i), 0)

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-xs text-slate-400 uppercase tracking-widest mb-1">Espace Professionnel</p>
          <h1 className="text-2xl font-black text-slate-900">{clientName}</h1>
        </div>
        <button onClick={logoutClient}
          className="flex items-center gap-1.5 px-3 py-2 text-sm text-slate-500 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors">
          <LogOut size={16} /> Déconnexion
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-white rounded-2xl border border-slate-100 p-4 text-center shadow-sm">
          <p className="text-xl font-bold text-slate-900 font-mono">{invoices.length}</p>
          <p className="text-xs text-slate-400 mt-0.5">Factures</p>
        </div>
        <div className="bg-amber-50 rounded-2xl border border-amber-100 p-4 text-center shadow-sm">
          <p className="text-xl font-bold text-amber-700 font-mono">{formatCurrency(totalDue)}</p>
          <p className="text-xs text-amber-500 mt-0.5">En attente</p>
        </div>
        <div className="bg-green-50 rounded-2xl border border-green-100 p-4 text-center shadow-sm">
          <p className="text-xl font-bold text-green-700 font-mono">{formatCurrency(totalPaid)}</p>
          <p className="text-xs text-green-500 mt-0.5">Réglé</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-100 mb-4">
        {[
          { key: 'factures', label: `Factures (${invoices.length})`, icon: FileText },
          { key: 'devis', label: `Devis (${quotes.length})`, icon: FileCheck },
        ].map((t) => {
          const Icon = t.icon
          return (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold transition-colors border-b-2 -mb-px ${tab === t.key ? 'border-primary text-primary' : 'border-transparent text-slate-500'}`}>
              <Icon size={15} /> {t.label}
            </button>
          )
        })}
      </div>

      {/* Invoices */}
      {tab === 'factures' && (
        <div className="space-y-3">
          {invoices.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <FileText size={36} className="mx-auto mb-3 opacity-30" />
              <p>Aucune facture pour le moment</p>
            </div>
          ) : (
            invoices.map((inv) => (
              <div key={inv.id} className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-mono font-bold text-slate-900">{inv.number}</p>
                    <p className="text-sm text-slate-600 mt-0.5">
                      {formatCurrency(getHT(inv))} HT · {formatCurrency(getTTC(inv))} TTC
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      Émise le {formatDate(inv.createdAt)}
                      {inv.dueDate ? ` · Échéance ${formatDate(inv.dueDate)}` : ''}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Badge className={getStatusBadgeClass(inv.status)}>{getStatusLabel(inv.status)}</Badge>
                    <button
                      onClick={() => generateInvoicePDF(inv, client, settings)}
                      className="flex items-center gap-1 text-xs text-primary hover:underline"
                    >
                      <Download size={13} /> PDF
                    </button>
                  </div>
                </div>
                {/* Lines preview */}
                <div className="mt-3 pt-3 border-t border-slate-50 space-y-1">
                  {(inv.lines ?? []).map((l, i) => (
                    <div key={i} className="flex justify-between text-xs text-slate-600">
                      <span className="truncate flex-1 mr-4">{l.description}</span>
                      <span className="font-mono shrink-0">{formatCurrency(l.total)}</span>
                    </div>
                  ))}
                </div>
                {/* Pay reminder */}
                {(inv.status === 'en_attente' || inv.status === 'emise') && (
                  <a
                    href={`mailto:contact@agriclean.fr?subject=${encodeURIComponent(`Règlement facture ${inv.number}`)}&body=${encodeURIComponent(`Bonjour,\n\nJe vous contacte concernant la facture ${inv.number} d'un montant de ${formatCurrency(getTTC(inv))} TTC.\n\nCordialement`)}`}
                    className="mt-3 flex items-center gap-1.5 text-xs text-amber-600 hover:underline"
                  >
                    <Mail size={13} /> Contacter AgriClean pour le règlement
                  </a>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Quotes */}
      {tab === 'devis' && (
        <div className="space-y-3">
          {quotes.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <FileCheck size={36} className="mx-auto mb-3 opacity-30" />
              <p>Aucun devis pour le moment</p>
            </div>
          ) : (
            quotes.map((q) => (
              <div key={q.id} className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-mono font-bold text-slate-900">{q.number}</p>
                    <p className="text-sm text-slate-600 mt-0.5">
                      {formatCurrency(getHT(q))} HT · {formatCurrency(getTTC(q))} TTC
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      Créé le {formatDate(q.createdAt)}
                      {q.validUntil ? ` · Valable jusqu'au ${formatDate(q.validUntil)}` : ''}
                    </p>
                  </div>
                  <Badge className={getStatusBadgeClass(q.status)}>{getStatusLabel(q.status)}</Badge>
                </div>
                <div className="mt-3 pt-3 border-t border-slate-50 space-y-1">
                  {(q.lines ?? []).map((l, i) => (
                    <div key={i} className="flex justify-between text-xs text-slate-600">
                      <span className="truncate flex-1 mr-4">{l.description}</span>
                      <span className="font-mono shrink-0">{formatCurrency(l.total)}</span>
                    </div>
                  ))}
                </div>
                {q.status === 'envoye' && (
                  <a
                    href={`mailto:contact@agriclean.fr?subject=${encodeURIComponent(`Réponse devis ${q.number}`)}&body=${encodeURIComponent(`Bonjour,\n\nConcernant le devis ${q.number} d'un montant de ${formatCurrency(getTTC(q))} TTC :\n\n[ ] J'accepte ce devis\n[ ] Je le refuse\n\nCommentaire :\n\nCordialement`)}`}
                    className="mt-3 flex items-center gap-1.5 text-xs text-primary hover:underline"
                  >
                    <Mail size={13} /> Répondre à ce devis par email
                  </a>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}

export default function ClientPortal() {
  const clientSession = useAuthStore((s) => s.clientSession)

  return (
    <PublicLayout>
      {clientSession
        ? <ClientDashboard clientId={clientSession.clientId} clientName={clientSession.name} />
        : <LoginForm />
      }
    </PublicLayout>
  )
}
