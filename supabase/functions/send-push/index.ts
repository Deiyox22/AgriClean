// Supabase Edge Function — envoie les push notifications quand un message est inséré
// Déclenché via un Database Webhook sur la table "messages" (event INSERT)

import webpush from 'npm:web-push@3.6.7'
import { createClient } from 'npm:@supabase/supabase-js@2'

const VAPID_PUBLIC_KEY      = Deno.env.get('VAPID_PUBLIC_KEY')!
const VAPID_PRIVATE_KEY     = Deno.env.get('VAPID_PRIVATE_KEY')!
const VAPID_SUBJECT         = Deno.env.get('VAPID_SUBJECT') ?? 'mailto:contact@agriclean.fr'
const SUPABASE_URL          = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY)

Deno.serve(async (req) => {
  const { type, record } = await req.json()
  if (type !== 'INSERT') return new Response('ok')

  const msg = record  // ligne de la table messages (snake_case)
  const db  = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

  // Récupérer la conversation pour savoir qui notifier
  const { data: conv } = await db
    .from('conversations')
    .select('*')
    .eq('id', msg.conversation_id)
    .maybeSingle()

  if (!conv) return new Response('ok')

  // Construire la requête pour les abonnements concernés
  let query = db.from('push_subscriptions').select('*')

  if (msg.sender_type === 'manager') {
    // Le manager envoie → notifier employé(s) ou client
    if (conv.type === 'direct_employee') {
      query = query.eq('user_type', 'employee').eq('user_id', conv.employee_id)
    } else if (conv.type === 'direct_client') {
      query = query.eq('user_type', 'client').eq('user_id', conv.client_id)
    } else if (conv.type === 'mission') {
      const { data: mission } = await db
        .from('missions')
        .select('team_ids')
        .eq('id', conv.mission_id)
        .maybeSingle()
      if (mission?.team_ids?.length) {
        query = query.eq('user_type', 'employee').in('user_id', mission.team_ids)
      } else {
        return new Response('ok')
      }
    }
  } else {
    // Employé ou client envoie → notifier le manager
    query = query.eq('user_type', 'manager')
  }

  const { data: subs } = await query
  if (!subs?.length) return new Response('ok')

  const url     = msg.sender_type === 'manager' ? '/mon-espace' : '/messagerie'
  const payload = JSON.stringify({
    title: msg.sender_type === 'manager' ? 'AgriClean' : msg.sender_name,
    body:  msg.content.substring(0, 120),
    url,
    tag:   `conv-${msg.conversation_id}`,
  })

  await Promise.allSettled(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(sub.subscription, payload)
      } catch (err: any) {
        // Abonnement expiré ou invalide → supprimer
        if (err?.statusCode === 410 || err?.statusCode === 404) {
          await db.from('push_subscriptions').delete().eq('id', sub.id)
        }
      }
    })
  )

  return new Response('ok')
})
