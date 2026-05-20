import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Leaf, Eye, EyeOff, ArrowLeft, ShieldCheck, Users, Building2 } from 'lucide-react'
import { useAuthStore } from '../../store/useAuthStore'
import { supabase, fromDb } from '../../lib/supabase'

const inputCls = 'w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors'

// ── Manager login ─────────────────────────────────────────────────────────────
function ManagerForm() {
  const [form, setForm]     = useState({ email: '', password: '' })
  const [showPw, setShowPw] = useState(false)
  const [error, setError]   = useState('')
  const [loading, setLoading] = useState(false)
  const loginManager = useAuthStore((s) => s.loginManager)
  const navigate = useNavigate()
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const result = await loginManager(form.email, form.password)
      if (result.ok) navigate('/dashboard')
      else setError(result.error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs font-semibold text-slate-600 mb-1.5">Email</label>
        <input type="email" required autoComplete="email" className={inputCls}
          value={form.email} onChange={(e) => set('email', e.target.value)}
          placeholder="admin@agriclean.fr" />
      </div>
      <div>
        <label className="block text-xs font-semibold text-slate-600 mb-1.5">Mot de passe</label>
        <div className="relative">
          <input type={showPw ? 'text' : 'password'} required autoComplete="current-password"
            className={`${inputCls} pr-11`}
            value={form.password} onChange={(e) => set('password', e.target.value)}
            placeholder="••••••••••" />
          <button type="button" onClick={() => setShowPw((s) => !s)}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
            aria-label={showPw ? 'Masquer' : 'Afficher'}>
            {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
      </div>
      {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">{error}</div>}
      <button type="submit" disabled={loading}
        className="w-full py-3.5 bg-primary text-white font-semibold rounded-xl hover:bg-primary-light transition-colors disabled:opacity-50">
        {loading ? 'Connexion…' : 'Se connecter'}
      </button>
      <p className="text-center text-xs text-slate-400 pt-1">
        Par défaut : <span className="font-mono text-slate-500">admin@agriclean.fr</span> / <span className="font-mono text-slate-500">agriclean2025</span>
      </p>
    </form>
  )
}

// ── Employee login ────────────────────────────────────────────────────────────
function EmployeeForm() {
  const [employees, setEmployees] = useState([])
  const [form, setForm]     = useState({ employeeId: '', pin: '' })
  const [error, setError]   = useState('')
  const [loading, setLoading] = useState(false)
  const loginEmployee = useAuthStore((s) => s.loginEmployee)
  const navigate = useNavigate()

  useEffect(() => {
    supabase.from('employees').select('*').eq('status', 'actif')
      .then(({ data }) => setEmployees((data || []).filter(e => e.pin).map(fromDb)))
  }, [])

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const handlePin = (digit) => {
    if (form.pin.length >= 4) return
    const next = form.pin + digit
    setForm((f) => ({ ...f, pin: next }))
  }

  const handleBackspace = () => setForm((f) => ({ ...f, pin: f.pin.slice(0, -1) }))

  const handleSubmit = async () => {
    if (!form.employeeId) { setError('Sélectionnez votre nom.'); return }
    if (form.pin.length !== 4) { setError('Entrez votre code PIN à 4 chiffres.'); return }
    setError('')
    setLoading(true)
    try {
      const result = await loginEmployee(form.employeeId, form.pin)
      if (result.ok) navigate('/mon-espace')
      else { setError(result.error); setForm((f) => ({ ...f, pin: '' })) }
    } finally {
      setLoading(false)
    }
  }

  const digits = ['1','2','3','4','5','6','7','8','9','','0','⌫']

  return (
    <div className="space-y-5">
      <div>
        <label className="block text-xs font-semibold text-slate-600 mb-1.5">Votre nom</label>
        <select className={inputCls} value={form.employeeId} onChange={(e) => { set('employeeId', e.target.value); setError(''); setForm((f) => ({ ...f, employeeId: e.target.value, pin: '' })) }}>
          <option value="">Sélectionner votre nom…</option>
          {employees.map((e) => (
            <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>
          ))}
        </select>
        {employees.length === 0 && (
          <p className="text-xs text-amber-600 mt-1">Aucun employé avec un PIN défini. Le manager doit d'abord configurer votre code dans votre fiche.</p>
        )}
      </div>

      {form.employeeId && (
        <>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-3 text-center">Code PIN</label>
            {/* PIN dots */}
            <div className="flex items-center justify-center gap-4 mb-6">
              {[0,1,2,3].map((i) => (
                <div key={i} className={`w-4 h-4 rounded-full transition-all duration-150 ${
                  i < form.pin.length ? 'bg-primary scale-110' : 'bg-slate-200'
                }`} />
              ))}
            </div>
            {/* Numpad */}
            <div className="grid grid-cols-3 gap-3 max-w-[240px] mx-auto">
              {digits.map((d, i) => (
                d === '' ? <div key={i} /> :
                d === '⌫' ? (
                  <button key={i} type="button" onClick={handleBackspace}
                    className="h-14 rounded-2xl bg-slate-100 text-slate-500 text-xl font-bold hover:bg-slate-200 active:scale-95 transition-all flex items-center justify-center">
                    {d}
                  </button>
                ) : (
                  <button key={i} type="button" onClick={() => handlePin(d)}
                    disabled={form.pin.length >= 4}
                    className="h-14 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 text-xl font-bold hover:bg-slate-100 active:scale-95 active:bg-primary active:text-white transition-all disabled:opacity-30">
                    {d}
                  </button>
                )
              ))}
            </div>
          </div>

          {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl text-center">{error}</div>}

          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading || form.pin.length !== 4}
            className="w-full py-3.5 bg-primary text-white font-semibold rounded-xl hover:bg-primary-light transition-colors disabled:opacity-40"
          >
            {loading ? 'Connexion…' : 'Accéder à mon espace'}
          </button>
        </>
      )}
    </div>
  )
}

// ── Client Pro login ──────────────────────────────────────────────────────────
function ClientForm() {
  const [form, setForm]     = useState({ email: '', company: '' })
  const [error, setError]   = useState('')
  const [loading, setLoading] = useState(false)
  const loginClient = useAuthStore((s) => s.loginClient)
  const navigate = useNavigate()
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const result = await loginClient(form.email, form.company)
      if (result.ok) navigate('/espace-pro')
      else setError(result.error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs font-semibold text-slate-600 mb-1.5">Email de contact</label>
        <input required type="email" className={inputCls}
          value={form.email} onChange={(e) => set('email', e.target.value)}
          placeholder="contact@monentreprise.fr" />
      </div>
      <div>
        <label className="block text-xs font-semibold text-slate-600 mb-1.5">Nom de la société</label>
        <input required className={inputCls}
          value={form.company} onChange={(e) => set('company', e.target.value)}
          placeholder="EARL Dupont Avicole" />
      </div>
      {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">{error}</div>}
      <button type="submit" disabled={loading}
        className="w-full py-3.5 bg-amber-500 text-white font-semibold rounded-xl hover:bg-amber-400 transition-colors disabled:opacity-50">
        {loading ? 'Vérification…' : 'Accéder à mon espace'}
      </button>
      <p className="text-center text-xs text-slate-400 pt-1">
        L'email doit correspondre à un contact enregistré par AgriClean.
      </p>
    </form>
  )
}

// ── Main Login page ───────────────────────────────────────────────────────────
export default function Login() {
  const [tab, setTab] = useState('employee')

  const tabs = [
    { key: 'employee', label: 'Équipe',   icon: Users,       desc: 'Planning & missions' },
    { key: 'client',   label: 'Espace Pro', icon: Building2, desc: 'Factures & devis' },
    { key: 'manager',  label: 'Manager',  icon: ShieldCheck, desc: 'Gestion complète' },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 font-sans flex items-center justify-center p-4">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="p-3 bg-primary rounded-2xl mb-3 shadow-lg shadow-primary/20">
            <Leaf size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-black text-slate-900">AgriClean</h1>
          <p className="text-slate-400 text-sm mt-1">Bienvenue</p>
        </div>

        {/* Tab selector */}
        <div className="grid grid-cols-3 gap-2 mb-5">
          {tabs.map((t) => {
            const Icon = t.icon
            const active = tab === t.key
            const activeColor = t.key === 'client'
              ? 'border-amber-400 bg-amber-50 text-amber-600'
              : 'border-primary bg-primary/5 text-primary'
            return (
              <button key={t.key} onClick={() => setTab(t.key)}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl border-2 transition-all text-center ${
                  active ? activeColor : 'border-slate-100 bg-white text-slate-500 hover:border-slate-200'
                }`}>
                <Icon size={19} strokeWidth={active ? 2.5 : 1.8} />
                <span className="text-xs font-bold leading-tight">{t.label}</span>
                <span className="text-[10px] text-slate-400 leading-tight">{t.desc}</span>
              </button>
            )
          })}
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <h2 className="text-base font-bold text-slate-900 mb-5">
            {tab === 'manager' ? 'Connexion manager'
              : tab === 'client' ? 'Espace Professionnel'
              : 'Connexion équipe'}
          </h2>
          {tab === 'manager' ? <ManagerForm />
            : tab === 'client' ? <ClientForm />
            : <EmployeeForm />}
        </div>

        <Link to="/" className="flex items-center justify-center gap-1.5 mt-6 text-sm text-slate-400 hover:text-slate-600 transition-colors">
          <ArrowLeft size={14} /> Retour au site
        </Link>
      </div>
    </div>
  )
}
