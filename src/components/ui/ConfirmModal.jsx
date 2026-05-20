import { AlertTriangle, Trash2 } from 'lucide-react'

export default function ConfirmModal({
  title,
  message,
  confirmLabel = 'Confirmer',
  cancelLabel  = 'Annuler',
  variant      = 'danger',  // 'danger' | 'warning'
  onConfirm,
  onCancel,
}) {
  const styles = {
    danger:  { bg: 'bg-red-100',    icon: 'text-red-500',    btn: 'bg-red-500 hover:bg-red-600',       Icon: Trash2 },
    warning: { bg: 'bg-amber-100',  icon: 'text-amber-500',  btn: 'bg-amber-500 hover:bg-amber-600',   Icon: AlertTriangle },
  }
  const { bg, icon: iconCls, btn, Icon } = styles[variant] ?? styles.danger

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-xs overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex flex-col items-center pt-8 pb-5 px-6 text-center">
          <div className={`w-14 h-14 rounded-full ${bg} flex items-center justify-center mb-4`}>
            <Icon size={24} className={iconCls} />
          </div>
          <p className="text-base font-bold text-slate-900 dark:text-white">{title}</p>
          {message && <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">{message}</p>}
        </div>
        <div className="flex gap-3 px-6 pb-6">
          <button onClick={onCancel}
            className="flex-1 py-2.5 rounded-2xl border-2 border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-semibold text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
            {cancelLabel}
          </button>
          <button onClick={onConfirm}
            className={`flex-1 py-2.5 rounded-2xl ${btn} text-white font-semibold text-sm transition-colors`}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
