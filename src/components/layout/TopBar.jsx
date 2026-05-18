import { useLocation, useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'

const pageTitles = {
  '/dashboard': 'Dashboard',
  '/clients': 'Clients',
  '/team': 'Équipe',
  '/planning': 'Planning',
  '/missions': 'Missions',
  '/missions/new': 'Nouvelle mission',
  '/fleet': 'Flotte & Matériel',
  '/invoicing': 'Facturation',
  '/settings': 'Paramètres',
}

const pageActions = {
  '/missions': { label: 'Nouvelle mission', to: '/missions/new' },
  '/clients': null,
  '/team': null,
  '/invoicing': null,
}

export default function TopBar() {
  const location = useLocation()
  const navigate = useNavigate()
  const segments = location.pathname.split('/').filter(Boolean)

  // Match exact path first, then by first segment
  const title =
    pageTitles[location.pathname] ??
    pageTitles[`/${segments[0]}`] ??
    'AgriClean'

  const action = pageActions[location.pathname]

  return (
    <header className="h-14 bg-white border-b border-slate-100 flex items-center gap-3 px-4 md:px-6 sticky top-0 z-20">
      <h1 className="flex-1 text-base font-bold text-slate-900 truncate">{title}</h1>

      {action && (
        <button
          onClick={() => navigate(action.to)}
          className="flex items-center gap-1.5 px-3 py-2 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary-light transition-colors min-h-[40px]"
        >
          <Plus size={16} />
          <span className="hidden sm:inline">{action.label}</span>
        </button>
      )}

      <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-sm font-bold shrink-0">
        M
      </div>
    </header>
  )
}
