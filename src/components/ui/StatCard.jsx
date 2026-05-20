import Card from './Card'

const ICON_COLORS = {
  primary: 'bg-primary/10 text-primary',
  accent:  'bg-amber-100 text-amber-700',
  green:   'bg-green-100 text-green-700',
  red:     'bg-red-100 text-red-700',
  blue:    'bg-blue-100 text-blue-700',
  amber:   'bg-amber-100 text-amber-700',
  purple:  'bg-purple-100 text-purple-700',
}

// Couleurs avec fond dégradé pour les KPIs revenus
const FEATURED = {
  accent: 'bg-gradient-to-br from-amber-500 to-orange-500',
  amber:  'bg-gradient-to-br from-amber-400 to-amber-600',
}

export default function StatCard({ label, value, icon: Icon, color = 'primary', sub, featured = false }) {
  const isFeatured = featured || color === 'accent' || color === 'amber'

  if (isFeatured && FEATURED[color]) {
    return (
      <div className={`${FEATURED[color]} rounded-2xl p-5 shadow-md shadow-amber-200/50`}>
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-white/75 font-medium">{label}</p>
            <p className="text-2xl font-bold text-white mt-1 font-mono">{value}</p>
            {sub && <p className="text-xs text-white/60 mt-1">{sub}</p>}
          </div>
          {Icon && (
            <div className="p-3 rounded-xl bg-white/20">
              <Icon size={20} className="text-white" />
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-500">{label}</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1 font-mono">{value}</p>
          {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
        </div>
        {Icon && (
          <div className={`p-3 rounded-xl ${ICON_COLORS[color] ?? ICON_COLORS.primary}`}>
            <Icon size={20} />
          </div>
        )}
      </div>
    </Card>
  )
}
