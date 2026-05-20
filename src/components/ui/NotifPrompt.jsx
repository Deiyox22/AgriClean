import { useState, useEffect } from 'react'
import { Bell, X } from 'lucide-react'
import { isPushSupported, getNotifPermission, subscribeToPush } from '../../utils/pushNotifications'

export default function NotifPrompt({ userType, userId = null }) {
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (!isPushSupported()) return
    if (getNotifPermission() === 'default') {
      // Afficher seulement si pas encore décidé
      const dismissed = sessionStorage.getItem('notif_prompt_dismissed')
      if (!dismissed) setShow(true)
    }
  }, [])

  if (!show) return null

  const handleAccept = async () => {
    setShow(false)
    await subscribeToPush(userType, userId)
  }

  const handleDismiss = () => {
    sessionStorage.setItem('notif_prompt_dismissed', '1')
    setShow(false)
  }

  return (
    <div className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-sm">
      <div className="bg-slate-900 dark:bg-slate-800 text-white rounded-2xl shadow-2xl px-4 py-3.5 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shrink-0">
          <Bell size={17} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold leading-tight">Activer les notifications</p>
          <p className="text-xs text-slate-400 mt-0.5">Soyez alerté des nouveaux messages</p>
        </div>
        <button onClick={handleAccept}
          className="shrink-0 px-3 py-1.5 bg-primary text-white text-xs font-bold rounded-xl hover:opacity-90 transition-opacity">
          Activer
        </button>
        <button onClick={handleDismiss}
          className="shrink-0 p-1 text-slate-400 hover:text-white transition-colors">
          <X size={16} />
        </button>
      </div>
    </div>
  )
}
