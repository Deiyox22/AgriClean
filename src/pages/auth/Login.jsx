import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Leaf, Eye, EyeOff, ArrowLeft } from 'lucide-react'
import { useAuthStore } from '../../store/useAuthStore'

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
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
      if (result.ok) {
        navigate('/dashboard')
      } else {
        setError(result.error)
      }
    } finally {
      setLoading(false)
    }
  }

  const inputCls = 'w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors'

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 font-sans flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="p-3 bg-primary rounded-2xl mb-3 shadow-lg">
            <Leaf size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-black text-slate-900">AgriClean</h1>
          <p className="text-slate-500 text-sm mt-1">Espace manager</p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <h2 className="text-lg font-bold text-slate-900 mb-5">Connexion</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Email</label>
              <input
                type="email"
                required
                autoComplete="email"
                className={inputCls}
                value={form.email}
                onChange={(e) => set('email', e.target.value)}
                placeholder="admin@agriclean.fr"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Mot de passe</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  className={`${inputCls} pr-11`}
                  value={form.password}
                  onChange={(e) => set('password', e.target.value)}
                  placeholder="••••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
                  aria-label={showPw ? 'Masquer' : 'Afficher'}
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-primary text-white font-semibold rounded-xl hover:bg-primary-light transition-colors disabled:opacity-50 mt-2"
            >
              {loading ? 'Connexion…' : 'Se connecter'}
            </button>
          </form>

          <p className="text-center text-xs text-slate-400 mt-4">
            Identifiants par défaut :<br />
            <span className="font-mono text-slate-500">admin@agriclean.fr</span> / <span className="font-mono text-slate-500">agriclean2025</span>
          </p>
        </div>

        <Link to="/" className="flex items-center justify-center gap-1.5 mt-6 text-sm text-slate-500 hover:text-slate-700 transition-colors">
          <ArrowLeft size={15} /> Retour au site
        </Link>
      </div>
    </div>
  )
}
