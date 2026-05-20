import { supabase } from '../lib/supabase'

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY

function urlBase64ToUint8Array(b64) {
  const pad = '='.repeat((4 - (b64.length % 4)) % 4)
  const raw = atob((b64 + pad).replace(/-/g, '+').replace(/_/g, '/'))
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)))
}

export function isPushSupported() {
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
}

export function getNotifPermission() {
  return Notification.permission // 'default' | 'granted' | 'denied'
}

export async function subscribeToPush(userType, userId = null) {
  if (!isPushSupported() || !VAPID_PUBLIC_KEY) return null

  try {
    const permission = await Notification.requestPermission()
    if (permission !== 'granted') return null

    const reg = await navigator.serviceWorker.ready
    const existing = await reg.pushManager.getSubscription()
    const sub = existing ?? await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    })

    await supabase.from('push_subscriptions').upsert({
      user_type:    userType,
      user_id:      userId ?? null,
      endpoint:     sub.endpoint,
      subscription: sub.toJSON(),
    }, { onConflict: 'endpoint' })

    return sub
  } catch (err) {
    console.warn('Push subscription failed:', err)
    return null
  }
}

export async function unsubscribeFromPush() {
  if (!isPushSupported()) return
  const reg = await navigator.serviceWorker.ready
  const sub = await reg.pushManager.getSubscription()
  if (!sub) return
  await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint)
  await sub.unsubscribe()
}
