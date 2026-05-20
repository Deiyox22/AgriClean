import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react'
import { useToastStore } from '../../store/useToastStore'

const CONFIG = {
  success: { icon: CheckCircle, cls: 'bg-green-50 border-green-200 text-green-800', icon_cls: 'text-green-500' },
  error:   { icon: XCircle,     cls: 'bg-red-50 border-red-200 text-red-800',       icon_cls: 'text-red-500'   },
  warning: { icon: AlertTriangle,cls: 'bg-amber-50 border-amber-200 text-amber-800',icon_cls: 'text-amber-500' },
  info:    { icon: Info,         cls: 'bg-blue-50 border-blue-200 text-blue-800',   icon_cls: 'text-blue-500'  },
}

export default function ToastContainer() {
  const toasts  = useToastStore((s) => s.toasts)
  const dismiss = useToastStore((s) => s.dismiss)

  if (!toasts.length) return null

  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 w-full max-w-sm px-4 pointer-events-none">
      {toasts.map((t) => {
        const { icon: Icon, cls, icon_cls } = CONFIG[t.type] ?? CONFIG.info
        return (
          <div
            key={t.id}
            className={`flex items-center gap-3 px-4 py-3 rounded-2xl border shadow-lg pointer-events-auto ${cls}`}
          >
            <Icon size={18} className={`shrink-0 ${icon_cls}`} />
            <span className="flex-1 text-sm font-medium">{t.message}</span>
            {t.action && (
              <button
                onClick={() => { t.action.onClick(); dismiss(t.id) }}
                className="shrink-0 text-xs font-bold underline hover:no-underline transition-all whitespace-nowrap"
              >
                {t.action.label}
              </button>
            )}
            <button
              onClick={() => dismiss(t.id)}
              className="shrink-0 opacity-50 hover:opacity-100 transition-opacity"
              aria-label="Fermer"
            >
              <X size={15} />
            </button>
          </div>
        )
      })}
    </div>
  )
}
