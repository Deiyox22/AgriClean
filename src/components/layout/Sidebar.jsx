import { useState, useMemo } from 'react'
import { NavLink, useLocation, useNavigate, Link } from 'react-router-dom'
import {
  LayoutDashboard, CalendarDays, ClipboardList, Building2,
  Users, Truck, Receipt, FileCheck, Settings, Leaf,
  LogOut, Menu, X, Globe, UserCheck, BarChart2, BellRing,
  ChevronRight, MessageSquare, Target,
} from 'lucide-react'
import { useAuthStore } from '../../store/useAuthStore'
import { useInvoiceStore } from '../../store/useInvoiceStore'
import { useMissionStore } from '../../store/useMissionStore'
import { useVehicleStore } from '../../store/useVehicleStore'
import { useApplicationStore } from '../../store/useApplicationStore'
import { useSettingsStore } from '../../store/useSettingsStore'
import { useMessagingStore } from '../../store/useMessagingStore'
import { differenceInDays } from 'date-fns'

// ─── Badge counts ─────────────────────────────────────────────────────────────

function useAlertCount() {
  const invoices  = useInvoiceStore((s) => s.invoices)
  const missions  = useMissionStore((s) => s.missions)
  const vehicles  = useVehicleStore((s) => s.vehicles)
  const equipment = useVehicleStore((s) => s.equipment)
  const now = new Date()
  return useMemo(() => {
    const a = invoices.filter((i) => (i.status === 'emise' || i.status === 'en_attente') && i.dueDate && new Date(i.dueDate) < now).length
    const b = missions.filter((m) => m.status === 'planifie' && (!m.teamIds || m.teamIds.length === 0)).length
    const c = vehicles.filter((v) => v.nextCt && differenceInDays(new Date(v.nextCt), now) <= 60).length
    const d = equipment.filter((e) => e.status === 'maintenance' || e.status === 'panne').length
    return a + b + c + d
  }, [invoices, missions, vehicles, equipment])
}

function useCandidatureCount() {
  return useApplicationStore((s) => s.applications.filter((a) => a.status === 'recu').length)
}

function useMessagesCount() {
  return useMessagingStore((s) => s.unreadTotal)
}

// ─── Navigation structure ─────────────────────────────────────────────────────

const NAV = [
  { section: null, items: [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/planning',  label: 'Planning',  icon: CalendarDays },
    { to: '/missions',  label: 'Missions',  icon: ClipboardList },
    { to: '/clients',   label: 'Clients',   icon: Building2 },
    { to: '/prospects', label: 'Prospects', icon: Target },
  ]},
  { section: 'Équipe', items: [
    { to: '/team',              label: 'Employés',     icon: Users    },
    { to: '/team/candidatures', label: 'Candidatures', icon: UserCheck, badge: 'candidatures' },
    { to: '/fleet',             label: 'Flotte',       icon: Truck    },
  ]},
  { section: 'Facturation', items: [
    { to: '/invoicing?tab=factures', label: 'Factures', icon: Receipt,   matchPath: '/invoicing' },
    { to: '/invoicing?tab=devis',    label: 'Devis',    icon: FileCheck, matchPath: '/invoicing' },
  ]},
  { section: 'Analyse', items: [
    { to: '/rapports',    label: 'Rapports',    icon: BarChart2 },
    { to: '/alertes',     label: 'Alertes',     icon: BellRing,       badge: 'alertes' },
    { to: '/messagerie',  label: 'Messagerie',  icon: MessageSquare,  badge: 'messages' },
  ]},
  { section: null, items: [
    { to: '/settings', label: 'Paramètres', icon: Settings },
  ]},
]

// ─── Desktop nav item ─────────────────────────────────────────────────────────

function SideNavItem({ to, label, icon: Icon, badge, getBadge }) {
  const location = useLocation()
  const path     = to.split('?')[0]
  const search   = to.includes('?') ? '?' + to.split('?')[1] : ''
  const matchPath = to.split('?')[0] // for invoicing
  // Special: /team route shouldn't match /team/candidatures
  const isActive = path === '/team'
    ? location.pathname === '/team'
    : path === matchPath
      ? location.pathname.startsWith(path) && (!search || location.search === search)
      : location.pathname === path
  const count = getBadge(badge)

  return (
    <NavLink
      to={to}
      end={to === '/dashboard' || to === '/team'}
      className={() => `
        relative group flex items-center gap-3 px-3 py-2 rounded-xl text-[13px] font-medium transition-all duration-150
        ${isActive
          ? 'bg-primary/10 text-primary dark:bg-white/[0.12] dark:text-white'
          : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-white/[0.06]'
        }
      `}
    >
      {/* Active indicator */}
      <span className={`absolute left-0 w-0.5 h-5 rounded-r-full bg-primary transition-all ${isActive ? 'opacity-100' : 'opacity-0'}`} />
      <Icon size={17} className={isActive ? 'text-primary dark:text-white' : 'text-slate-400 group-hover:text-slate-700 dark:text-slate-500 dark:group-hover:text-slate-300'} strokeWidth={isActive ? 2.5 : 1.8} />
      <span className="flex-1 truncate">{label}</span>
      {count > 0 && (
        <span className="text-[10px] font-bold bg-red-500 text-white px-1.5 py-0.5 rounded-full leading-none">
          {count > 99 ? '99+' : count}
        </span>
      )}
    </NavLink>
  )
}

// ─── Manager avatar ───────────────────────────────────────────────────────────

function ManagerAvatar({ size = 'md' }) {
  const name = useSettingsStore((s) => s.settings.company?.name ?? 'AgriClean')
  const initials = name.split(' ').slice(0, 2).map((w) => w[0]?.toUpperCase() ?? '').join('') || 'AG'
  const sz = size === 'sm' ? 'w-8 h-8 text-xs' : 'w-9 h-9 text-sm'
  return (
    <div className={`${sz} rounded-xl bg-primary flex items-center justify-center text-white font-bold shrink-0`} title={name}>
      {initials}
    </div>
  )
}

// ─── Logout confirm ───────────────────────────────────────────────────────────

function LogoutModal({ onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-xs overflow-hidden">
        <div className="flex flex-col items-center pt-8 pb-5 px-6 text-center">
          <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mb-4">
            <LogOut size={24} className="text-red-500" />
          </div>
          <p className="text-base font-bold text-slate-900 dark:text-white">Se déconnecter ?</p>
          <p className="text-sm text-slate-500 mt-1">Vous devrez saisir vos identifiants pour revenir.</p>
        </div>
        <div className="flex gap-3 px-6 pb-6">
          <button onClick={onCancel} className="flex-1 py-2.5 rounded-2xl border-2 border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-semibold text-sm hover:bg-slate-50 dark:hover:bg-slate-700">Annuler</button>
          <button onClick={onConfirm} className="flex-1 py-2.5 rounded-2xl bg-red-500 text-white font-semibold text-sm hover:bg-red-600">Déconnecter</button>
        </div>
      </div>
    </div>
  )
}

// ─── Mobile bottom bar ────────────────────────────────────────────────────────

function MobileBottomBar({ onMenuOpen, alertCount }) {
  const location = useLocation()
  const items = [
    { to: '/dashboard', label: 'Accueil',  icon: LayoutDashboard },
    { to: '/planning',  label: 'Planning', icon: CalendarDays },
    { to: '/missions',  label: 'Missions', icon: ClipboardList },
    { to: '/alertes',   label: 'Alertes',  icon: BellRing, badge: alertCount },
  ]

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 safe-area-pb">
      <div className="flex items-stretch h-16">
        {items.map(({ to, label, icon: Icon, badge }) => {
          const active = location.pathname === to || (to !== '/dashboard' && location.pathname.startsWith(to))
          return (
            <NavLink key={to} to={to}
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 text-[10px] font-semibold transition-colors ${active ? 'text-primary' : 'text-slate-400'}`}>
              <div className={`relative p-1.5 rounded-xl ${active ? 'bg-primary/10' : ''}`}>
                <Icon size={21} strokeWidth={active ? 2.5 : 1.8} />
                {badge > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                    {badge > 9 ? '9+' : badge}
                  </span>
                )}
              </div>
              {label}
            </NavLink>
          )
        })}
        <button onClick={onMenuOpen} className="flex-1 flex flex-col items-center justify-center gap-0.5 text-[10px] font-semibold text-slate-400">
          <div className="p-1.5 rounded-xl"><Menu size={21} strokeWidth={1.8} /></div>
          Menu
        </button>
      </div>
    </nav>
  )
}

// ─── Mobile drawer ────────────────────────────────────────────────────────────

function MobileDrawer({ open, onClose, alertCount, candidatureCount }) {
  const navigate = useNavigate()
  const logout   = useAuthStore((s) => s.logoutManager)
  const location = useLocation()
  const [confirmLogout, setConfirmLogout] = useState(false)

  const messagesCount    = useMessagesCount()
  const getBadge = (badge) =>
    badge === 'alertes'      ? alertCount :
    badge === 'candidatures' ? candidatureCount :
    badge === 'messages'     ? messagesCount : 0

  const handleLogout = () => { logout(); onClose(); navigate('/connexion') }

  if (!open) return null

  return (
    <>
      <div className="md:hidden fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-slate-900 rounded-t-3xl shadow-2xl flex flex-col overflow-hidden" style={{ maxHeight: '88vh', paddingBottom: 'env(safe-area-inset-bottom, 16px)' }}>

        {/* Drag handle */}
        <div className="w-10 h-1 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mt-3 mb-1 shrink-0" />

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary rounded-xl flex items-center justify-center">
              <Leaf size={15} className="text-white" />
            </div>
            <div>
              <p className="font-bold text-slate-900 dark:text-white text-sm leading-tight">AgriClean</p>
              <p className="text-[11px] text-slate-400">Espace manager</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Nav */}
        <div className="flex-1 overflow-y-auto px-4 pb-3 space-y-0.5">
          {NAV.map((group, gi) => (
            <div key={gi}>
              {group.section && (
                <p className="px-3 pt-4 pb-1.5 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                  {group.section}
                </p>
              )}
              {gi > 0 && !group.section && <div className="h-px bg-slate-100 dark:bg-slate-800 my-2" />}
              {group.items.map((item) => {
                const path    = item.to.split('?')[0]
                const active  = path === '/team'
                  ? location.pathname === '/team'
                  : location.pathname.startsWith(path)
                const count   = getBadge(item.badge)
                const Icon    = item.icon
                return (
                  <NavLink key={item.to} to={item.to} onClick={onClose}
                    end={item.to === '/dashboard' || item.to === '/team'}
                    className={`flex items-center gap-3.5 px-4 py-3 rounded-2xl text-sm font-semibold transition-colors ${
                      active ? 'bg-primary text-white' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}>
                    <Icon size={19} strokeWidth={active ? 2.5 : 1.8} />
                    <span className="flex-1">{item.label}</span>
                    {count > 0 && (
                      <span className="text-[10px] font-bold bg-red-500 text-white px-1.5 py-0.5 rounded-full">{count}</span>
                    )}
                    {!active && <ChevronRight size={15} className="text-slate-300" />}
                  </NavLink>
                )
              })}
            </div>
          ))}

          <div className="h-px bg-slate-100 dark:bg-slate-800 my-2" />
          <Link to="/" onClick={onClose}
            className="flex items-center gap-3.5 px-4 py-3 rounded-2xl text-sm font-semibold text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
            <Globe size={19} strokeWidth={1.8} />
            <span className="flex-1">Site public</span>
            <ChevronRight size={15} className="text-slate-300" />
          </Link>
        </div>

        {/* Logout */}
        <div className="px-4 pt-2 pb-3 border-t border-slate-100 dark:border-slate-800 shrink-0">
          <button onClick={() => setConfirmLogout(true)}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-red-50 text-red-500 font-semibold text-sm hover:bg-red-100 transition-colors border border-red-100">
            <LogOut size={17} /> Se déconnecter
          </button>
        </div>
      </div>

      {confirmLogout && <LogoutModal onConfirm={handleLogout} onCancel={() => setConfirmLogout(false)} />}
    </>
  )
}

// ─── Main export ──────────────────────────────────────────────────────────────

export default function Sidebar() {
  const logout           = useAuthStore((s) => s.logoutManager)
  const companyName      = useSettingsStore((s) => s.settings.company?.name ?? 'AgriClean')
  const navigate         = useNavigate()
  const alertCount       = useAlertCount()
  const candidatureCount = useCandidatureCount()
  const [drawerOpen, setDrawerOpen]       = useState(false)
  const [confirmLogout, setConfirmLogout] = useState(false)

  const messagesCount    = useMessagesCount()
  const getBadge = (badge) =>
    badge === 'alertes'      ? alertCount :
    badge === 'candidatures' ? candidatureCount :
    badge === 'messages'     ? messagesCount : 0

  return (
    <>
      {/* ── Desktop sidebar (toujours sombre) ─────────────────────────── */}
      <aside className="hidden md:flex flex-col w-60 h-screen bg-white dark:bg-[#0f1117] border-r border-slate-100 dark:border-white/[0.06] fixed left-0 top-0 z-30">

        {/* Logo */}
        <div className="flex items-center gap-3 px-5 h-16 border-b border-slate-100 dark:border-white/[0.06] shrink-0">
          <div className="w-8 h-8 bg-primary rounded-xl flex items-center justify-center shrink-0">
            <Leaf size={16} className="text-white" />
          </div>
          <div className="min-w-0">
            <p className="font-bold text-slate-900 dark:text-white text-sm leading-tight truncate">AgriClean</p>
            <p className="text-[11px] text-slate-400 dark:text-slate-500">Manager</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 flex flex-col gap-0.5 overflow-y-auto">
          {NAV.map((group, gi) => (
            <div key={gi}>
              {group.section && (
                <p className="px-3 pt-4 pb-1.5 text-[10px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-widest select-none">
                  {group.section}
                </p>
              )}
              {gi > 0 && !group.section && (
                <div className="h-px bg-slate-100 dark:bg-white/[0.05] my-3" />
              )}
              {group.items.map((item) => (
                <SideNavItem key={item.to} {...item} getBadge={getBadge} />
              ))}
            </div>
          ))}
        </nav>

        {/* User footer */}
        <div className="px-3 py-4 border-t border-slate-100 dark:border-white/[0.06] shrink-0">
          <div className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-white/[0.05] transition-colors group">
            <ManagerAvatar />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">Manager</p>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate">{companyName}</p>
            </div>
            <button
              onClick={() => setConfirmLogout(true)}
              className="p-1.5 rounded-lg text-slate-400 dark:text-slate-600 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100 shrink-0"
              aria-label="Déconnexion"
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </aside>

      {confirmLogout && <LogoutModal onConfirm={() => { logout(); navigate('/connexion') }} onCancel={() => setConfirmLogout(false)} />}

      {/* ── Mobile ───────────────────────────────────────────────────── */}
      <MobileBottomBar onMenuOpen={() => setDrawerOpen(true)} alertCount={alertCount} />
      <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} alertCount={alertCount} candidatureCount={candidatureCount} />
    </>
  )
}
