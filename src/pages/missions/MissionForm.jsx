import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, ChevronRight, ChevronLeft, MapPin, Check, Car } from 'lucide-react'
import { format } from 'date-fns'
import { useMissionStore } from '../../store/useMissionStore'
import { useClientStore } from '../../store/useClientStore'
import { useEmployeeStore } from '../../store/useEmployeeStore'
import { useVehicleStore } from '../../store/useVehicleStore'
import { useSettingsStore } from '../../store/useSettingsStore'
import { getInitials } from '../../utils/formatters'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatClientAddress(client) {
  if (!client?.address) return ''
  const { street, zip, city } = client.address
  return [street, [zip, city].filter(Boolean).join(' ')].filter(Boolean).join(', ')
}

function timeToMinutes(time) {
  const [h, m] = (time ?? '').split(':').map(Number)
  return h * 60 + m
}

function minutesToTime(minutes) {
  const h = Math.floor((minutes % (24 * 60)) / 60)
  const m = minutes % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

// ─── Default form state ────────────────────────────────────────────────────

const defaultForm = () => ({
  type: 'ramassage',
  clientId: '',
  siteAddress: '',
  date: format(new Date(), 'yyyy-MM-dd'),
  startTime: '08:00',
  endTime: '10:00',
  duration: 2,
  recurrence: 'aucune',
  travel: { distanceKm: '', durationMin: '', billable: true },
  teamIds: [],
  vehicleId: '',
  instructions: '',
  eggData: { buildings: 1, estimatedQuantity: 0, realQuantity: null },
  cleaningData: {
    surface: 0,
    products: [],
    checklist: [
      { label: 'Pré-rinçage', done: false },
      { label: 'Application produit', done: false },
      { label: 'Rinçage final', done: false },
    ],
    photos: [],
  },
  status: 'planifie',
})

const STEPS = ['Infos générales', 'Équipe & matériel', 'Détails spécifiques']

const EMP_COLORS = [
  'bg-[#1a4731]', 'bg-[#d97706]', 'bg-blue-500', 'bg-purple-500',
  'bg-teal-500', 'bg-pink-500', 'bg-rose-500', 'bg-cyan-600',
]

// ─── Component ────────────────────────────────────────────────────────────────

export default function MissionForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const add    = useMissionStore((s) => s.add)
  const update = useMissionStore((s) => s.update)
  const getById = useMissionStore((s) => s.getById)
  const clients        = useClientStore((s) => s.clients)
  const getClient      = useClientStore((s) => s.getById)
  const employees      = useEmployeeStore((s) => s.employees)
  const vehicles       = useVehicleStore((s) => s.vehicles)
  const travelSettings = useSettingsStore((s) => s.settings.travelSettings)

  const [step, setStep]   = useState(0)
  const [form, setForm]   = useState(defaultForm())
  const [saving, setSaving] = useState(false)
  const [newProduct, setNewProduct] = useState('')
  const [newCheckItem, setNewCheckItem] = useState('')

  // Load existing mission on edit
  useEffect(() => {
    if (!id) return
    const mission = getById(Number(id))
    if (!mission) return
    const d = new Date(mission.date)
    const startTime = format(d, 'HH:mm')
    const endMin    = timeToMinutes(startTime) + (mission.duration ?? 2) * 60
    setForm({
      ...defaultForm(),
      ...mission,
      date:      format(d, 'yyyy-MM-dd'),
      startTime,
      endTime:   minutesToTime(endMin),
      duration:  mission.duration ?? 2,
      travel:    mission.travel ?? { distanceKm: '', durationMin: '', billable: true },
    })
  }, [id])

  // ── Setters ──────────────────────────────────────────────────────────────

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }))
  const setTravel = (key, val) => setForm((f) => ({ ...f, travel: { ...f.travel, [key]: val } }))
  const setEgg   = (key, val) => setForm((f) => ({ ...f, eggData:      { ...f.eggData,      [key]: val } }))
  const setClean = (key, val) => setForm((f) => ({ ...f, cleaningData: { ...f.cleaningData, [key]: val } }))

  // ── Client change → auto-fill address ───────────────────────────────────

  const handleClientChange = (clientId) => {
    set('clientId', clientId)
    if (!clientId) return
    const client = clients.find((c) => c.id === Number(clientId))
    const addr   = formatClientAddress(client)
    // Auto-fill only if field is empty OR still matches previous client
    setForm((f) => ({
      ...f,
      clientId,
      siteAddress: f.siteAddress === '' || !f.clientId ? addr : f.siteAddress,
    }))
  }

  const fillClientAddress = () => {
    const client = clients.find((c) => c.id === Number(form.clientId))
    set('siteAddress', formatClientAddress(client))
  }

  // ── Time / duration sync ─────────────────────────────────────────────────

  const handleStartTimeChange = (startTime) => {
    setForm((f) => {
      const endMin  = timeToMinutes(startTime) + f.duration * 60
      return { ...f, startTime, endTime: minutesToTime(endMin) }
    })
  }

  const handleEndTimeChange = (endTime) => {
    setForm((f) => {
      let dur = f.duration
      if (endTime && f.startTime) {
        const diff = timeToMinutes(endTime) - timeToMinutes(f.startTime)
        if (diff > 0) dur = Math.round(diff / 30) * 0.5 // snap to 0.5h
      }
      return { ...f, endTime, duration: dur > 0 ? dur : f.duration }
    })
  }

  const handleDurationChange = (duration) => {
    setForm((f) => {
      const endMin = timeToMinutes(f.startTime) + Number(duration) * 60
      return { ...f, duration: Number(duration), endTime: minutesToTime(endMin) }
    })
  }

  // ── Team toggle ──────────────────────────────────────────────────────────

  const toggleEmployee = (empId) =>
    set('teamIds', form.teamIds.includes(empId)
      ? form.teamIds.filter((x) => x !== empId)
      : [...form.teamIds, empId])

  // ── Submit ───────────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    setSaving(true)
    try {
      const isoDate = `${form.date}T${form.startTime}:00`
      const data = {
        ...form,
        date:     isoDate,
        clientId: Number(form.clientId),
        vehicleId: form.vehicleId ? Number(form.vehicleId) : null,
      }
      // Remove UI-only split fields before storing
      delete data.startTime
      delete data.endTime

      if (id) {
        await update(Number(id), data)
        navigate(`/missions/${id}`)
      } else {
        const newId = await add(data)
        navigate(`/missions/${newId}`)
      }
    } finally {
      setSaving(false)
    }
  }

  // ── Computed ──────────────────────────────────────────────────────────────

  const selectedClient = clients.find((c) => c.id === Number(form.clientId))
  const clientAddr     = formatClientAddress(selectedClient)
  const addressMatchesClient = form.siteAddress === clientAddr
  const isNettoyage = form.type !== 'ramassage'

  const inputCls = 'w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors'
  const labelCls = 'block text-xs font-semibold text-slate-600 mb-1.5'

  // Stepper click: allow going back
  const goToStep = (i) => { if (i < step || (i === step + 1 && canAdvance)) setStep(i) }
  const canAdvance = step === 0 ? !!form.clientId : true

  return (
    <div className="max-w-lg space-y-6">

      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-xl hover:bg-slate-100 transition-colors" aria-label="Retour">
          <ArrowLeft size={20} className="text-slate-600" />
        </button>
        <h1 className="text-xl font-bold text-slate-900">{id ? 'Modifier la mission' : 'Nouvelle mission'}</h1>
      </div>

      {/* Stepper */}
      <div className="flex items-center">
        {STEPS.map((label, i) => (
          <div key={i} className="flex items-center flex-1">
            <button
              onClick={() => goToStep(i)}
              className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold transition-colors shrink-0 ${
                i === step   ? 'bg-primary text-white shadow-sm shadow-primary/30'
                : i < step   ? 'bg-primary/20 text-primary cursor-pointer hover:bg-primary/30'
                :              'bg-slate-100 text-slate-400'
              }`}
            >
              {i < step ? <Check size={14} /> : i + 1}
            </button>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 mx-1 transition-colors ${i < step ? 'bg-primary' : 'bg-slate-100'}`} />
            )}
          </div>
        ))}
      </div>
      <p className="text-sm font-semibold text-slate-700 -mt-2">{STEPS[step]}</p>

      {/* ── Step 1 : Infos générales ──────────────────────────────────────── */}
      {step === 0 && (
        <div className="space-y-4">

          <div>
            <label className={labelCls}>Type de mission *</label>
            <select required className={inputCls} value={form.type} onChange={(e) => set('type', e.target.value)}>
              <option value="ramassage">🥚 Ramassage d'œufs</option>
              <option value="nettoyage_agricole">🌿 Nettoyage agricole</option>
              <option value="nettoyage_industriel">🏭 Nettoyage industriel</option>
            </select>
          </div>

          <div>
            <label className={labelCls}>Client *</label>
            <select
              required
              className={inputCls}
              value={form.clientId}
              onChange={(e) => handleClientChange(e.target.value)}
            >
              <option value="">Sélectionner un client…</option>
              {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className={labelCls} style={{ marginBottom: 0 }}>Adresse du site d'intervention</label>
              {selectedClient && clientAddr && !addressMatchesClient && (
                <button
                  type="button"
                  onClick={fillClientAddress}
                  className="flex items-center gap-1 text-xs text-primary hover:underline font-medium"
                >
                  <MapPin size={11} /> Utiliser l'adresse du client
                </button>
              )}
            </div>
            <input
              className={inputCls}
              value={form.siteAddress}
              onChange={(e) => set('siteAddress', e.target.value)}
              placeholder={selectedClient ? (clientAddr || "Adresse d'intervention") : "Sélectionner un client d'abord…"}
            />
            {addressMatchesClient && clientAddr && (
              <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                <MapPin size={10} /> Pré-remplie depuis la fiche client
              </p>
            )}
          </div>

          {/* Date + heure */}
          <div>
            <label className={labelCls}>Date *</label>
            <input
              type="date"
              required
              className={inputCls}
              value={form.date}
              onChange={(e) => set('date', e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Heure de début *</label>
              <input
                type="time"
                required
                className={inputCls}
                value={form.startTime}
                onChange={(e) => handleStartTimeChange(e.target.value)}
              />
            </div>
            <div>
              <label className={labelCls}>
                Heure de fin
                <span className="text-slate-400 font-normal ml-1">(optionnel)</span>
              </label>
              <input
                type="time"
                className={inputCls}
                value={form.endTime}
                onChange={(e) => handleEndTimeChange(e.target.value)}
              />
            </div>
          </div>

          {/* Duration display + manual override */}
          <div>
            <label className={labelCls}>
              Durée estimée (h)
              {form.endTime && form.startTime && timeToMinutes(form.endTime) > timeToMinutes(form.startTime) && (
                <span className="ml-2 text-primary font-semibold">
                  → {form.duration}h calculées automatiquement
                </span>
              )}
            </label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="0.5"
                max="12"
                step="0.5"
                className="flex-1 accent-primary"
                value={form.duration}
                onChange={(e) => handleDurationChange(e.target.value)}
              />
              <div className="w-16 px-3 py-2 rounded-xl border border-slate-200 text-sm font-bold text-slate-900 text-center bg-white">
                {form.duration}h
              </div>
            </div>
            {form.startTime && form.duration > 0 && (
              <p className="text-xs text-slate-400 mt-1">
                {form.startTime} → {minutesToTime(timeToMinutes(form.startTime) + form.duration * 60)}
              </p>
            )}
          </div>

          {/* Travel section */}
          {travelSettings?.mode && travelSettings.mode !== 'none' && (
            <div className="p-4 bg-slate-50 rounded-2xl space-y-3 border border-slate-100">
              <div className="flex items-center gap-2">
                <Car size={16} className="text-slate-400" />
                <p className="text-sm font-semibold text-slate-700">Déplacement</p>
                <span className="ml-auto text-xs text-slate-400">
                  {{ km: 'Facturation au km', duration: 'Facturation à la durée', flat: 'Forfait fixe' }[travelSettings.mode]}
                </span>
              </div>

              {travelSettings.mode === 'km' && (() => {
                const km         = Number(form.travel.distanceKm) || 0
                const freeKm     = travelSettings.freeKm ?? 0
                const billableKm = Math.max(0, km - freeKm) * 2   // aller-retour
                const total      = billableKm * (travelSettings.ratePerKm ?? 0.68)
                return (
                  <div>
                    <label className={labelCls}>
                      Distance aller simple (km)
                      <span className="text-slate-400 font-normal ml-1">— facturée aller-retour (× 2)</span>
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number" min="0" step="1"
                        className={inputCls}
                        value={form.travel.distanceKm}
                        onChange={(e) => setTravel('distanceKm', e.target.value)}
                        placeholder="Ex : 35"
                      />
                      {km > 0 && (
                        <span className="text-xs text-primary font-semibold shrink-0 bg-primary/10 px-2 py-1 rounded-lg whitespace-nowrap">
                          {billableKm} km · {total.toFixed(2)} € HT
                        </span>
                      )}
                    </div>
                    {km > 0 && (
                      <p className="text-xs text-slate-400 mt-1">
                        {km} km aller × 2 = {km * 2} km A/R
                        {freeKm > 0 ? ` — ${freeKm} km offerts = ${billableKm} km facturés` : ''}
                        {' '}× {travelSettings.ratePerKm ?? 0.68} €/km
                      </p>
                    )}
                  </div>
                )
              })()}

              {travelSettings.mode === 'duration' && (() => {
                const minAller = Number(form.travel.durationMin) || 0
                const minAR    = minAller * 2
                const total    = (minAR / 60) * (travelSettings.ratePerHour ?? 45)
                return (
                  <div>
                    <label className={labelCls}>
                      Durée trajet aller (minutes)
                      <span className="text-slate-400 font-normal ml-1">— facturée aller-retour (× 2)</span>
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number" min="0" step="5"
                        className={inputCls}
                        value={form.travel.durationMin}
                        onChange={(e) => setTravel('durationMin', e.target.value)}
                        placeholder="Ex : 45"
                      />
                      {minAller > 0 && (
                        <span className="text-xs text-primary font-semibold shrink-0 bg-primary/10 px-2 py-1 rounded-lg whitespace-nowrap">
                          {minAR} min · {total.toFixed(2)} € HT
                        </span>
                      )}
                    </div>
                    {minAller > 0 && (
                      <p className="text-xs text-slate-400 mt-1">
                        {minAller} min aller × 2 = {minAR} min A/R × {travelSettings.ratePerHour ?? 45} €/h
                      </p>
                    )}
                  </div>
                )
              })()}

              {travelSettings.mode === 'flat' && (
                <p className="text-sm text-slate-600">
                  Forfait déplacement : <strong>{travelSettings.flatFee ?? 35} € HT</strong> — sera ajouté à la facture
                </p>
              )}

              <label className="flex items-center gap-2.5 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  className="accent-primary w-4 h-4"
                  checked={form.travel.billable}
                  onChange={(e) => setTravel('billable', e.target.checked)}
                />
                <span className="text-sm text-slate-700">Facturer ce déplacement au client</span>
              </label>
            </div>
          )}

          <div>
            <label className={labelCls}>Récurrence</label>
            <select className={inputCls} value={form.recurrence} onChange={(e) => set('recurrence', e.target.value)}>
              <option value="aucune">Aucune</option>
              <option value="journaliere">Journalière</option>
              <option value="hebdomadaire">Hebdomadaire</option>
              <option value="bimensuelle">Bimensuelle (toutes les 2 semaines)</option>
              <option value="mensuelle">Mensuelle</option>
            </select>
          </div>
        </div>
      )}

      {/* ── Step 2 : Équipe & matériel ────────────────────────────────────── */}
      {step === 1 && (
        <div className="space-y-4">
          <div>
            <label className={labelCls}>Équipe assignée</label>
            <div className="space-y-2">
              {employees.filter((e) => e.status === 'actif').map((emp, i) => {
                const selected = form.teamIds.includes(emp.id)
                return (
                  <button
                    key={emp.id}
                    type="button"
                    onClick={() => toggleEmployee(emp.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${
                      selected ? 'border-primary bg-primary/5' : 'border-slate-100 bg-white hover:border-slate-200'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-full ${EMP_COLORS[i % EMP_COLORS.length]} flex items-center justify-center text-white text-sm font-bold shrink-0`}>
                      {getInitials(emp.firstName, emp.lastName)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate">{emp.firstName} {emp.lastName}</p>
                      <p className="text-xs text-slate-400 capitalize">{emp.role}</p>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                      selected ? 'bg-primary border-primary' : 'border-slate-300'
                    }`}>
                      {selected && <Check size={12} className="text-white" />}
                    </div>
                  </button>
                )
              })}
              {employees.filter((e) => e.status === 'actif').length === 0 && (
                <p className="text-sm text-slate-400 text-center py-4">Aucun employé actif disponible</p>
              )}
            </div>
            {form.teamIds.length > 0 && (
              <p className="text-xs text-primary mt-2 font-medium">
                ✓ {form.teamIds.length} employé{form.teamIds.length > 1 ? 's' : ''} assigné{form.teamIds.length > 1 ? 's' : ''}
              </p>
            )}
          </div>

          <div>
            <label className={labelCls}>Véhicule</label>
            <select className={inputCls} value={form.vehicleId} onChange={(e) => set('vehicleId', e.target.value)}>
              <option value="">Aucun véhicule</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>{v.name} — {v.plate}</option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelCls}>Instructions pour l'équipe</label>
            <textarea
              rows={4}
              className={inputCls}
              value={form.instructions}
              onChange={(e) => set('instructions', e.target.value)}
              placeholder="EPI obligatoire, accès badge, contact sur place…"
            />
          </div>
        </div>
      )}

      {/* ── Step 3 : Détails spécifiques ─────────────────────────────────── */}
      {step === 2 && (
        <div className="space-y-4">
          {!isNettoyage ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Nombre de bâtiments</label>
                  <input type="number" min="1" className={inputCls} value={form.eggData.buildings}
                    onChange={(e) => setEgg('buildings', Number(e.target.value))} />
                </div>
                <div>
                  <label className={labelCls}>Quantité estimée (plateaux)</label>
                  <input type="number" min="0" className={inputCls} value={form.eggData.estimatedQuantity}
                    onChange={(e) => setEgg('estimatedQuantity', Number(e.target.value))} />
                </div>
              </div>
            </>
          ) : (
            <>
              <div>
                <label className={labelCls}>Surface estimée (m²)</label>
                <input type="number" min="0" className={inputCls} value={form.cleaningData.surface}
                  onChange={(e) => setClean('surface', Number(e.target.value))} />
              </div>

              <div>
                <label className={labelCls}>Produits prévus</label>
                <div className="flex gap-2">
                  <input
                    className={`${inputCls} flex-1`}
                    value={newProduct}
                    onChange={(e) => setNewProduct(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && newProduct.trim()) {
                        setClean('products', [...form.cleaningData.products, newProduct.trim()])
                        setNewProduct('')
                      }
                    }}
                    placeholder="Nom du produit…"
                  />
                  <button
                    type="button"
                    onClick={() => { if (newProduct.trim()) { setClean('products', [...form.cleaningData.products, newProduct.trim()]); setNewProduct('') } }}
                    className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary-light"
                  >+</button>
                </div>
                {form.cleaningData.products.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {form.cleaningData.products.map((p, i) => (
                      <span key={i} className="flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium">
                        {p}
                        <button
                          type="button"
                          onClick={() => setClean('products', form.cleaningData.products.filter((_, idx) => idx !== i))}
                          className="text-blue-300 hover:text-blue-600 ml-0.5"
                        >×</button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className={labelCls} style={{ marginBottom: 0 }}>Check-list protocole</label>
                  <button
                    type="button"
                    onClick={() => {
                      if (!newCheckItem.trim()) return
                      setClean('checklist', [...form.cleaningData.checklist, { label: newCheckItem.trim(), done: false }])
                      setNewCheckItem('')
                    }}
                    className="text-xs text-primary font-semibold hover:underline"
                  >
                    + Ajouter une étape
                  </button>
                </div>
                {newCheckItem !== undefined && (
                  <div className="flex gap-2 mb-3">
                    <input
                      className={`${inputCls} flex-1 text-xs py-2`}
                      value={newCheckItem}
                      onChange={(e) => setNewCheckItem(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && newCheckItem.trim()) {
                          setClean('checklist', [...form.cleaningData.checklist, { label: newCheckItem.trim(), done: false }])
                          setNewCheckItem('')
                        }
                      }}
                      placeholder="Nouvelle étape…"
                    />
                  </div>
                )}
                <div className="space-y-2">
                  {form.cleaningData.checklist.map((item, i) => (
                    <div key={i} className="flex items-center gap-3 p-2.5 bg-slate-50 rounded-xl">
                      <span className="w-5 h-5 flex items-center justify-center text-slate-300 text-xs shrink-0">{i + 1}</span>
                      <span className="flex-1 text-sm text-slate-700">{item.label}</span>
                      <button
                        type="button"
                        onClick={() => setClean('checklist', form.cleaningData.checklist.filter((_, idx) => idx !== i))}
                        className="text-slate-300 hover:text-red-400 shrink-0 transition-colors"
                        aria-label="Supprimer cette étape"
                      >×</button>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Navigation ────────────────────────────────────────────────────── */}
      <div className="flex gap-3 pt-2">
        {step > 0 && (
          <button
            type="button"
            onClick={() => setStep((s) => s - 1)}
            className="flex items-center gap-1 px-4 py-3 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <ChevronLeft size={16} /> Précédent
          </button>
        )}
        {step < STEPS.length - 1 ? (
          <button
            type="button"
            onClick={() => setStep((s) => s + 1)}
            disabled={!canAdvance}
            className="flex-1 flex items-center justify-center gap-1 py-3 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary-light transition-colors disabled:opacity-40"
          >
            Suivant <ChevronRight size={16} />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            className="flex-1 py-3 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary-light transition-colors disabled:opacity-40"
          >
            {saving ? 'Enregistrement…' : id ? 'Modifier la mission' : 'Créer la mission'}
          </button>
        )}
      </div>
    </div>
  )
}
