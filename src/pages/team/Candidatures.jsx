import { useEffect, useState } from 'react'
import { ArrowLeft, UserCheck, UserX, Clock, Mail, Phone, Briefcase, ChevronDown, ChevronUp } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useApplicationStore } from '../../store/useApplicationStore'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import EmptyState from '../../components/ui/EmptyState'
import { toast } from '../../store/useToastStore'
import { formatDate } from '../../utils/formatters'

const STATUS_CONFIG = {
  recu:      { label: 'Reçu',        cls: 'bg-blue-100 text-blue-700'    },
  en_cours:  { label: 'En cours',    cls: 'bg-amber-100 text-amber-700'  },
  accepte:   { label: 'Accepté',     cls: 'bg-green-100 text-green-700'  },
  refuse:    { label: 'Refusé',      cls: 'bg-red-100 text-red-700'      },
}

const STATUS_TABS = [
  { key: 'all',      label: 'Toutes' },
  { key: 'recu',     label: 'Reçues' },
  { key: 'en_cours', label: 'En cours' },
  { key: 'accepte',  label: 'Acceptées' },
  { key: 'refuse',   label: 'Refusées' },
]

function ApplicationCard({ app }) {
  const updateStatus = useApplicationStore((s) => s.updateStatus)
  const [expanded, setExpanded] = useState(false)
  const [saving, setSaving] = useState(false)

  const cfg = STATUS_CONFIG[app.status] ?? STATUS_CONFIG.recu

  const handleStatus = async (status) => {
    setSaving(true)
    try {
      await updateStatus(app.id, status)
      toast.success(status === 'accepte' ? 'Candidature acceptée' : status === 'refuse' ? 'Candidature refusée' : 'Statut mis à jour')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card className="p-4">
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0">
          {(app.firstName?.[0] ?? app.email?.[0] ?? '?').toUpperCase()}
        </div>

        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-semibold text-slate-900">
                {app.firstName || app.lastName
                  ? `${app.firstName ?? ''} ${app.lastName ?? ''}`.trim()
                  : app.email}
              </p>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                <Badge className={cfg.cls}>{cfg.label}</Badge>
                {app.position && (
                  <span className="flex items-center gap-1 text-xs text-slate-500">
                    <Briefcase size={11} /> {app.position}
                  </span>
                )}
                <span className="text-xs text-slate-400">{formatDate(app.createdAt)}</span>
              </div>
            </div>
            <button
              onClick={() => setExpanded((v) => !v)}
              className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors shrink-0"
              aria-label={expanded ? 'Réduire' : 'Développer'}
            >
              {expanded ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
            </button>
          </div>

          {/* Contact links */}
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            {app.email && (
              <a href={`mailto:${app.email}`} className="flex items-center gap-1 text-xs text-primary hover:underline">
                <Mail size={12} /> {app.email}
              </a>
            )}
            {app.phone && (
              <a href={`tel:${app.phone}`} className="flex items-center gap-1 text-xs text-primary hover:underline">
                <Phone size={12} /> {app.phone}
              </a>
            )}
          </div>

          {/* Expanded: message + actions */}
          {expanded && (
            <div className="mt-3 space-y-3">
              {app.message && (
                <div className="p-3 bg-slate-50 rounded-xl">
                  <p className="text-xs font-semibold text-slate-500 mb-1">Message</p>
                  <p className="text-sm text-slate-700 whitespace-pre-line">{app.message}</p>
                </div>
              )}

              {/* Action buttons */}
              {app.status !== 'accepte' && app.status !== 'refuse' && (
                <div className="flex gap-2 flex-wrap">
                  {app.status !== 'en_cours' && (
                    <button
                      disabled={saving}
                      onClick={() => handleStatus('en_cours')}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-amber-200 bg-amber-50 text-amber-700 text-xs font-semibold hover:bg-amber-100 transition-colors disabled:opacity-50"
                    >
                      <Clock size={13} /> Marquer en cours
                    </button>
                  )}
                  <button
                    disabled={saving}
                    onClick={() => handleStatus('accepte')}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-green-200 bg-green-50 text-green-700 text-xs font-semibold hover:bg-green-100 transition-colors disabled:opacity-50"
                  >
                    <UserCheck size={13} /> Accepter
                  </button>
                  <button
                    disabled={saving}
                    onClick={() => handleStatus('refuse')}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-red-200 bg-red-50 text-red-700 text-xs font-semibold hover:bg-red-100 transition-colors disabled:opacity-50"
                  >
                    <UserX size={13} /> Refuser
                  </button>
                  {app.email && (
                    <a
                      href={`mailto:${app.email}?subject=${encodeURIComponent('Votre candidature chez AgriClean')}&body=${encodeURIComponent(`Bonjour ${app.firstName ?? ''},\n\nMerci pour votre candidature au poste de ${app.position ?? 'notre entreprise'}.\n\nCordialement,\nAgriClean`)}`}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-600 text-xs font-semibold hover:bg-slate-50 transition-colors"
                    >
                      <Mail size={13} /> Répondre par mail
                    </a>
                  )}
                </div>
              )}

              {(app.status === 'accepte' || app.status === 'refuse') && (
                <button
                  onClick={() => handleStatus('recu')}
                  className="text-xs text-slate-400 hover:text-slate-600 underline"
                >
                  Remettre en attente
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}

export default function Candidatures() {
  const navigate = useNavigate()
  const applications = useApplicationStore((s) => s.applications)
  const load = useApplicationStore((s) => s.load)
  const [tab, setTab] = useState('all')

  useEffect(() => { load() }, [])

  const filtered = tab === 'all' ? applications : applications.filter((a) => a.status === tab)

  const counts = STATUS_TABS.reduce((acc, t) => {
    acc[t.key] = t.key === 'all' ? applications.length : applications.filter((a) => a.status === t.key).length
    return acc
  }, {})

  const newCount = applications.filter((a) => a.status === 'recu').length

  return (
    <div className="space-y-4 max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/team')} className="p-2 rounded-xl hover:bg-slate-100 transition-colors" aria-label="Retour">
          <ArrowLeft size={20} className="text-slate-600" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-slate-900">Candidatures</h1>
          <p className="text-xs text-slate-400 mt-0.5">Candidatures reçues via le portail public</p>
        </div>
        {newCount > 0 && (
          <span className="px-2.5 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-full">
            {newCount} nouvelle{newCount > 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Status tabs */}
      <div className="flex gap-1 overflow-x-auto">
        {STATUS_TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-3 py-2 text-xs font-semibold whitespace-nowrap rounded-lg transition-colors ${
              tab === t.key ? 'bg-primary/10 text-primary' : 'text-slate-500 hover:bg-slate-100'
            }`}
          >
            {t.label} ({counts[t.key]})
          </button>
        ))}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <EmptyState
          title="Aucune candidature"
          description={tab === 'all' ? "Les candidatures du portail public apparaissent ici." : `Aucune candidature avec ce statut.`}
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((app) => (
            <ApplicationCard key={app.id} app={app} />
          ))}
        </div>
      )}
    </div>
  )
}
