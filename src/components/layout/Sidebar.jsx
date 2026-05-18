import { useState } from 'react'
import { NavLink, useLocation, useNavigate, Link } from 'react-router-dom'
import {
  LayoutDashboard, CalendarDays, ClipboardList, Building2,
  Users, Truck, FileText, Settings, Leaf, Receipt, FileCheck,
  ChevronRight, LogOut, Menu, X, Globe, AlertTriangle,
} from 'lucide-react'
import { useAuthStore } from '../../store/useAuthStore'

// ─── Navigation data ────────────────────────────────────────────────────────

const allNavItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/planning',  label: 'Planning',  icon: CalendarDays },
  { to: '/missions',  label: 'Missions',  icon: ClipboardList },
  { to: '/clients',   label: 'Clients',   icon: Building2 },
  { to: '/team',      label: 'Équipe',    icon: Users },
  { to: '/fleet',     label: 'Flotte',    icon: Truck },
  {
    label: 'Facturation',
    icon: FileText,
    children: [
      { to: '/invoicing?tab=factures', label: 'Factures', icon: Receipt,   matchPath: '/invoicing' },
      { to: '/invoicing?tab=devis',    label: 'Devis',    icon: FileCheck, matchPath: '/invoicing' },
    ],
  },
  { to: '/settings', label: 'Paramètres', icon: Settings },
]

const bottomBarItems = [
  { to: '/dashboard', label: 'Accueil',   icon: LayoutDashboard },
  { to: '/planning',  label: 'Planning',  icon: CalendarDays },
  { to: '/missions',  label: 'Missions',  icon: ClipboardList },
  { to: '/invoicing', label: 'Factures',  icon: Receipt },
]

// ─── Desktop nav helpers ────────────────────────────────────────────────────

function NavItem({ to, label, icon: Icon }) {
  const location = useLocation()
  const path   = to.split('?')[0]
  const search = to.includes('?') ? '?' + to.split('?')[1] : ''
  const exact  = location.pathname === path && (!search || location.search === search)

  return (
    <NavLink
      to={to}
      end={to === '/dashboard'}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
          isActive || exact ? 'bg-primary text-white' : 'text-slate-600 hover:bg-slate-100'
        }`
      }
    >
      <Icon size={18} />
      <span>{label}</span>
    </NavLink>
  )
}

function NavGroup({ label, icon: Icon, children }) {
  const location      = useLocation()
  const isGroupActive = children.some((c) =>
    location.pathname.startsWith(c.matchPath ?? c.to.split('?')[0])
  )

  return (
    <div>
      <div className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium ${isGroupActive ? 'text-primary' : 'text-slate-600'}`}>
        <Icon size={18} />
        <span className="flex-1">{label}</span>
        <ChevronRight size={14} className={`transition-transform text-slate-300 ${isGroupActive ? 'rotate-90' : ''}`} />
      </div>
      <div className="ml-4 pl-3 border-l border-slate-100 mt-0.5 space-y-0.5">
        {children.map((child) => {
          const path   = child.to.split('?')[0]
          const search = child.to.includes('?') ? '?' + child.to.split('?')[1] : ''
          const isActive = location.pathname === path && (!search || location.search === search)
          const ChildIcon = child.icon
          return (
            <NavLink
              key={child.to}
              to={child.to}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                isActive ? 'bg-primary text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <ChildIcon size={16} />
              {child.label}
            </NavLink>
          )
        })}
      </div>
    </div>
  )
}

// ─── Logout confirm dialog ───────────────────────────────────────────────────

function LogoutConfirm({ onConfirm, onCancel }) {
  return (
    /* Full-bleed overlay inside the drawer */
    <div className="absolute inset-0 rounded-t-3xl bg-white/90 backdrop-blur-sm flex flex-col items-center justify-end z-10 p-6 pb-8">
      <div className="w-full bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
        {/* Icon + text */}
        <div className="flex flex-col items-center pt-8 pb-5 px-6 text-center">
          <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mb-4">
            <LogOut size={26} className="text-red-500" />
          </div>
          <p className="text-lg font-bold text-slate-900">Se déconnecter ?</p>
          <p className="text-sm text-slate-500 mt-1">
            Vous devrez saisir vos identifiants pour accéder à nouveau à l'application.
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 px-6 pb-6">
          <button
            onClick={onCancel}
            className="flex-1 py-3 rounded-2xl border-2 border-slate-200 text-slate-700 font-semibold text-sm hover:bg-slate-50 transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-3 rounded-2xl bg-red-500 text-white font-semibold text-sm hover:bg-red-600 transition-colors"
          >
            Se déconnecter
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Mobile bottom bar ───────────────────────────────────────────────────────

function MobileBottomBar({ onMenuOpen }) {
  const location = useLocation()

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-100 safe-area-pb">
      <div className="flex items-stretch h-16">
        {bottomBarItems.map((item) => {
          const Icon     = item.icon
          const isActive =
            location.pathname === item.to ||
            (item.to !== '/dashboard' && location.pathname.startsWith(item.to))

          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 text-[10px] font-semibold tracking-wide transition-colors ${
                isActive ? 'text-primary' : 'text-slate-400'
              }`}
            >
              <div className={`p-1.5 rounded-xl transition-colors ${isActive ? 'bg-primary/10' : ''}`}>
                <Icon size={22} strokeWidth={isActive ? 2.5 : 1.8} />
              </div>
              <span>{item.label}</span>
            </NavLink>
          )
        })}

        {/* Menu toggle */}
        <button
          onClick={onMenuOpen}
          className="flex-1 flex flex-col items-center justify-center gap-0.5 text-[10px] font-semibold tracking-wide text-slate-400"
        >
          <div className="p-1.5 rounded-xl">
            <Menu size={22} strokeWidth={1.8} />
          </div>
          <span>Menu</span>
        </button>
      </div>
    </nav>
  )
}

// ─── Mobile drawer ───────────────────────────────────────────────────────────

function DrawerNavItem({ to, label, icon: Icon, onClose }) {
  const location = useLocation()
  const path     = to.split('?')[0]
  const search   = to.includes('?') ? '?' + to.split('?')[1] : ''
  const isActive = location.pathname === path && (!search || location.search === search)

  return (
    <NavLink
      to={to}
      onClick={onClose}
      end={to === '/dashboard'}
      className={`flex items-center gap-3.5 px-4 py-3.5 rounded-2xl text-sm font-semibold transition-colors ${
        isActive ? 'bg-primary text-white shadow-sm' : 'text-slate-700 hover:bg-slate-50'
      }`}
    >
      <Icon size={20} strokeWidth={isActive ? 2.5 : 1.8} />
      <span>{label}</span>
      {!isActive && <ChevronRight size={16} className="ml-auto text-slate-300" />}
    </NavLink>
  )
}

function MobileDrawer({ open, onClose }) {
  const navigate = useNavigate()
  const logout   = useAuthStore((s) => s.logoutManager)
  const [confirmLogout, setConfirmLogout] = useState(false)

  const handleConfirmLogout = () => {
    setConfirmLogout(false)
    onClose()
    logout()
    navigate('/connexion')
  }

  if (!open) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="md:hidden fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
        onClick={() => { setConfirmLogout(false); onClose() }}
      />

      {/* Sheet */}
      <div
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-2xl flex flex-col overflow-hidden"
        style={{ maxHeight: '90vh', paddingBottom: 'env(safe-area-inset-bottom, 16px)' }}
      >
        {/* Logout confirm overlay (inside the sheet) */}
        {confirmLogout && (
          <LogoutConfirm
            onConfirm={handleConfirmLogout}
            onCancel={() => setConfirmLogout(false)}
          />
        )}

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-primary rounded-xl">
              <Leaf size={16} className="text-white" />
            </div>
            <div>
              <span className="font-bold text-slate-900 text-sm block leading-tight">AgriClean</span>
              <span className="text-xs text-slate-400 leading-none">Manager</span>
            </div>
          </div>
          <button
            onClick={() => { setConfirmLogout(false); onClose() }}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors"
            aria-label="Fermer le menu"
          >
            <X size={18} className="text-slate-600" />
          </button>
        </div>

        {/* Drag indicator */}
        <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mb-3 shrink-0" />

        {/* Nav items — scrollable */}
        <div className="flex-1 overflow-y-auto px-4 space-y-1 pb-2">
          {/* Main nav */}
          {allNavItems.map((item) => {
            if (item.children) {
              return (
                <div key={item.label}>
                  {/* Group label */}
                  <div className="flex items-center gap-2 px-4 py-2 mt-1">
                    <item.icon size={15} className="text-slate-400" />
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{item.label}</span>
                  </div>
                  <div className="pl-2 space-y-0.5">
                    {item.children.map((child) => (
                      <DrawerNavItem key={child.to} {...child} icon={child.icon} onClose={onClose} />
                    ))}
                  </div>
                </div>
              )
            }
            return <DrawerNavItem key={item.to} {...item} onClose={onClose} />
          })}

          {/* Separator */}
          <div className="border-t border-slate-100 my-2" />

          {/* Site public */}
          <Link
            to="/"
            onClick={onClose}
            className="flex items-center gap-3.5 px-4 py-3.5 rounded-2xl text-sm font-semibold text-slate-500 hover:bg-slate-50 transition-colors"
          >
            <Globe size={20} strokeWidth={1.8} />
            <span>Voir le site public</span>
            <ChevronRight size={16} className="ml-auto text-slate-300" />
          </Link>
        </div>

        {/* Logout button — sticky footer */}
        <div className="px-4 pt-2 pb-3 border-t border-slate-100 shrink-0">
          <button
            onClick={() => setConfirmLogout(true)}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl border-2 border-red-100 bg-red-50 text-red-500 font-semibold text-sm hover:bg-red-100 transition-colors"
          >
            <LogOut size={18} />
            Se déconnecter
          </button>
        </div>
      </div>
    </>
  )
}

// ─── Main export ─────────────────────────────────────────────────────────────

export default function Sidebar() {
  const logout      = useAuthStore((s) => s.logoutManager)
  const navigate    = useNavigate()
  const [drawerOpen, setDrawerOpen]         = useState(false)
  const [confirmLogout, setConfirmLogout]   = useState(false)

  const handleDesktopLogout = () => {
    logout()
    navigate('/connexion')
  }

  return (
    <>
      {/* ── Desktop sidebar ──────────────────────────── */}
      <aside className="hidden md:flex flex-col w-60 h-screen bg-white border-r border-slate-100 fixed left-0 top-0 z-30">
        <div className="flex items-center gap-2.5 px-5 py-5 border-b border-slate-100">
          <div className="p-2 bg-primary rounded-xl">
            <Leaf size={18} className="text-white" />
          </div>
          <div>
            <span className="font-bold text-slate-900 text-base leading-tight block">AgriClean</span>
            <span className="text-xs text-slate-400">Manager</span>
          </div>
        </div>

        <nav className="flex-1 p-3 flex flex-col gap-0.5 overflow-y-auto">
          {allNavItems.map((item) =>
            item.children
              ? <NavGroup key={item.label} {...item} />
              : <NavItem  key={item.to}    {...item} />
          )}
        </nav>

        <div className="p-4 border-t border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-white text-sm font-bold shrink-0">
              M
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-900 truncate">Manager</p>
              <p className="text-xs text-slate-400">Administrateur</p>
            </div>
            <button
              onClick={() => setConfirmLogout(true)}
              className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors shrink-0"
              aria-label="Déconnexion"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Desktop logout confirm (full Modal style) */}
      {confirmLogout && (
        <div className="hidden md:flex fixed inset-0 z-50 items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setConfirmLogout(false)} />
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden">
            <div className="flex flex-col items-center pt-8 pb-5 px-6 text-center">
              <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mb-4">
                <LogOut size={26} className="text-red-500" />
              </div>
              <p className="text-lg font-bold text-slate-900">Se déconnecter ?</p>
              <p className="text-sm text-slate-500 mt-1.5">
                Vous devrez saisir vos identifiants pour accéder à nouveau à l'application.
              </p>
            </div>
            <div className="flex gap-3 px-6 pb-6">
              <button onClick={() => setConfirmLogout(false)}
                className="flex-1 py-3 rounded-2xl border-2 border-slate-200 text-slate-700 font-semibold text-sm hover:bg-slate-50 transition-colors">
                Annuler
              </button>
              <button onClick={handleDesktopLogout}
                className="flex-1 py-3 rounded-2xl bg-red-500 text-white font-semibold text-sm hover:bg-red-600 transition-colors">
                Se déconnecter
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Mobile bottom bar + drawer ────────────────── */}
      <MobileBottomBar onMenuOpen={() => setDrawerOpen(true)} />
      <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </>
  )
}
