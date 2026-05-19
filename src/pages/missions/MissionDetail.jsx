import { useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Pencil, Trash2, AlertTriangle, CheckCircle,
  FileText, Camera, X, RefreshCw, Image, Plus,
} from 'lucide-react'
import { useMissionStore } from '../../store/useMissionStore'
import { useClientStore } from '../../store/useClientStore'
import { useEmployeeStore } from '../../store/useEmployeeStore'
import { useVehicleStore } from '../../store/useVehicleStore'
import { useInvoiceStore } from '../../store/useInvoiceStore'
import { useSettingsStore } from '../../store/useSettingsStore'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Modal from '../../components/ui/Modal'
import {
  getMissionTypeLabel, getStatusLabel, getStatusBadgeClass,
  formatDate, formatDateTime, getInitials,
} from '../../utils/formatters'
import { addDays, format } from 'date-fns'
import { fr } from 'date-fns/locale'

const STATUSES = ['planifie', 'en_cours', 'termine', 'facture', 'paye', 'annule']
const avatarColors = ['bg-primary', 'bg-accent', 'bg-blue-500', 'bg-purple-500', 'bg-teal-500']

// ─── Toast banner ────────────────────────────────────────────────────────────
function SuccessBanner({ message, onClose }) {
  if (!message) return null
  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-green-50 border border-green-200 rounded-2xl text-sm text-green-800 font-medium">
      <CheckCircle size={18} className="text-green-500 shrink-0" />
      <span className="flex-1">{message}</span>
      <button onClick={onClose} className="text-green-400 hover:text-green-600 shrink-0" aria-label="Fermer">
        <X size={16} />
      </button>
    </div>
  )
}

// ─── Photo utilities ─────────────────────────────────────────────────────────
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export default function MissionDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const getById            = useMissionStore((s) => s.getById)
  const update             = useMissionStore((s) => s.update)
  const remove             = useMissionStore((s) => s.remove)
  const createNextOccurrence = useMissionStore((s) => s.createNextOccurrence)
  const getClient          = useClientStore((s) => s.getById)
  const getEmployee        = useEmployeeStore((s) => s.getById)
  const getVehicle         = useVehicleStore((s) => s.getVehicleById)
  const addInvoice         = useInvoiceStore((s) => s.add)
  const invoices           = useInvoiceStore((s) => s.invoices)
  const settings           = useSettingsStore((s) => s.settings)

  const [showReport, setShowReport]   = useState(false)
  const [report, setReport]           = useState({ realDuration: 0, notes: '', incidents: [], consumables: [] })
  const [newIncident, setNewIncident] = useState({ text: '', severity: 'info' })
  const [newCheckItem, setNewCheckItem] = useState('')
  const [invoiceModal, setInvoiceModal] = useState(false)
  const [invoiceLines, setInvoiceLines] = useState([])
  const [successMsg, setSuccessMsg]   = useState('')
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const photoInputRef = useRef(null)

  const mission = getById(Number(id))

  if (!mission) return (
    <div className="text-center py-16 text-slate-400">
      <p>Mission introuvable.</p>
      <button onClick={() => navigate('/missions')} className="mt-4 text-primary underline text-sm">Retour</button>
    </div>
  )

  const client  = getClient(mission.clientId)
  const team    = mission.teamIds?.map((tid) => getEmployee(tid)).filter(Boolean) ?? []
  const vehicle = mission.vehicleId ? getVehicle(mission.vehicleId) : null
  const isNettoyage    = mission.type !== 'ramassage'
  const canReport      = mission.status === 'en_cours' || mission.status === 'termine'
  const canInvoice     = mission.status === 'termine'
  const linkedInvoice  = invoices.find((i) => i.missionId === mission.id)
  const checklist   = mission.cleaningData?.checklist ?? []
  const photos      = mission.cleaningData?.photos ?? []

  const showSuccess = (msg) => {
    setSuccessMsg(msg)
    setTimeout(() => setSuccessMsg(''), 5000)
  }

  // ── Status change + récurrence auto ──────────────────────────────────────
  const handleStatusChange = async (status) => {
    await update(mission.id, { status })

    if (status === 'termine' && mission.recurrence && mission.recurrence !== 'aucune') {
      const nextId = await createNextOccurrence({ ...mission, status: 'termine' })
      if (nextId) {
        const { fr: frLocale } = await import('date-fns/locale')
        const { addWeeks, addDays: addDaysDF } = await import('date-fns')
        // Just show message with recurrence label
        const labels = { journaliere: 'demain', hebdomadaire: 'la semaine prochaine', bimensuelle: 'dans 2 semaines', mensuelle: 'le mois prochain' }
        showSuccess(`✓ Mission clôturée · Prochaine occurrence créée automatiquement pour ${labels[mission.recurrence] ?? mission.recurrence}`)
      }
    }

    if (status === 'en_cours') {
      setReport({ realDuration: mission.duration ?? 0, notes: '', incidents: [], consumables: [] })
    }
  }

  // ── Checklist toggle (direct, sans modal) ────────────────────────────────
  const toggleChecklistItem = async (index) => {
    const checklist = [...(mission.cleaningData?.checklist ?? [])]
    checklist[index] = { ...checklist[index], done: !checklist[index].done }
    await update(mission.id, { cleaningData: { ...mission.cleaningData, checklist } })
  }

  const addChecklistItem = async () => {
    if (!newCheckItem.trim()) return
    const checklist = [...(mission.cleaningData?.checklist ?? []), { label: newCheckItem.trim(), done: false }]
    await update(mission.id, { cleaningData: { ...mission.cleaningData, checklist } })
    setNewCheckItem('')
  }

  const removeChecklistItem = async (index) => {
    const checklist = (mission.cleaningData?.checklist ?? []).filter((_, i) => i !== index)
    await update(mission.id, { cleaningData: { ...mission.cleaningData, checklist } })
  }

  // ── Photo upload ──────────────────────────────────────────────────────────
  const handlePhotoUpload = async (e) => {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return
    setUploadingPhoto(true)
    try {
      const existingPhotos = mission.cleaningData?.photos ?? []
      if (existingPhotos.length + files.length > 8) {
        showSuccess('Maximum 8 photos par mission')
        return
      }
      const base64s = await Promise.all(files.map(fileToBase64))
      const newPhotos = base64s.map((src, i) => ({
        id: Date.now() + i,
        src,
        caption: '',
        addedAt: new Date().toISOString(),
      }))
      await update(mission.id, {
        cleaningData: { ...mission.cleaningData, photos: [...existingPhotos, ...newPhotos] },
      })
      showSuccess(`${newPhotos.length} photo(s) ajoutée(s)`)
    } finally {
      setUploadingPhoto(false)
      e.target.value = ''
    }
  }

  const removePhoto = async (photoId) => {
    const photos = (mission.cleaningData?.photos ?? []).filter((p) => p.id !== photoId)
    await update(mission.id, { cleaningData: { ...mission.cleaningData, photos } })
  }

  // ── Report close ──────────────────────────────────────────────────────────
  const handleCloseReport = async () => {
    await update(mission.id, { report, status: 'termine' })
    setShowReport(false)
    showSuccess('Compte-rendu enregistré · Mission clôturée')
  }

  // ── Invoice generation ────────────────────────────────────────────────────
  const handleGenerateInvoice = async () => {
    const rate  = settings.defaultRates?.[mission.type] ?? 90
    const lines = [{
      description: `${getMissionTypeLabel(mission.type)} — ${client?.name ?? ''}`,
      quantity: mission.duration ?? 1,
      unitPrice: rate,
      total: rate * (mission.duration ?? 1),
    }]

    // Auto-add travel line if configured and billable
    const ts = settings.travelSettings
    const travel = mission.travel
    if (ts?.mode && ts.mode !== 'none' && travel?.billable) {
      if (ts.mode === 'km' && travel.distanceKm) {
        const kmAller    = Number(travel.distanceKm)
        const kmAR       = kmAller * 2                              // aller-retour
        const billableKm = Math.max(0, kmAR - (ts.freeKm ?? 0))
        if (billableKm > 0) {
          const rateKm     = ts.ratePerKm ?? 0.68
          const travelTotal = billableKm * rateKm
          const freeNote   = (ts.freeKm ?? 0) > 0 ? ` — ${ts.freeKm} km offerts` : ''
          lines.push({
            description: `Frais de déplacement — ${kmAller} km × 2 = ${kmAR} km A/R${freeNote}`,
            quantity: billableKm,
            unitPrice: rateKm,
            total: travelTotal,
          })
        }
      } else if (ts.mode === 'duration' && travel.durationMin) {
        const minAller    = Number(travel.durationMin)
        const minAR       = minAller * 2                            // aller-retour
        const rateH       = ts.ratePerHour ?? 45
        const travelTotal = (minAR / 60) * rateH
        lines.push({
          description: `Temps de trajet — ${minAller} min aller × 2 = ${minAR} min A/R`,
          quantity: parseFloat((minAR / 60).toFixed(2)),
          unitPrice: rateH,
          total: travelTotal,
        })
      } else if (ts.mode === 'flat') {
        lines.push({
          description: 'Forfait déplacement',
          quantity: 1,
          unitPrice: ts.flatFee ?? 35,
          total: ts.flatFee ?? 35,
        })
      }
    }

    setInvoiceLines(lines)
    setInvoiceModal(true)
  }

  const handleCreateInvoice = async () => {
    const invoiceId = await addInvoice({
      clientId: mission.clientId,
      missionId: mission.id,
      lines: invoiceLines,
      tax: 20,
      status: 'emise',
      dueDate: addDays(new Date(), 30).toISOString(),
      paidAt: null,
    })
    await update(mission.id, { status: 'facture' })
    setInvoiceModal(false)
    navigate(`/invoicing/${invoiceId}`)
  }

  const handleDelete = async () => {
    if (!window.confirm('Supprimer cette mission ?')) return
    await remove(mission.id)
    navigate('/missions')
  }

  const inputCls = 'w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary'

  return (
    <div className="space-y-4 max-w-2xl">

      {/* Header */}
      <div className="flex items-center gap-2">
        <button onClick={() => navigate('/missions')} className="p-2 rounded-xl hover:bg-slate-100" aria-label="Retour">
          <ArrowLeft size={20} className="text-slate-600" />
        </button>
        <div className="flex-1" />
        <button onClick={() => navigate(`/missions/${id}/edit`)} className="p-2 rounded-xl hover:bg-slate-100" aria-label="Modifier">
          <Pencil size={18} className="text-slate-600" />
        </button>
        <button onClick={handleDelete} className="p-2 rounded-xl hover:bg-red-50" aria-label="Supprimer">
          <Trash2 size={18} className="text-red-500" />
        </button>
      </div>

      {/* Success banner */}
      <SuccessBanner message={successMsg} onClose={() => setSuccessMsg('')} />

      {/* Hero card */}
      <Card className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-2xl mb-1">{mission.type === 'ramassage' ? '🥚' : '🧹'}</div>
            <h1 className="text-xl font-bold text-slate-900">{getMissionTypeLabel(mission.type)}</h1>
            <p className="text-slate-500 text-sm mt-0.5">{client?.name ?? '—'}</p>
            <p className="text-xs text-slate-400 mt-1">{formatDateTime(mission.date)} · {mission.duration}h estimées</p>
            {mission.recurrence && mission.recurrence !== 'aucune' && (
              <div className="flex items-center gap-1.5 mt-2 text-xs text-primary bg-primary/10 px-2.5 py-1 rounded-full w-fit">
                <RefreshCw size={12} /> Récurrence : {mission.recurrence}
              </div>
            )}
          </div>
          <Badge className={`${getStatusBadgeClass(mission.status)} text-sm px-3 py-1 shrink-0`}>
            {getStatusLabel(mission.status)}
          </Badge>
        </div>

        {/* Status buttons */}
        <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-slate-50">
          {STATUSES.slice(0, 5).map((s) => (
            <button key={s} onClick={() => handleStatusChange(s)} disabled={mission.status === s}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                mission.status === s
                  ? 'bg-primary text-white border-primary'
                  : 'border-slate-200 text-slate-600 hover:border-primary/40'
              }`}>
              {getStatusLabel(s)}
            </button>
          ))}
        </div>
      </Card>

      {/* Site & instructions & travel */}
      {(mission.siteAddress || mission.instructions || mission.travel?.distanceKm || mission.travel?.durationMin) && (
        <Card className="p-4 space-y-3">
          {mission.siteAddress && <Row label="Site d'intervention" value={mission.siteAddress} />}
          {mission.instructions && <Row label="Instructions" value={mission.instructions} />}
          {/* Travel summary */}
          {(mission.travel?.distanceKm || mission.travel?.durationMin) && (
            <div>
              <p className="text-xs text-slate-400 mb-1">Déplacement</p>
              <div className="flex items-center gap-2 flex-wrap">
                {mission.travel?.distanceKm && (
                  <span className="flex items-center gap-1 text-sm text-slate-700 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
                    🚗 {mission.travel.distanceKm} km aller · {Number(mission.travel.distanceKm) * 2} km A/R
                  </span>
                )}
                {mission.travel?.durationMin && (
                  <span className="flex items-center gap-1 text-sm text-slate-700 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
                    ⏱ {mission.travel.durationMin} min aller · {Number(mission.travel.durationMin) * 2} min A/R
                  </span>
                )}
                <span className={`text-xs px-2 py-1 rounded-lg font-medium ${
                  mission.travel?.billable
                    ? 'bg-green-100 text-green-700'
                    : 'bg-slate-100 text-slate-500'
                }`}>
                  {mission.travel?.billable ? 'Facturé' : 'Non facturé'}
                </span>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Team */}
      <Card className="p-4">
        <h2 className="font-semibold text-slate-900 mb-3">Équipe assignée</h2>
        {team.length === 0
          ? <p className="text-sm text-slate-400">Aucun employé assigné</p>
          : (
            <div className="flex flex-wrap gap-2">
              {team.map((emp, i) => (
                <div key={emp.id} className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-xl">
                  <div className={`w-8 h-8 rounded-full ${avatarColors[i % avatarColors.length]} flex items-center justify-center text-white text-xs font-bold`}>
                    {getInitials(emp.firstName, emp.lastName)}
                  </div>
                  <span className="text-sm font-medium text-slate-700">{emp.firstName} {emp.lastName}</span>
                </div>
              ))}
            </div>
          )
        }
        {vehicle && <p className="text-sm text-slate-500 mt-3">🚛 {vehicle.name} ({vehicle.plate})</p>}
      </Card>

      {/* Egg data */}
      {!isNettoyage && mission.eggData && (
        <Card className="p-4">
          <h2 className="font-semibold text-slate-900 mb-3">Données ramassage</h2>
          <div className="grid grid-cols-3 gap-3">
            {[
              ['Bâtiments', mission.eggData.buildings],
              ['Plateaux estimés', mission.eggData.estimatedQuantity],
              ['Plateaux réels', mission.eggData.realQuantity ?? '—'],
            ].map(([label, val]) => (
              <div key={label} className="text-center">
                <p className="text-xl font-bold text-slate-900 font-mono">{val}</p>
                <p className="text-xs text-slate-500 mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* ── Checklist (nettoyage) ────────────────────────────────────────── */}
      {isNettoyage && checklist.length > 0 && (
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-slate-900">Check-list protocole</h2>
            <span className="text-xs text-slate-400 font-mono">
              {checklist.filter((i) => i.done).length}/{checklist.length}
            </span>
          </div>
          {/* Progress bar */}
          <div className="h-1.5 bg-slate-100 rounded-full mb-3 overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-500"
              style={{ width: `${checklist.length ? (checklist.filter((i) => i.done).length / checklist.length) * 100 : 0}%` }}
            />
          </div>
          <div className="space-y-2">
            {checklist.map((item, i) => (
              <div key={i} className={`flex items-center gap-2 rounded-xl border transition-all ${item.done ? 'bg-green-50 border-green-200' : 'bg-white border-slate-100'}`}>
                <button
                  onClick={() => toggleChecklistItem(i)}
                  className="flex items-center gap-3 flex-1 p-3 text-left"
                >
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${item.done ? 'bg-green-500 border-green-500' : 'border-slate-300'}`}>
                    {item.done && <CheckCircle size={12} className="text-white" />}
                  </div>
                  <span className={`text-sm font-medium ${item.done ? 'line-through text-slate-400' : 'text-slate-700'}`}>
                    {item.label}
                  </span>
                </button>
                <button
                  onClick={() => removeChecklistItem(i)}
                  className="p-2 mr-1 text-slate-300 hover:text-red-400 transition-colors rounded-lg"
                  aria-label="Supprimer l'item"
                >
                  <X size={14} />
                </button>
              </div>
            ))}

            {/* Ajouter un item */}
            <div className="flex gap-2 pt-1">
              <input
                className={inputCls + ' flex-1'}
                value={newCheckItem}
                onChange={(e) => setNewCheckItem(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addChecklistItem()}
                placeholder="Ajouter un item…"
              />
              <button
                onClick={addChecklistItem}
                disabled={!newCheckItem.trim()}
                className="px-3 py-2 bg-primary text-white rounded-xl text-sm hover:bg-primary-light disabled:opacity-40 transition-colors"
              >
                <Plus size={16} />
              </button>
            </div>
          </div>
        </Card>
      )}

      {/* ── Photos (nettoyage) ───────────────────────────────────────────── */}
      {isNettoyage && (
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-slate-900">Photos ({photos.length}/8)</h2>
            <button
              onClick={() => photoInputRef.current?.click()}
              disabled={uploadingPhoto || photos.length >= 8}
              className="flex items-center gap-1.5 px-3 py-2 bg-primary text-white rounded-xl text-xs font-semibold hover:bg-primary-light transition-colors disabled:opacity-40"
            >
              <Camera size={15} />
              {uploadingPhoto ? 'Upload…' : 'Ajouter'}
            </button>
            <input
              ref={photoInputRef}
              type="file"
              accept="image/*"
              multiple
              capture="environment"
              className="hidden"
              onChange={handlePhotoUpload}
              aria-label="Ajouter des photos"
            />
          </div>

          {photos.length === 0 ? (
            <button
              onClick={() => photoInputRef.current?.click()}
              className="w-full border-2 border-dashed border-slate-200 rounded-2xl py-8 flex flex-col items-center gap-2 text-slate-400 hover:border-primary/30 hover:text-primary transition-colors"
            >
              <Image size={28} strokeWidth={1.5} />
              <span className="text-sm">Ajouter des photos avant/après</span>
            </button>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {photos.map((photo) => (
                <div key={photo.id} className="relative aspect-square rounded-xl overflow-hidden group border border-slate-100">
                  <img src={photo.src} alt="Photo mission" className="w-full h-full object-cover" />
                  <button
                    onClick={() => removePhoto(photo.id)}
                    className="absolute top-1 right-1 p-1 bg-black/60 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label="Supprimer la photo"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Existing report */}
      {mission.report && (
        <Card className="p-4">
          <h2 className="font-semibold text-slate-900 mb-3">Compte-rendu</h2>
          <Row label="Durée réelle" value={`${mission.report.realDuration}h`} />
          {mission.report.notes && <Row label="Notes" value={mission.report.notes} />}
          {mission.report.signature && (
            <div className="mt-3">
              <p className="text-xs text-slate-400 mb-1">Signature employé</p>
              <img src={mission.report.signature} alt="Signature" className="max-h-20 border border-slate-100 rounded-xl bg-white p-2" />
            </div>
          )}
          {mission.report.incidents?.length > 0 && (
            <div className="mt-3 space-y-2">
              <p className="text-xs text-slate-400">Incidents</p>
              {mission.report.incidents.map((inc, i) => (
                <div key={i} className={`flex items-start gap-2 p-2.5 rounded-xl ${
                  inc.severity === 'urgent' ? 'bg-red-50' : inc.severity === 'attention' ? 'bg-amber-50' : 'bg-slate-50'
                }`}>
                  <AlertTriangle size={14} className={
                    inc.severity === 'urgent' ? 'text-red-500 shrink-0' : inc.severity === 'attention' ? 'text-amber-500 shrink-0' : 'text-slate-400 shrink-0'
                  } />
                  <span className="text-sm text-slate-700">{inc.text}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Lien vers facture si existante */}
      {linkedInvoice && (
        <button
          onClick={() => navigate(`/invoicing/${linkedInvoice.id}`)}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-green-50 border border-green-200 text-green-700 text-sm font-semibold hover:bg-green-100 transition-colors"
        >
          <FileText size={16} /> Voir la facture {linkedInvoice.number}
        </button>
      )}

      {/* Action buttons */}
      <div className="flex gap-3">
        {canReport && (
          <button onClick={() => {
            setReport(mission.report ?? { realDuration: mission.duration ?? 0, notes: '', incidents: [], consumables: [] })
            setShowReport(true)
          }} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-slate-100 text-slate-700 text-sm font-semibold hover:bg-slate-200 transition-colors">
            <CheckCircle size={16} />
            {mission.report ? 'Modifier le compte-rendu' : 'Compte-rendu'}
          </button>
        )}
        {canInvoice && (
          <button onClick={handleGenerateInvoice}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary-light transition-colors">
            <FileText size={16} /> Générer facture
          </button>
        )}
      </div>

      {/* Report modal */}
      <Modal open={showReport} onClose={() => setShowReport(false)} title="Compte-rendu de mission" size="md">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Durée réelle (h)</label>
            <input type="number" min="0" step="0.5" className={inputCls}
              value={report.realDuration}
              onChange={(e) => setReport((r) => ({ ...r, realDuration: Number(e.target.value) }))} />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Notes d'intervention</label>
            <textarea rows={3} className={inputCls} value={report.notes}
              onChange={(e) => setReport((r) => ({ ...r, notes: e.target.value }))} />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-2">Signaler un incident</label>
            <div className="flex gap-2">
              <input className={`${inputCls} flex-1 min-w-0`} value={newIncident.text}
                onChange={(e) => setNewIncident((n) => ({ ...n, text: e.target.value }))}
                placeholder="Description…" />
              <select className="px-3 py-2 rounded-xl border border-slate-200 text-sm bg-white shrink-0"
                value={newIncident.severity}
                onChange={(e) => setNewIncident((n) => ({ ...n, severity: e.target.value }))}>
                <option value="info">Info</option>
                <option value="attention">Attention</option>
                <option value="urgent">Urgent</option>
              </select>
              <button type="button" onClick={() => {
                if (!newIncident.text.trim()) return
                setReport((r) => ({ ...r, incidents: [...(r.incidents ?? []), { ...newIncident }] }))
                setNewIncident({ text: '', severity: 'info' })
              }} className="px-3 py-2 bg-primary text-white rounded-xl text-sm shrink-0">+</button>
            </div>
            {report.incidents?.map((inc, i) => (
              <div key={i} className="flex items-center justify-between mt-2 p-2.5 bg-slate-50 rounded-xl">
                <span className="text-sm text-slate-700 truncate">{inc.text}</span>
                <div className="flex items-center gap-2 shrink-0 ml-2">
                  <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                    inc.severity === 'urgent' ? 'bg-red-100 text-red-700'
                    : inc.severity === 'attention' ? 'bg-amber-100 text-amber-700'
                    : 'bg-slate-100 text-slate-600'
                  }`}>{inc.severity}</span>
                  <button onClick={() => setReport((r) => ({ ...r, incidents: r.incidents.filter((_, j) => j !== i) }))}
                    className="text-slate-300 hover:text-red-400" aria-label="Supprimer l'incident">
                    <X size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
          <button onClick={handleCloseReport}
            className="w-full py-3 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary-light transition-colors">
            Clôturer la mission
          </button>
        </div>
      </Modal>

      {/* Invoice modal */}
      <Modal open={invoiceModal} onClose={() => setInvoiceModal(false)} title="Générer une facture">
        <div className="space-y-4">
          {invoiceLines.map((line, i) => (
            <div key={i} className="p-3 bg-slate-50 rounded-xl space-y-2">
              <input className={inputCls} value={line.description} onChange={(e) => {
                const lines = [...invoiceLines]; lines[i] = { ...lines[i], description: e.target.value }; setInvoiceLines(lines)
              }} />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-slate-400">Quantité</label>
                  <input type="number" className={inputCls} value={line.quantity} onChange={(e) => {
                    const lines = [...invoiceLines]; lines[i] = { ...lines[i], quantity: Number(e.target.value), total: Number(e.target.value) * lines[i].unitPrice }; setInvoiceLines(lines)
                  }} />
                </div>
                <div>
                  <label className="text-xs text-slate-400">Prix unitaire HT (€)</label>
                  <input type="number" className={inputCls} value={line.unitPrice} onChange={(e) => {
                    const lines = [...invoiceLines]; lines[i] = { ...lines[i], unitPrice: Number(e.target.value), total: Number(e.target.value) * lines[i].quantity }; setInvoiceLines(lines)
                  }} />
                </div>
              </div>
              <p className="text-sm font-semibold text-slate-900 text-right">Total HT : {line.total.toFixed(2)} €</p>
            </div>
          ))}
          <button onClick={handleCreateInvoice}
            className="w-full py-3 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary-light transition-colors">
            Créer la facture
          </button>
        </div>
      </Modal>
    </div>
  )
}

function Row({ label, value }) {
  return (
    <div className="mb-2">
      <p className="text-xs text-slate-400">{label}</p>
      <p className="text-sm text-slate-800">{value}</p>
    </div>
  )
}
