import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Leaf, Menu, X, LogIn } from 'lucide-react'

const navLinks = [
  { to: '/#services', label: 'Nos services' },
  { to: '/candidats', label: 'Recrutement' },
  { to: '/espace-pro', label: 'Espace pro' },
]

function PublicNav() {
  const [open, setOpen] = useState(false)

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-slate-100 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="p-2 bg-primary rounded-xl">
            <Leaf size={18} className="text-white" />
          </div>
          <div>
            <span className="font-bold text-slate-900 text-base leading-tight block">AgriClean</span>
            <span className="text-xs text-slate-400 leading-none">Ramassage & Nettoyage</span>
          </div>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((l) => (
            <Link key={l.to} to={l.to}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-primary rounded-xl hover:bg-primary/5 transition-colors">
              {l.label}
            </Link>
          ))}
          <Link to="/connexion"
            className="ml-2 flex items-center gap-1.5 px-4 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary-light transition-colors">
            <LogIn size={15} /> Connexion
          </Link>
        </nav>

        {/* Mobile menu button */}
        <button onClick={() => setOpen((o) => !o)} className="md:hidden p-2 rounded-xl hover:bg-slate-100" aria-label="Menu">
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile nav */}
      {open && (
        <div className="md:hidden bg-white border-t border-slate-100 px-4 py-3 space-y-1">
          {navLinks.map((l) => (
            <Link key={l.to} to={l.to} onClick={() => setOpen(false)}
              className="block px-4 py-3 text-sm font-medium text-slate-700 hover:text-primary hover:bg-primary/5 rounded-xl transition-colors">
              {l.label}
            </Link>
          ))}
          <Link to="/connexion" onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-primary bg-primary/5 rounded-xl">
            <LogIn size={15} /> Connexion manager
          </Link>
        </div>
      )}
    </header>
  )
}

function PublicFooter() {
  return (
    <footer className="bg-slate-900 text-slate-400 py-12 px-4 mt-0">
      <div className="max-w-6xl mx-auto">
        <div className="grid sm:grid-cols-3 gap-8 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1.5 bg-primary rounded-lg"><Leaf size={14} className="text-white" /></div>
              <span className="font-bold text-white">AgriClean</span>
            </div>
            <p className="text-sm leading-relaxed">Expert en ramassage d'œufs et nettoyage agricole & industriel.</p>
          </div>
          <div>
            <p className="font-semibold text-white mb-3 text-sm">Liens rapides</p>
            <div className="space-y-2">
              {navLinks.map((l) => (
                <Link key={l.to} to={l.to} className="block text-sm hover:text-white transition-colors">{l.label}</Link>
              ))}
            </div>
          </div>
          <div>
            <p className="font-semibold text-white mb-3 text-sm">Accès</p>
            <div className="space-y-2">
              <Link to="/espace-pro" className="block text-sm hover:text-white transition-colors">Espace professionnel</Link>
              <Link to="/candidats" className="block text-sm hover:text-white transition-colors">Déposer une candidature</Link>
              <Link to="/connexion" className="block text-sm hover:text-white transition-colors">Connexion manager</Link>
            </div>
          </div>
        </div>
        <div className="border-t border-slate-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
          <p>© {new Date().getFullYear()} AgriClean SARL — Tous droits réservés</p>
          <p>Application de gestion interne</p>
        </div>
      </div>
    </footer>
  )
}

export default function PublicLayout({ children }) {
  return (
    <div className="min-h-screen bg-white font-sans flex flex-col">
      <PublicNav />
      <main className="flex-1 pt-16">
        {children}
      </main>
      <PublicFooter />
    </div>
  )
}
