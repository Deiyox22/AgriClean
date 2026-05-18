import Dexie from 'dexie'
import { subDays, addDays, format } from 'date-fns'

export const db = new Dexie('AgriCleanDB')

db.version(1).stores({
  clients:      '++id, name, type, status, createdAt',
  employees:    '++id, firstName, lastName, role, status',
  missions:     '++id, type, clientId, date, status, createdAt',
  vehicles:     '++id, name, plate, status',
  equipment:    '++id, name, category, status',
  invoices:     '++id, number, clientId, missionId, status, dueDate, createdAt',
  quotes:       '++id, clientId, missionId, status, createdAt',
  settings:     '++id',
})

db.version(2).stores({
  applications: '++id, email, position, status, createdAt',
  contacts:     '++id, name, email, message, createdAt',
})

const today = new Date()
const todayStr = today.toISOString()
const tomorrowStr = addDays(today, 1).toISOString()
const in3DaysStr = addDays(today, 3).toISOString()
const yesterdayStr = subDays(today, 1).toISOString()
const lastWeekStr = subDays(today, 7).toISOString()

export async function seedIfEmpty() {
  const clientCount = await db.clients.count()
  if (clientCount > 0) return

  const clientIds = await db.clients.bulkAdd([
    {
      name: 'EARL Dupont Avicole',
      siret: '12345678901234',
      type: 'avicole',
      status: 'actif',
      address: { street: '12 Route des Fermes', city: 'Saint-Gilles', zip: '30800', country: 'France' },
      contacts: [{ name: 'Jean Dupont', role: 'Gérant', phone: '06 12 34 56 78', email: 'jean@dupont-avicole.fr', preferred: true }],
      notes: '4 bâtiments. Ramassage hebdomadaire le lundi matin.',
      documents: [],
      createdAt: todayStr,
    },
    {
      name: 'GAEC Les Champs Verts',
      siret: '98765432109876',
      type: 'agricole',
      status: 'actif',
      address: { street: '5 Chemin du Moulin', city: 'Vergèze', zip: '30310', country: 'France' },
      contacts: [{ name: 'Marie Leroy', role: 'Associée', phone: '06 98 76 54 32', email: 'marie@champsverts.fr', preferred: true }],
      notes: 'Nettoyage des bâtiments agricoles 2x par an.',
      documents: [],
      createdAt: todayStr,
    },
    {
      name: 'Abattoir Régional SAS',
      siret: '55544433322211',
      type: 'industriel',
      status: 'actif',
      address: { street: '88 Zone Industrielle Nord', city: 'Nîmes', zip: '30000', country: 'France' },
      contacts: [{ name: 'Pascal Vidal', role: 'Directeur technique', phone: '04 66 11 22 33', email: 'p.vidal@abattoir-regional.fr', preferred: true }],
      notes: 'Nettoyage industriel mensuel. Accès badge requis.',
      documents: [],
      createdAt: todayStr,
    },
  ], { allKeys: true })

  const employeeIds = await db.employees.bulkAdd([
    {
      firstName: 'Thomas', lastName: 'Martin',
      role: 'chauffeur',
      phone: '06 11 22 33 44', email: 'thomas.martin@agriClean.fr',
      licenses: ['B', 'C', 'CE'],
      availability: ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi'],
      status: 'actif',
      notes: '',
    },
    {
      firstName: 'Julie', lastName: 'Bernard',
      role: 'polyvalent',
      phone: '06 22 33 44 55', email: 'julie.bernard@agriClean.fr',
      licenses: ['B'],
      availability: ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi'],
      status: 'actif',
      notes: '',
    },
    {
      firstName: 'Kevin', lastName: 'Rousseau',
      role: 'nettoyage',
      phone: '06 33 44 55 66', email: 'kevin.rousseau@agriClean.fr',
      licenses: ['B'],
      availability: ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi'],
      status: 'actif',
      notes: '',
    },
    {
      firstName: 'Sarah', lastName: 'Leclerc',
      role: 'polyvalent',
      phone: '06 44 55 66 77', email: 'sarah.leclerc@agriClean.fr',
      licenses: ['B', 'CACES'],
      availability: ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi'],
      status: 'conge',
      notes: 'Retour prévu fin du mois.',
    },
  ], { allKeys: true })

  await db.vehicles.bulkAdd([
    { name: 'Camion Benne', plate: 'AB-123-CD', type: 'camion', mileage: 87500, nextService: addDays(today, 20).toISOString(), nextCT: addDays(today, 180).toISOString(), status: 'operationnel' },
    { name: 'Utilitaire Renault', plate: 'EF-456-GH', type: 'utilitaire', mileage: 45200, nextService: addDays(today, 90).toISOString(), nextCT: addDays(today, 365).toISOString(), status: 'operationnel' },
    { name: 'Tracteur Fendt', plate: 'N/A', type: 'tracteur', mileage: 12000, nextService: addDays(today, 60).toISOString(), nextCT: null, status: 'operationnel' },
  ])

  await db.equipment.bulkAdd([
    { name: 'Nettoyeur haute pression Kärcher', category: 'haute_pression', status: 'operationnel', lastCheck: subDays(today, 15).toISOString() },
    { name: 'Aspirateur industriel', category: 'aspirateur', status: 'operationnel', lastCheck: subDays(today, 30).toISOString() },
    { name: 'Pompe à lisier', category: 'pompe', status: 'maintenance', lastCheck: subDays(today, 5).toISOString() },
  ])

  const [c1, c2, c3] = clientIds
  const [e1, e2, e3] = employeeIds

  const missionIds = await db.missions.bulkAdd([
    {
      type: 'ramassage',
      clientId: c1,
      siteAddress: '12 Route des Fermes, Saint-Gilles 30800',
      date: todayStr,
      duration: 3,
      teamIds: [e1],
      vehicleId: 1,
      status: 'en_cours',
      recurrence: 'hebdomadaire',
      instructions: 'Ramassage des 4 bâtiments. EPI obligatoire.',
      eggData: { buildings: 4, estimatedQuantity: 1200, realQuantity: null },
      cleaningData: null,
      report: null,
      createdAt: subDays(today, 3).toISOString(),
    },
    {
      type: 'nettoyage_agricole',
      clientId: c2,
      siteAddress: '5 Chemin du Moulin, Vergèze 30310',
      date: tomorrowStr,
      duration: 6,
      teamIds: [e2, e3],
      vehicleId: 2,
      status: 'planifie',
      recurrence: 'aucune',
      instructions: 'Nettoyage complet du bâtiment principal.',
      eggData: null,
      cleaningData: { surface: 800, products: ['Désinfectant Pro', 'Détergent'], checklist: [{ label: 'Pré-rinçage', done: false }, { label: 'Application produit', done: false }, { label: 'Rinçage final', done: false }], photos: [] },
      report: null,
      createdAt: subDays(today, 2).toISOString(),
    },
    {
      type: 'ramassage',
      clientId: c1,
      siteAddress: '12 Route des Fermes, Saint-Gilles 30800',
      date: yesterdayStr,
      duration: 3,
      teamIds: [e1],
      vehicleId: 1,
      status: 'termine',
      recurrence: 'hebdomadaire',
      instructions: '',
      eggData: { buildings: 4, estimatedQuantity: 1200, realQuantity: 1150 },
      cleaningData: null,
      report: { realDuration: 3.5, notes: 'Bâtiment 3 légèrement moins productif.', incidents: [], consumables: [] },
      createdAt: subDays(today, 10).toISOString(),
    },
    {
      type: 'nettoyage_industriel',
      clientId: c3,
      siteAddress: '88 Zone Industrielle Nord, Nîmes 30000',
      date: in3DaysStr,
      duration: 8,
      teamIds: [e1, e2, e3],
      vehicleId: 1,
      status: 'planifie',
      recurrence: 'mensuelle',
      instructions: 'Badge accès requis. Tenue protection niveau 3.',
      eggData: null,
      cleaningData: { surface: 2500, products: ['Dégraissant industriel', 'Désinfectant'], checklist: [{ label: 'Sécurisation zone', done: false }, { label: 'Dégraissage', done: false }, { label: 'Désinfection', done: false }, { label: 'Rinçage', done: false }], photos: [] },
      report: null,
      createdAt: subDays(today, 5).toISOString(),
    },
    {
      type: 'ramassage',
      clientId: c1,
      siteAddress: '12 Route des Fermes, Saint-Gilles 30800',
      date: lastWeekStr,
      duration: 3,
      teamIds: [e1],
      vehicleId: 1,
      status: 'facture',
      recurrence: 'hebdomadaire',
      instructions: '',
      eggData: { buildings: 4, estimatedQuantity: 1200, realQuantity: 1180 },
      cleaningData: null,
      report: { realDuration: 3, notes: '', incidents: [], consumables: [] },
      createdAt: subDays(today, 14).toISOString(),
    },
  ], { allKeys: true })

  const [m1, , , , m5] = missionIds

  await db.invoices.bulkAdd([
    {
      number: 'FAC-2025-001',
      clientId: c1,
      missionId: m5,
      lines: [{ description: 'Ramassage œufs — EARL Dupont Avicole', quantity: 1, unitPrice: 850, total: 850 }],
      tax: 20,
      status: 'payee',
      dueDate: subDays(today, 20).toISOString(),
      paidAt: subDays(today, 10).toISOString(),
      createdAt: subDays(today, 35).toISOString(),
    },
    {
      number: 'FAC-2025-002',
      clientId: c2,
      missionId: null,
      lines: [{ description: 'Nettoyage bâtiment agricole — GAEC Les Champs Verts', quantity: 1, unitPrice: 1200, total: 1200 }],
      tax: 20,
      status: 'en_attente',
      dueDate: addDays(today, 10).toISOString(),
      paidAt: null,
      createdAt: subDays(today, 20).toISOString(),
    },
  ])

  await db.settings.add({
    company: {
      name: 'AgriClean SARL',
      siret: '12345678900012',
      address: '15 Rue du Commerce, 30000 Nîmes',
      phone: '04 66 00 11 22',
      email: 'contact@agriclean.fr',
      rib: 'FR76 1234 5678 9012 3456 7890 123',
    },
    defaultRates: {
      ramassage: 68,
      nettoyage_agricole: 78,
      nettoyage_industriel: 98,
      prixM2Agricole: 4.5,
      prixM2Industriel: 7,
      tvaDefault: 20,
    },
    legalMentions: 'Paiement à 30 jours. Tout retard de paiement entraîne des pénalités de 3 fois le taux légal.',
    invoicePrefix: 'FAC',
    theme: 'light',
    adminEmail: 'admin@agriclean.fr',
    adminPassword: 'agriclean2025',
    travelSettings: {
      mode: 'km',          // 'km' | 'duration' | 'flat' | 'none'
      ratePerKm: 0.68,     // barème IK fiscal 2024
      freeKm: 0,           // km offerts (rayon gratuit)
      ratePerHour: 45,     // si mode 'duration'
      flatFee: 35,         // si mode 'flat'
      billableByDefault: true,
    },
  })
}
