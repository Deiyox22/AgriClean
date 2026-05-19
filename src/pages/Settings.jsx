import { useState, useEffect } from 'react'
import { useSettingsStore } from '../store/useSettingsStore'
import { useEmployeeStore } from '../store/useEmployeeStore'
import { useMissionStore } from '../store/useMissionStore'
import { useInvoiceStore } from '../store/useInvoiceStore'
import { useClientStore } from '../store/useClientStore'
import { supabase, fromDb } from '../lib/supabase'
import { resetAndSeed } from '../db/db'
import { useVehicleStore } from '../store/useVehicleStore'
import Card from '../components/ui/Card'
import { Eye, EyeOff, FileDown, BarChart3, Upload, X } from 'lucide-react'
import { generateMonthlyReport, exportHoursCSV } from '../utils/reports'

export default function Settings() {
  const settings  = useSettingsStore((s) => s.settings)
  const save      = useSettingsStore((s) => s.save)
  const load      = useSettingsStore((s) => s.load)
  const employees = useEmployeeStore((s) => s.employees)
  const missions  = useMissionStore((s) => s.missions)
  const invoices  = useInvoiceStore((s) => s.invoices)
  const clients   = useClientStore((s) => s.clients)
  const vehicles  = useVehicleStore((s) => s.vehicles)
  const equipment = useVehicleStore((s) => s.equipment)
  const [form, setForm] = useState(settings)
  const [saved, setSaved] = useState(false)
  const [showPw, setShowPw] = useState(false)

  useEffect(() => { setForm(settings) }, [settings])

  const setCompany = (key, val) => setForm((f) => ({ ...f, company: { ...f.company, [key]: val } }))
  const setRates = (key, val) => setForm((f) => ({ ...f, defaultRates: { ...f.defaultRates, [key]: val } }))

  const handleSave = async () => {
    await save(form)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleExport = async () => {
    const data = { clients, employees, missions, vehicles, equipment, invoices, settings }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `agriClean-backup-${new Date().toISOString().substring(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleReset = async () => {
    if (!confirm('Réinitialiser toutes les données avec les données de démonstration ? Cette action est irréversible.')) return
    await resetAndSeed()
    window.location.reload()
  }

  const inputCls = 'w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary'
  const labelCls = 'block text-xs font-medium text-slate-600 mb-1'

  return (
    <div className="space-y-6 max-w-xl">
      {/* Company */}
      <Card className="p-5">
        <h2 className="font-semibold text-slate-900 mb-4">Informations entreprise</h2>
        <div className="space-y-3">
          {/* Logo */}
          <div>
            <label className={labelCls}>Logo entreprise (affiché sur les PDFs)</label>
            <div className="flex items-center gap-3">
              {form.company?.logo && (
                <img src={form.company.logo} alt="Logo" className="h-12 max-w-[120px] object-contain border border-slate-200 rounded-xl p-1.5 bg-white" />
              )}
              <label className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 text-sm text-slate-600 cursor-pointer hover:bg-slate-50 transition-colors">
                <Upload size={14} />
                {form.company?.logo ? 'Changer' : 'Importer'}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files[0]
                    if (!file) return
                    const reader = new FileReader()
                    reader.onload = (ev) => setCompany('logo', ev.target.result)
                    reader.readAsDataURL(file)
                  }}
                />
              </label>
              {form.company?.logo && (
                <button type="button" onClick={() => setCompany('logo', null)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                  <X size={15} />
                </button>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-1">PNG ou SVG recommandé — affiché en haut des factures et devis</p>
          </div>

          <div><label className={labelCls}>Nom de l'entreprise</label><input className={inputCls} value={form.company?.name ?? ''} onChange={(e) => setCompany('name', e.target.value)} /></div>
          <div><label className={labelCls}>SIRET</label><input className={inputCls} value={form.company?.siret ?? ''} onChange={(e) => setCompany('siret', e.target.value)} /></div>
          <div><label className={labelCls}>Adresse</label><input className={inputCls} value={form.company?.address ?? ''} onChange={(e) => setCompany('address', e.target.value)} /></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div><label className={labelCls}>Téléphone</label><input className={inputCls} value={form.company?.phone ?? ''} onChange={(e) => setCompany('phone', e.target.value)} /></div>
            <div><label className={labelCls}>Email</label><input type="email" className={inputCls} value={form.company?.email ?? ''} onChange={(e) => setCompany('email', e.target.value)} /></div>
          </div>
          <div><label className={labelCls}>RIB / IBAN</label><input className={inputCls} value={form.company?.rib ?? ''} onChange={(e) => setCompany('rib', e.target.value)} /></div>
        </div>
      </Card>

      {/* Rates */}
      <Card className="p-5">
        <div className="flex items-start justify-between mb-1">
          <h2 className="font-semibold text-slate-900">Tarifs horaires par défaut</h2>
          <span className="text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded-lg">HT · TVA {form.defaultRates?.tvaDefault ?? 20}%</span>
        </div>
        <p className="text-xs text-slate-400 mb-4">Utilisés pour pré-remplir les devis et factures générés automatiquement.</p>
        <div className="space-y-3">
          <div>
            <label className={labelCls}>🥚 Ramassage d'œufs (€/h HT)</label>
            <div className="flex items-center gap-3">
              <input type="number" step="1" min="0" className={inputCls} value={form.defaultRates?.ramassage ?? 68} onChange={(e) => setRates('ramassage', Number(e.target.value))} />
              <span className="text-xs text-slate-400 shrink-0 w-24 text-right">TTC : {((form.defaultRates?.ramassage ?? 68) * (1 + (form.defaultRates?.tvaDefault ?? 20) / 100)).toFixed(0)} €/h</span>
            </div>
          </div>
          <div>
            <label className={labelCls}>🌿 Nettoyage agricole (€/h HT)</label>
            <div className="flex items-center gap-3">
              <input type="number" step="1" min="0" className={inputCls} value={form.defaultRates?.nettoyage_agricole ?? 78} onChange={(e) => setRates('nettoyage_agricole', Number(e.target.value))} />
              <span className="text-xs text-slate-400 shrink-0 w-24 text-right">TTC : {((form.defaultRates?.nettoyage_agricole ?? 78) * (1 + (form.defaultRates?.tvaDefault ?? 20) / 100)).toFixed(0)} €/h</span>
            </div>
          </div>
          <div>
            <label className={labelCls}>🏭 Nettoyage industriel (€/h HT)</label>
            <div className="flex items-center gap-3">
              <input type="number" step="1" min="0" className={inputCls} value={form.defaultRates?.nettoyage_industriel ?? 98} onChange={(e) => setRates('nettoyage_industriel', Number(e.target.value))} />
              <span className="text-xs text-slate-400 shrink-0 w-24 text-right">TTC : {((form.defaultRates?.nettoyage_industriel ?? 98) * (1 + (form.defaultRates?.tvaDefault ?? 20) / 100)).toFixed(0)} €/h</span>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-slate-100">
            <div>
              <label className={labelCls}>Prix/m² agricole (€ HT)</label>
              <input type="number" step="0.5" min="0" className={inputCls} value={form.defaultRates?.prixM2Agricole ?? 4.5} onChange={(e) => setRates('prixM2Agricole', Number(e.target.value))} />
            </div>
            <div>
              <label className={labelCls}>Prix/m² industriel (€ HT)</label>
              <input type="number" step="0.5" min="0" className={inputCls} value={form.defaultRates?.prixM2Industriel ?? 7} onChange={(e) => setRates('prixM2Industriel', Number(e.target.value))} />
            </div>
          </div>
          <div className="pt-1 border-t border-slate-100">
            <label className={labelCls}>Taux de TVA par défaut (%)</label>
            <select className={inputCls} value={form.defaultRates?.tvaDefault ?? 20} onChange={(e) => setRates('tvaDefault', Number(e.target.value))}>
              <option value={0}>0 % — Franchise en base de TVA (CA &lt; 36 800 €)</option>
              <option value={10}>10 % — Services agricoles (ETA)</option>
              <option value={20}>20 % — Taux normal</option>
            </select>
            <p className="text-xs text-slate-400 mt-1">
              En dessous de 36 800 € de CA annuel → franchise de TVA possible (0%). Au-delà → 20% général ou 10% si enregistré comme ETA.
            </p>
          </div>
        </div>
      </Card>

      {/* Travel */}
      <Card className="p-5">
        <h2 className="font-semibold text-slate-900 mb-1">Frais de déplacement</h2>
        <p className="text-xs text-slate-400 mb-4">Configurez comment les trajets sont calculés et facturés au client.</p>
        <div className="space-y-4">
          <div>
            <label className={labelCls}>Mode de facturation du trajet</label>
            <select className={inputCls}
              value={form.travelSettings?.mode ?? 'km'}
              onChange={(e) => setForm((f) => ({ ...f, travelSettings: { ...(f.travelSettings ?? {}), mode: e.target.value } }))}>
              <option value="none">Non facturé (inclus dans le tarif horaire)</option>
              <option value="km">Au kilomètre (aller simple)</option>
              <option value="duration">À la durée de trajet</option>
              <option value="flat">Forfait déplacement fixe</option>
            </select>
          </div>

          {form.travelSettings?.mode === 'km' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 bg-slate-50 rounded-xl">
              <div>
                <label className={labelCls}>Tarif au km (€ HT)</label>
                <input type="number" step="0.01" min="0" className={inputCls}
                  value={form.travelSettings?.ratePerKm ?? 0.68}
                  onChange={(e) => setForm((f) => ({ ...f, travelSettings: { ...(f.travelSettings ?? {}), ratePerKm: Number(e.target.value) } }))} />
                <p className="text-xs text-slate-400 mt-1">Barème IK fiscal 2024 : 0,68 €/km</p>
              </div>
              <div>
                <label className={labelCls}>Kilomètres gratuits (rayon)</label>
                <input type="number" step="1" min="0" className={inputCls}
                  value={form.travelSettings?.freeKm ?? 0}
                  onChange={(e) => setForm((f) => ({ ...f, travelSettings: { ...(f.travelSettings ?? {}), freeKm: Number(e.target.value) } }))} />
                <p className="text-xs text-slate-400 mt-1">Ex : 20 km offerts, facturation au-delà</p>
              </div>
            </div>
          )}

          {form.travelSettings?.mode === 'duration' && (
            <div className="p-4 bg-slate-50 rounded-xl">
              <label className={labelCls}>Taux horaire trajet (€/h HT)</label>
              <input type="number" step="1" min="0" className={inputCls}
                value={form.travelSettings?.ratePerHour ?? 45}
                onChange={(e) => setForm((f) => ({ ...f, travelSettings: { ...(f.travelSettings ?? {}), ratePerHour: Number(e.target.value) } }))} />
              <p className="text-xs text-slate-400 mt-1">Généralement 50–60% du taux horaire de la prestation</p>
            </div>
          )}

          {form.travelSettings?.mode === 'flat' && (
            <div className="p-4 bg-slate-50 rounded-xl">
              <label className={labelCls}>Montant du forfait (€ HT)</label>
              <input type="number" step="1" min="0" className={inputCls}
                value={form.travelSettings?.flatFee ?? 35}
                onChange={(e) => setForm((f) => ({ ...f, travelSettings: { ...(f.travelSettings ?? {}), flatFee: Number(e.target.value) } }))} />
              <p className="text-xs text-slate-400 mt-1">Facturé une fois par intervention, quel que soit le trajet</p>
            </div>
          )}

          {form.travelSettings?.mode !== 'none' && (
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" className="accent-primary w-4 h-4"
                checked={form.travelSettings?.billableByDefault ?? true}
                onChange={(e) => setForm((f) => ({ ...f, travelSettings: { ...(f.travelSettings ?? {}), billableByDefault: e.target.checked } }))} />
              <div>
                <p className="text-sm font-medium text-slate-700">Facturer le déplacement au client par défaut</p>
                <p className="text-xs text-slate-400">Peut être désactivé mission par mission</p>
              </div>
            </label>
          )}
        </div>
      </Card>

      {/* Billing */}
      <Card className="p-5">
        <h2 className="font-semibold text-slate-900 mb-4">Facturation</h2>
        <div className="space-y-3">
          <div>
            <label className={labelCls}>Mentions légales</label>
            <textarea rows={4} className={inputCls} value={form.legalMentions ?? ''} onChange={(e) => setForm((f) => ({ ...f, legalMentions: e.target.value }))} />
          </div>
          <div>
            <label className={labelCls}>Préfixe numérotation factures</label>
            <input className={inputCls} value={form.invoicePrefix ?? 'FAC'} onChange={(e) => setForm((f) => ({ ...f, invoicePrefix: e.target.value }))} />
          </div>
        </div>
      </Card>

      <button onClick={handleSave} className={`w-full py-3 rounded-xl text-sm font-medium transition-colors ${saved ? 'bg-green-500 text-white' : 'bg-primary text-white hover:bg-primary-light'}`}>
        {saved ? '✓ Enregistré !' : 'Enregistrer les paramètres'}
      </button>

      {/* Credentials */}
      <Card className="p-5">
        <h2 className="font-semibold text-slate-900 mb-1">Connexion manager</h2>
        <p className="text-xs text-slate-400 mb-4">Identifiants utilisés pour accéder à l'application de gestion.</p>
        <div className="space-y-3">
          <div>
            <label className={labelCls}>Email de connexion</label>
            <input type="email" className={inputCls} value={form.adminEmail ?? ''} onChange={(e) => setForm((f) => ({ ...f, adminEmail: e.target.value }))} />
          </div>
          <div>
            <label className={labelCls}>Mot de passe</label>
            <div className="relative">
              <input type={showPw ? 'text' : 'password'} className={`${inputCls} pr-10`} value={form.adminPassword ?? ''} onChange={(e) => setForm((f) => ({ ...f, adminPassword: e.target.value }))} />
              <button type="button" onClick={() => setShowPw((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600" aria-label="Afficher/masquer">
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
        </div>
        <button onClick={handleSave} className="mt-4 w-full py-2.5 rounded-xl bg-slate-100 text-slate-700 text-sm font-medium hover:bg-slate-200 transition-colors">
          Mettre à jour les identifiants
        </button>
      </Card>

      {/* Reports */}
      <Card className="p-5">
        <h2 className="font-semibold text-slate-900 mb-1">Rapports & Exports</h2>
        <p className="text-xs text-slate-400 mb-4">Générez des rapports pour le mois en cours.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            onClick={() => generateMonthlyReport({ employees, missions, invoices, clients, settings })}
            className="flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary-light transition-colors"
          >
            <BarChart3 size={16} /> Rapport mensuel PDF
          </button>
          <button
            onClick={() => exportHoursCSV(employees, missions)}
            className="flex items-center justify-center gap-2 py-3 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <FileDown size={16} /> Export heures CSV
          </button>
        </div>
      </Card>

      {/* Apparence */}
      <Card className="p-5">
        <h2 className="font-semibold text-slate-900 dark:text-slate-100 mb-4">Apparence</h2>
        <label className="flex items-center justify-between cursor-pointer">
          <div>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Mode sombre</p>
            <p className="text-xs text-slate-400 mt-0.5">Réduit la fatigue visuelle en faible luminosité</p>
          </div>
          <button
            type="button"
            onClick={() => {
              const next = form.theme === 'dark' ? 'light' : 'dark'
              setForm((f) => ({ ...f, theme: next }))
              document.documentElement.classList.toggle('dark', next === 'dark')
              localStorage.setItem('agriclean-theme', next)
              save({ theme: next })
            }}
            className={`relative w-12 h-6 rounded-full transition-colors ${form.theme === 'dark' ? 'bg-primary' : 'bg-slate-200'}`}
            aria-label="Toggle dark mode"
          >
            <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.theme === 'dark' ? 'translate-x-6' : 'translate-x-0.5'}`} />
          </button>
        </label>
      </Card>

      {/* Data */}
      <Card className="p-5">
        <h2 className="font-semibold text-slate-900 mb-1">Données</h2>
        <p className="text-xs text-slate-400 mb-4">Sauvegarde et réinitialisation des données locales.</p>
        <div className="flex gap-3">
          <button onClick={handleExport} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">
            Exporter JSON
          </button>
          <button onClick={handleReset} className="flex-1 py-2.5 rounded-xl border border-red-200 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors">
            Réinitialiser la démo
          </button>
        </div>
      </Card>
    </div>
  )
}
