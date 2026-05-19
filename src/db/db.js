import { subDays, addDays } from 'date-fns'
import { supabase, toDb } from '../lib/supabase'

// Vérifie si la base est vide et insère les paramètres par défaut si besoin
export async function seedIfEmpty() {
  const { count } = await supabase.from('settings').select('id', { count: 'exact', head: true })
  if (count > 0) return
  await supabase.from('settings').insert({
    company: { name: 'AgriClean SARL', siret: '12345678900012', address: '15 Rue du Commerce, 30000 Nîmes', phone: '04 66 00 11 22', email: 'contact@agriclean.fr', rib: 'FR76 1234 5678 9012 3456 7890 123' },
    default_rates: { ramassage: 68, nettoyage_agricole: 78, nettoyage_industriel: 98, prixM2Agricole: 4.5, prixM2Industriel: 7, tvaDefault: 20 },
    legal_mentions: 'Paiement à 30 jours. Tout retard de paiement entraîne des pénalités de 3 fois le taux légal.',
    invoice_prefix: 'FAC',
    theme: 'light',
    admin_email: 'admin@agriclean.fr',
    admin_password: 'agriclean2025',
    travel_settings: { mode: 'km', ratePerKm: 0.68, freeKm: 0, ratePerHour: 45, flatFee: 35, billableByDefault: true },
  })
}

// Supprime toutes les données et réinsère les données de démonstration
export async function resetAndSeed() {
  const today = new Date()
  const d = (fn) => fn(today).toISOString()

  // Suppression dans l'ordre FK
  await supabase.from('invoices').delete().gte('id', 0)
  await supabase.from('quotes').delete().gte('id', 0)
  await supabase.from('missions').delete().gte('id', 0)
  await supabase.from('applications').delete().gte('id', 0)
  await supabase.from('contacts').delete().gte('id', 0)
  await supabase.from('settings').delete().gte('id', 0)
  await supabase.from('equipment').delete().gte('id', 0)
  await supabase.from('vehicles').delete().gte('id', 0)
  await supabase.from('employees').delete().gte('id', 0)
  await supabase.from('clients').delete().gte('id', 0)

  // Clients
  const { data: clientRows } = await supabase.from('clients').insert([
    { name: 'EARL Dupont Avicole', siret: '12345678901234', type: 'avicole', status: 'actif', address: { street: '12 Route des Fermes', city: 'Saint-Gilles', zip: '30800', country: 'France' }, contacts: [{ name: 'Jean Dupont', role: 'Gérant', phone: '06 12 34 56 78', email: 'jean@dupont-avicole.fr', preferred: true }], notes: '4 bâtiments. Ramassage hebdomadaire le lundi matin.', documents: [], created_at: today.toISOString() },
    { name: 'GAEC Les Champs Verts', siret: '98765432109876', type: 'agricole', status: 'actif', address: { street: '5 Chemin du Moulin', city: 'Vergèze', zip: '30310', country: 'France' }, contacts: [{ name: 'Marie Leroy', role: 'Associée', phone: '06 98 76 54 32', email: 'marie@champsverts.fr', preferred: true }], notes: 'Nettoyage des bâtiments agricoles 2x par an.', documents: [], created_at: today.toISOString() },
    { name: 'Abattoir Régional SAS', siret: '55544433322211', type: 'industriel', status: 'actif', address: { street: '88 Zone Industrielle Nord', city: 'Nîmes', zip: '30000', country: 'France' }, contacts: [{ name: 'Pascal Vidal', role: 'Directeur technique', phone: '04 66 11 22 33', email: 'p.vidal@abattoir-regional.fr', preferred: true }], notes: 'Nettoyage industriel mensuel. Accès badge requis.', documents: [], created_at: today.toISOString() },
  ]).select()
  const [c1, c2, c3] = clientRows.map(r => r.id)

  // Employés
  const { data: employeeRows } = await supabase.from('employees').insert([
    { first_name: 'Thomas', last_name: 'Martin', role: 'chauffeur', phone: '06 11 22 33 44', email: 'thomas.martin@agriClean.fr', licenses: ['B', 'C', 'CE'], availability: ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi'], status: 'actif', notes: '' },
    { first_name: 'Julie', last_name: 'Bernard', role: 'polyvalent', phone: '06 22 33 44 55', email: 'julie.bernard@agriClean.fr', licenses: ['B'], availability: ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi'], status: 'actif', notes: '' },
    { first_name: 'Kevin', last_name: 'Rousseau', role: 'nettoyage', phone: '06 33 44 55 66', email: 'kevin.rousseau@agriClean.fr', licenses: ['B'], availability: ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi'], status: 'actif', notes: '' },
    { first_name: 'Sarah', last_name: 'Leclerc', role: 'polyvalent', phone: '06 44 55 66 77', email: 'sarah.leclerc@agriClean.fr', licenses: ['B', 'CACES'], availability: ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi'], status: 'conge', notes: 'Retour prévu fin du mois.' },
  ]).select()
  const [e1, e2, e3] = employeeRows.map(r => r.id)

  // Véhicules
  const { data: vehicleRows } = await supabase.from('vehicles').insert([
    { name: 'Camion Benne', plate: 'AB-123-CD', type: 'camion', mileage: 87500, next_service: d(t => addDays(t, 20)), next_ct: d(t => addDays(t, 180)), status: 'operationnel' },
    { name: 'Utilitaire Renault', plate: 'EF-456-GH', type: 'utilitaire', mileage: 45200, next_service: d(t => addDays(t, 90)), next_ct: d(t => addDays(t, 365)), status: 'operationnel' },
    { name: 'Tracteur Fendt', plate: 'N/A', type: 'tracteur', mileage: 12000, next_service: d(t => addDays(t, 60)), next_ct: null, status: 'operationnel' },
  ]).select()
  const [v1, v2] = vehicleRows.map(r => r.id)

  // Équipements
  await supabase.from('equipment').insert([
    { name: 'Nettoyeur haute pression Kärcher', category: 'haute_pression', status: 'operationnel', last_check: d(t => subDays(t, 15)) },
    { name: 'Aspirateur industriel', category: 'aspirateur', status: 'operationnel', last_check: d(t => subDays(t, 30)) },
    { name: 'Pompe à lisier', category: 'pompe', status: 'maintenance', last_check: d(t => subDays(t, 5)) },
  ])

  // Missions
  const { data: missionRows } = await supabase.from('missions').insert([
    { type: 'ramassage', client_id: c1, site_address: '12 Route des Fermes, Saint-Gilles 30800', date: today.toISOString(), duration: 3, team_ids: [e1], vehicle_id: v1, status: 'en_cours', recurrence: 'hebdomadaire', instructions: 'Ramassage des 4 bâtiments. EPI obligatoire.', egg_data: { buildings: 4, estimatedQuantity: 1200, realQuantity: null }, cleaning_data: null, report: null, created_at: d(t => subDays(t, 3)) },
    { type: 'nettoyage_agricole', client_id: c2, site_address: '5 Chemin du Moulin, Vergèze 30310', date: d(t => addDays(t, 1)), duration: 6, team_ids: [e2, e3], vehicle_id: v2, status: 'planifie', recurrence: 'aucune', instructions: 'Nettoyage complet du bâtiment principal.', egg_data: null, cleaning_data: { surface: 800, products: ['Désinfectant Pro', 'Détergent'], checklist: [{ label: 'Pré-rinçage', done: false }, { label: 'Application produit', done: false }, { label: 'Rinçage final', done: false }], photos: [] }, report: null, created_at: d(t => subDays(t, 2)) },
    { type: 'ramassage', client_id: c1, site_address: '12 Route des Fermes, Saint-Gilles 30800', date: d(t => subDays(t, 1)), duration: 3, team_ids: [e1], vehicle_id: v1, status: 'termine', recurrence: 'hebdomadaire', instructions: '', egg_data: { buildings: 4, estimatedQuantity: 1200, realQuantity: 1150 }, cleaning_data: null, report: { realDuration: 3.5, notes: 'Bâtiment 3 légèrement moins productif.', incidents: [], consumables: [] }, created_at: d(t => subDays(t, 10)) },
    { type: 'nettoyage_industriel', client_id: c3, site_address: '88 Zone Industrielle Nord, Nîmes 30000', date: d(t => addDays(t, 3)), duration: 8, team_ids: [e1, e2, e3], vehicle_id: v1, status: 'planifie', recurrence: 'mensuelle', instructions: 'Badge accès requis. Tenue protection niveau 3.', egg_data: null, cleaning_data: { surface: 2500, products: ['Dégraissant industriel', 'Désinfectant'], checklist: [{ label: 'Sécurisation zone', done: false }, { label: 'Dégraissage', done: false }, { label: 'Désinfection', done: false }, { label: 'Rinçage', done: false }], photos: [] }, report: null, created_at: d(t => subDays(t, 5)) },
    { type: 'ramassage', client_id: c1, site_address: '12 Route des Fermes, Saint-Gilles 30800', date: d(t => subDays(t, 7)), duration: 3, team_ids: [e1], vehicle_id: v1, status: 'facture', recurrence: 'hebdomadaire', instructions: '', egg_data: { buildings: 4, estimatedQuantity: 1200, realQuantity: 1180 }, cleaning_data: null, report: { realDuration: 3, notes: '', incidents: [], consumables: [] }, created_at: d(t => subDays(t, 14)) },
  ]).select()
  const [m1, , , , m5] = missionRows.map(r => r.id)

  // Factures
  await supabase.from('invoices').insert([
    { number: 'FAC-2025-001', client_id: c1, mission_id: m5, lines: [{ description: 'Ramassage œufs — EARL Dupont Avicole', quantity: 1, unitPrice: 850, total: 850 }], tax: 20, status: 'payee', due_date: d(t => subDays(t, 20)), paid_at: d(t => subDays(t, 10)), created_at: d(t => subDays(t, 35)) },
    { number: 'FAC-2025-002', client_id: c2, mission_id: null, lines: [{ description: 'Nettoyage bâtiment agricole — GAEC Les Champs Verts', quantity: 1, unitPrice: 1200, total: 1200 }], tax: 20, status: 'en_attente', due_date: d(t => addDays(t, 10)), paid_at: null, created_at: d(t => subDays(t, 20)) },
  ])

  // Paramètres
  await supabase.from('settings').insert({
    company: { name: 'AgriClean SARL', siret: '12345678900012', address: '15 Rue du Commerce, 30000 Nîmes', phone: '04 66 00 11 22', email: 'contact@agriclean.fr', rib: 'FR76 1234 5678 9012 3456 7890 123' },
    default_rates: { ramassage: 68, nettoyage_agricole: 78, nettoyage_industriel: 98, prixM2Agricole: 4.5, prixM2Industriel: 7, tvaDefault: 20 },
    legal_mentions: 'Paiement à 30 jours. Tout retard de paiement entraîne des pénalités de 3 fois le taux légal.',
    invoice_prefix: 'FAC',
    theme: 'light',
    admin_email: 'admin@agriclean.fr',
    admin_password: 'agriclean2025',
    travel_settings: { mode: 'km', ratePerKm: 0.68, freeKm: 0, ratePerHour: 45, flatFee: 35, billableByDefault: true },
  })
}
