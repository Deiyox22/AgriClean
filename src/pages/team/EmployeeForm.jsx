import { useState } from 'react'

const LICENSE_OPTIONS = ['B', 'C', 'CE', 'CACES']
const DAYS = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche']

const inputCls = 'w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary'
const labelCls = 'block text-xs font-medium text-slate-600 mb-1'

export default function EmployeeForm({ initial, onSave, onClose }) {
  const [form, setForm] = useState(initial ?? {
    firstName: '', lastName: '', role: 'polyvalent',
    phone: '', email: '',
    licenses: [], availability: ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi'],
    status: 'actif', notes: '', pin: '',
  })

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }))
  const toggle = (key, val) => set(key, form[key].includes(val) ? form[key].filter((x) => x !== val) : [...form[key], val])

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSave(form) }} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Prénom *</label>
          <input required className={inputCls} value={form.firstName} onChange={(e) => set('firstName', e.target.value)} />
        </div>
        <div>
          <label className={labelCls}>Nom *</label>
          <input required className={inputCls} value={form.lastName} onChange={(e) => set('lastName', e.target.value)} />
        </div>
        <div>
          <label className={labelCls}>Rôle</label>
          <select className={inputCls} value={form.role} onChange={(e) => set('role', e.target.value)}>
            <option value="chauffeur">Chauffeur</option>
            <option value="nettoyage">Agent de nettoyage</option>
            <option value="polyvalent">Polyvalent</option>
          </select>
        </div>
        <div>
          <label className={labelCls}>Statut</label>
          <select className={inputCls} value={form.status} onChange={(e) => set('status', e.target.value)}>
            <option value="actif">Actif</option>
            <option value="conge">Congé</option>
            <option value="arret">Arrêt</option>
          </select>
        </div>
        <div>
          <label className={labelCls}>Téléphone</label>
          <input type="tel" className={inputCls} value={form.phone} onChange={(e) => set('phone', e.target.value)} />
        </div>
        <div>
          <label className={labelCls}>Email</label>
          <input type="email" className={inputCls} value={form.email} onChange={(e) => set('email', e.target.value)} />
        </div>
      </div>

      <div>
        <label className={labelCls}>Permis</label>
        <div className="flex gap-2 flex-wrap mt-1">
          {LICENSE_OPTIONS.map((l) => (
            <button key={l} type="button" onClick={() => toggle('licenses', l)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${form.licenses.includes(l) ? 'bg-primary text-white border-primary' : 'border-slate-200 text-slate-600 hover:border-primary/40'}`}>
              {l}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className={labelCls}>Jours travaillés</label>
        <div className="flex gap-2 flex-wrap mt-1">
          {DAYS.map((d) => (
            <button key={d} type="button" onClick={() => toggle('availability', d)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border capitalize transition-colors ${form.availability.includes(d) ? 'bg-primary text-white border-primary' : 'border-slate-200 text-slate-600'}`}>
              {d.slice(0, 3)}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className={labelCls}>Notes</label>
        <textarea rows={2} className={inputCls} value={form.notes} onChange={(e) => set('notes', e.target.value)} placeholder="Ex : Ne peut pas conduire le camion citerne" />
      </div>

      <div className="pt-3 border-t border-slate-100">
        <label className={labelCls}>
          Code PIN employé (4 chiffres)
          <span className="text-slate-400 font-normal ml-1">— permet à l'employé de se connecter à son espace</span>
        </label>
        <input
          type="text"
          inputMode="numeric"
          maxLength={4}
          pattern="[0-9]{4}"
          className={inputCls}
          value={form.pin ?? ''}
          onChange={(e) => set('pin', e.target.value.replace(/\D/g, '').slice(0, 4))}
          placeholder="Ex : 1234"
        />
        {form.pin && form.pin.length < 4 && (
          <p className="text-xs text-amber-500 mt-1">Le PIN doit contenir exactement 4 chiffres</p>
        )}
        {form.pin?.length === 4 && (
          <p className="text-xs text-green-600 mt-1">✓ PIN valide — l'employé pourra se connecter avec ce code</p>
        )}
      </div>

      <div className="flex gap-3 pt-1">
        <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50">
          Annuler
        </button>
        <button type="submit" className="flex-1 py-2.5 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary-light">
          Enregistrer
        </button>
      </div>
    </form>
  )
}
