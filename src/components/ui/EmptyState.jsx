import { Inbox } from 'lucide-react'

export default function EmptyState({ title, description, action, icon: Icon = Inbox, iconColor = 'text-slate-400' }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mb-4">
        <Icon size={28} className={iconColor} />
      </div>
      <h3 className="text-base font-semibold text-slate-700 dark:text-slate-300">{title}</h3>
      {description && (
        <p className="text-sm text-slate-400 mt-1.5 max-w-xs leading-relaxed">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}
