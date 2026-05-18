import { format, isToday, isTomorrow, isYesterday } from 'date-fns'
import { fr } from 'date-fns/locale'

export const formatCurrency = (amount) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount ?? 0)

export const formatDate = (date) => {
  if (!date) return '—'
  return format(new Date(date), 'dd/MM/yyyy', { locale: fr })
}

export const formatDateTime = (date) => {
  if (!date) return '—'
  return format(new Date(date), 'dd/MM/yyyy HH:mm', { locale: fr })
}

export const formatRelativeDate = (date) => {
  if (!date) return '—'
  const d = new Date(date)
  if (isToday(d)) return "Aujourd'hui"
  if (isTomorrow(d)) return 'Demain'
  if (isYesterday(d)) return 'Hier'
  return format(d, 'EEEE d MMMM', { locale: fr })
}

export const getInitials = (firstName, lastName) =>
  `${(firstName?.[0] ?? '').toUpperCase()}${(lastName?.[0] ?? '').toUpperCase()}`

export const getMissionTypeLabel = (type) => ({
  ramassage: 'Ramassage œufs',
  nettoyage_agricole: 'Nettoyage agricole',
  nettoyage_industriel: 'Nettoyage industriel',
}[type] ?? type)

export const getMissionTypeColor = (type) => ({
  ramassage: 'bg-amber-100 text-amber-800',
  nettoyage_agricole: 'bg-blue-100 text-blue-800',
  nettoyage_industriel: 'bg-indigo-100 text-indigo-800',
}[type] ?? 'bg-gray-100 text-gray-800')

export const getStatusLabel = (status) => ({
  planifie: 'Planifié',
  en_cours: 'En cours',
  termine: 'Terminé',
  facture: 'Facturé',
  paye: 'Payé',
  annule: 'Annulé',
  actif: 'Actif',
  inactif: 'Inactif',
  prospect: 'Prospect',
  conge: 'Congé',
  arret: 'Arrêt',
  emise: 'Émise',
  en_attente: 'En attente',
  payee: 'Payée',
  relance1: 'Relance 1',
  relance2: 'Relance 2',
  litige: 'Litige',
  brouillon: 'Brouillon',
  envoye: 'Envoyé',
  accepte: 'Accepté',
  refuse: 'Refusé',
  converti: 'Converti',
  operationnel: 'Opérationnel',
  maintenance: 'En maintenance',
  hors_service: 'Hors service',
}[status] ?? status)

export const getStatusBadgeClass = (status) => ({
  planifie: 'bg-gray-100 text-gray-700',
  en_cours: 'bg-blue-100 text-blue-700',
  termine: 'bg-green-100 text-green-700',
  facture: 'bg-purple-100 text-purple-700',
  paye: 'bg-emerald-100 text-emerald-700',
  annule: 'bg-red-100 text-red-700',
  actif: 'bg-green-100 text-green-700',
  inactif: 'bg-gray-100 text-gray-700',
  prospect: 'bg-blue-100 text-blue-700',
  conge: 'bg-amber-100 text-amber-700',
  arret: 'bg-red-100 text-red-700',
  emise: 'bg-blue-100 text-blue-700',
  en_attente: 'bg-amber-100 text-amber-700',
  payee: 'bg-emerald-100 text-emerald-700',
  relance1: 'bg-orange-100 text-orange-700',
  relance2: 'bg-red-100 text-red-700',
  litige: 'bg-red-200 text-red-800',
  brouillon: 'bg-slate-100 text-slate-600',
  envoye: 'bg-blue-100 text-blue-700',
  accepte: 'bg-green-100 text-green-700',
  refuse: 'bg-red-100 text-red-700',
  converti: 'bg-purple-100 text-purple-700',
  operationnel: 'bg-green-100 text-green-700',
  maintenance: 'bg-amber-100 text-amber-700',
  hors_service: 'bg-red-100 text-red-700',
}[status] ?? 'bg-gray-100 text-gray-700')

export const getRoleLabel = (role) => ({
  chauffeur: 'Chauffeur',
  nettoyage: 'Agent de nettoyage',
  polyvalent: 'Polyvalent',
}[role] ?? role)

export const getClientTypeLabel = (type) => ({
  avicole: 'Élevage avicole',
  agricole: 'Agricole',
  industriel: 'Industriel',
  mixte: 'Mixte',
}[type] ?? type)
