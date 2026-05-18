# MASTER PROMPT — AgriClean Manager PWA
## Instruction complète pour génération autonome du codebase

---

Tu es un développeur senior React. Tu vas générer la totalité du codebase d'une PWA de gestion d'entreprise appelée **AgriClean Manager**. Tu dois produire tous les fichiers, complets, sans placeholder ni TODO, prêts à être déployés sur Vercel.

---

## CONTEXTE MÉTIER

Application de gestion pour le patron d'une entreprise qui réalise :
1. **Ramassage d'œufs** en exploitations avicoles (tournées régulières par client)
2. **Nettoyage agricole et industriel** (chantiers ponctuels ou récurrents)

L'utilisateur est le manager. Il gère son équipe, ses clients, son planning, ses missions et sa facturation depuis cette app, principalement sur mobile.

---

## STACK TECHNIQUE — OBLIGATOIRE

```
React 18 + Vite 5
Tailwind CSS v3 (CDN via PostCSS)
Zustand (state management)
Dexie.js 3 (IndexedDB — persistance locale, offline)
React Router v6 (SPA routing)
jsPDF + jsPDF-AutoTable (génération PDF factures)
Recharts (graphes dashboard)
Lucide React (icônes)
date-fns (manipulation dates)
vite-plugin-pwa (Workbox — manifest + service worker)
```

**Deploy cible : Vercel**
Inclure `vercel.json` avec rewrite SPA : `{ "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }`

---

## DESIGN SYSTEM

```
Couleurs :
  --primary:     #1a4731  (vert forêt foncé)
  --primary-light: #2d6a4f
  --accent:      #d97706  (ambre)
  --accent-light: #f59e0b
  --bg:          #f8fafc
  --surface:     #ffffff
  --border:      #e2e8f0
  --text:        #0f172a
  --text-muted:  #64748b
  --danger:      #dc2626
  --success:     #16a34a
  --warning:     #d97706

Typographie : DM Sans (Google Fonts) — corps + UI
              DM Mono — chiffres, codes de facture
Radius : rounded-xl partout
Ombres : shadow-sm par défaut, shadow-md au hover
Touch targets : min 44px hauteur sur mobile
```

---

## STRUCTURE DE FICHIERS COMPLÈTE

Générer exactement ces 34 fichiers :

```
vercel.json
vite.config.js
tailwind.config.js
postcss.config.js
index.html
package.json

src/
  main.jsx
  App.jsx

  db/
    db.js

  store/
    useClientStore.js
    useEmployeeStore.js
    useMissionStore.js
    useVehicleStore.js
    useInvoiceStore.js
    useSettingsStore.js

  components/
    layout/
      Layout.jsx
      Sidebar.jsx
      TopBar.jsx
    ui/
      Card.jsx
      Badge.jsx
      Modal.jsx
      StatCard.jsx
      EmptyState.jsx
      SearchInput.jsx

  pages/
    Dashboard.jsx
    clients/
      ClientList.jsx
      ClientDetail.jsx
    team/
      TeamList.jsx
      EmployeeDetail.jsx
    planning/
      Planning.jsx
    missions/
      MissionList.jsx
      MissionDetail.jsx
      MissionForm.jsx
    fleet/
      Fleet.jsx
    invoicing/
      InvoiceList.jsx
      InvoiceDetail.jsx
    Settings.jsx

  utils/
    pdf.js
    formatters.js

public/
  manifest.json
  icons/
    icon-192.png  ← placeholder SVG converti, couleur #1a4731
    icon-512.png  ← placeholder SVG converti, couleur #1a4731
```

---

## SCHÉMA DEXIE (db/db.js)

```javascript
import Dexie from 'dexie'

export const db = new Dexie('AgriCleanDB')

db.version(1).stores({
  clients:   '++id, name, type, status, createdAt',
  employees: '++id, firstName, lastName, role, status',
  missions:  '++id, type, clientId, date, status, createdAt',
  vehicles:  '++id, name, plate, status',
  equipment: '++id, name, category, status',
  invoices:  '++id, number, clientId, missionId, status, dueDate, createdAt',
  quotes:    '++id, clientId, missionId, status, createdAt',
  settings:  '++id',
})
```

Chaque store Zustand utilise Dexie comme source de vérité. Pattern :
```javascript
// Dans chaque store :
const loadX = async () => { const data = await db.x.toArray(); set({ items: data }) }
const addX  = async (item) => { const id = await db.x.add(item); ... }
const updateX = async (id, changes) => { await db.x.update(id, changes); ... }
const deleteX = async (id) => { await db.x.delete(id); ... }
```

---

## DONNÉES DE DÉMONSTRATION

Pré-remplir la DB au premier lancement (si vide) avec :

**3 clients :**
- EARL Dupont Avicole · Type: Élevage avicole · Actif · 4 bâtiments
- GAEC Les Champs Verts · Type: Agricole · Actif
- Abattoir Régional SAS · Type: Industriel · Actif

**4 employés :**
- Thomas Martin · Chauffeur · Permis CE · Actif
- Julie Bernard · Polyvalente · Actif
- Kevin Rousseau · Agent nettoyage · Actif
- Sarah Leclerc · Polyvalente · Congé

**5 missions (mélangées) :**
- Ramassage EARL Dupont — aujourd'hui — En cours — Thomas Martin
- Nettoyage bâtiment GAEC — demain — Planifié — Julie + Kevin
- Ramassage EARL Dupont — hier — Terminé — Thomas Martin
- Nettoyage industriel Abattoir — dans 3 jours — Planifié — équipe complète
- Ramassage EARL Dupont — la semaine dernière — Facturé

**2 factures :**
- FAC-2025-001 · EARL Dupont · 850€ HT · Payée
- FAC-2025-002 · GAEC Les Champs · 1 200€ HT · En attente

---

## MODULES À IMPLÉMENTER

### Dashboard (pages/Dashboard.jsx)
Afficher :
- 4 StatCards : Missions aujourd'hui / Ce mois / CA mois / Heures équipe
- Section "Alertes" : missions sans employé assigné, factures en retard (badge rouge)
- Section "Planning du jour" : liste des missions du jour avec statut coloré
- Graphe Recharts LineChart : CA des 6 derniers mois (2 lignes : ramassage + nettoyage)
- Bouton flottant "+" → modal choix "Nouvelle mission" | "Nouveau client"

### Clients (pages/clients/)
**ClientList.jsx :**
- Tableau/cards avec : nom, type (badge coloré), statut, nb missions, action "Voir"
- Barre de recherche + filtre type + filtre statut
- Bouton "Nouveau client" → modal formulaire complet
- Formulaire client : raison sociale, SIRET, adresse, type, statut, contacts (ajouter N contacts), notes

**ClientDetail.jsx :**
- Header : nom, type, statut, bouton "Modifier" | "Supprimer"
- Tabs : Informations | Contacts | Missions | Documents
- Tab Missions : timeline des missions avec statut et montant facturé
- KPI : total missions, CA total, CA 12 mois

### Équipe (pages/team/)
**TeamList.jsx :**
- Cards employés avec photo initiale (avatar coloré avec initiales), rôle, statut du jour
- Badge disponibilité : Disponible (vert) | En mission (ambre) | Absent (rouge)
- Compteur heures du mois sur chaque card
- Bouton "Nouvel employé"

**EmployeeDetail.jsx :**
- Infos complètes + permis (badges)
- Historique des missions assignées
- Total heures par mois (barchart Recharts)

### Planning (pages/planning/Planning.jsx)
- Vue semaine par défaut, switch vue mois
- Grille CSS des 7 jours de la semaine
- Chaque mission = bloc coloré (🟡 ramassage / 🔵 nettoyage)
- Clic sur bloc → popup détail mission
- Bouton "Semaine précédente / suivante"
- Filtres : tous | ramassage | nettoyage
- Bouton "Nouvelle mission" avec date pré-remplie au clic sur un créneau vide

### Missions (pages/missions/)
**MissionList.jsx :**
- Tabs de statuts : Toutes | Planifié | En cours | Terminé | Facturé
- Cards missions : type (icon), client, date, équipe assignée (avatars), statut
- Recherche + filtres client + filtre période

**MissionForm.jsx :**
Formulaire en étapes (stepper 3 étapes) :
1. **Infos générales** : Type mission, Client (select), Site (adresse), Date + heure, Durée estimée, Récurrence
2. **Équipe & matériel** : Sélection employés (multi-select avec avatars), Véhicule (select), Instructions
3. **Détails spécifiques** :
   - Si Ramassage → Nb bâtiments, quantité estimée (plateaux)
   - Si Nettoyage → Surface (m²), Produits prévus, Check-list protocole (items configurables)

**MissionDetail.jsx :**
- Header : type, client, date, statut avec bouton changer statut
- Section Équipe assignée
- Section Compte-rendu (visible si statut ≥ Terminé) :
  - Durée réelle, Notes, Incidents (liste avec gravité), Quantités réelles
  - Zone upload photos (stockage base64 dans IndexedDB)
- Bouton "Générer facture" si statut = Terminé et pas encore facturé

### Flotte (pages/fleet/Fleet.jsx)
- Tabs : Véhicules | Matériel
- Cards véhicule : immatriculation, type, kilométrage, alertes révision (badge rouge si < 30 jours)
- Cards matériel : nom, catégorie, état (badge coloré)
- CRUD complet pour les deux

### Facturation (pages/invoicing/)
**InvoiceList.jsx :**
- KPIs haut de page : Émises ce mois / Encaissées / En retard
- Tabs : Toutes | En attente | Payées | En retard
- Liste factures : numéro, client, montant HT, TTC, statut, échéance
- Bouton "Relance" sur les factures en retard (ouvre mailto:)

**InvoiceDetail.jsx :**
- Aperçu facture stylé (rendu HTML de la facture)
- Lignes de prestation éditables
- Bouton "Marquer comme payée"
- Bouton "Télécharger PDF" → génère via jsPDF

### Paramètres (pages/Settings.jsx)
Sections :
- Entreprise : nom, SIRET, adresse, tel, email, RIB (stocké en settings)
- Tarifs par défaut : prix/heure ramassage, prix/heure nettoyage, prix/m²
- Facturation : mentions légales, conditions de paiement, préfixe numérotation
- Données : bouton "Exporter toutes les données (JSON)", bouton "Réinitialiser la démo"

---

## GÉNÉRATION PDF (utils/pdf.js)

```javascript
// Utiliser jsPDF + jsPDF-AutoTable
// Fonction : generateInvoicePDF(invoice, client, settings)
// Layout :
//   - En-tête : logo textuel "AgriClean" + infos entreprise (settings)
//   - Infos client (destinataire)
//   - Numéro facture + date + échéance
//   - Tableau lignes (description, quantité, prix unitaire, total HT)
//   - Sous-total HT, TVA (taux%), Total TTC
//   - Pied de page : SIRET, RIB, mentions légales
//   - Couleurs : vert #1a4731 pour les en-têtes de tableau
```

---

## FORMATTERS (utils/formatters.js)

```javascript
export const formatCurrency = (amount) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount)
export const formatDate = (date) => format(new Date(date), 'dd/MM/yyyy', { locale: fr })
export const formatDateTime = (date) => format(new Date(date), 'dd/MM/yyyy HH:mm', { locale: fr })
export const getInitials = (firstName, lastName) => `${firstName[0]}${lastName[0]}`.toUpperCase()
export const getMissionTypeColor = (type) => type === 'ramassage' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
export const getStatusColor = (status) => ({ planifie: 'gray', en_cours: 'blue', termine: 'green', facture: 'purple', paye: 'emerald', annule: 'red' }[status] || 'gray')
```

---

## ROUTING (App.jsx)

```
/                   → Dashboard
/clients            → ClientList
/clients/:id        → ClientDetail
/team               → TeamList
/team/:id           → EmployeeDetail
/planning           → Planning
/missions           → MissionList
/missions/new       → MissionForm (création)
/missions/:id       → MissionDetail
/missions/:id/edit  → MissionForm (édition)
/fleet              → Fleet
/invoicing          → InvoiceList
/invoicing/:id      → InvoiceDetail
/settings           → Settings
```

---

## LAYOUT (components/layout/)

**Sidebar.jsx :**
- Desktop : sidebar fixe 240px gauche avec logo "AgriClean" + nav items icône+label
- Mobile : bottom navigation bar (5 items principaux : Dashboard, Planning, Missions, Clients, Menu)
- Nav items :
  - Dashboard (LayoutDashboard)
  - Planning (CalendarDays)
  - Missions (ClipboardList)
  - Clients (Building2)
  - Équipe (Users)
  - Flotte (Truck)
  - Facturation (FileText)
  - Paramètres (Settings)
- Active state : fond vert primary, texte blanc

**TopBar.jsx :**
- Titre de la page active
- Bouton "+" création rapide (contextuel selon la page)
- Avatar manager initiales

---

## RÈGLES DE QUALITÉ

1. **Aucun placeholder** : tout le code doit être complet et fonctionnel
2. **Pas de TODO** : implémenter chaque feature décrite
3. **Responsive** : mobile-first, testé à 375px et 1280px
4. **Cohérence UI** : utiliser systématiquement les composants ui/ (Card, Badge, Modal...)
5. **Gestion des états vides** : chaque liste doit avoir un `<EmptyState>` avec CTA
6. **Loading states** : skeleton ou spinner pendant les lectures Dexie async
7. **Gestion erreurs** : try/catch sur toutes les opérations DB avec toast d'erreur
8. **Offline** : l'app fonctionne entièrement sans connexion (tout en IndexedDB)
9. **Performance** : lazy loading des pages avec React.lazy + Suspense
10. **Accessibilité** : labels sur tous les inputs, aria-labels sur les boutons icon-only

---

## PWA CONFIG (vite.config.js)

```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/icon-192.png', 'icons/icon-512.png'],
      manifest: {
        name: 'AgriClean Manager',
        short_name: 'AgriClean',
        description: 'Gestion ramassage œufs et nettoyage agricole/industriel',
        theme_color: '#1a4731',
        background_color: '#f8fafc',
        display: 'standalone',
        orientation: 'portrait-primary',
        start_url: '/',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        runtimeCaching: [{
          urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
          handler: 'CacheFirst',
          options: { cacheName: 'google-fonts-cache', expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 } }
        }]
      }
    })
  ],
  server: { historyApiFallback: true }
})
```

---

## VERCEL DEPLOY

**vercel.json :**
```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

**package.json scripts :**
```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  }
}
```

---

## ORDRE DE GÉNÉRATION

Génère les fichiers dans cet ordre précis :
1. `package.json`, `vite.config.js`, `tailwind.config.js`, `postcss.config.js`, `vercel.json`
2. `index.html` (avec import Google Fonts DM Sans + DM Mono)
3. `src/db/db.js` (schéma Dexie complet + seed data)
4. `src/store/*.js` (tous les stores Zustand)
5. `src/utils/formatters.js`, `src/utils/pdf.js`
6. `src/components/ui/*.jsx` (composants partagés)
7. `src/components/layout/*.jsx`
8. `src/App.jsx`, `src/main.jsx`
9. Pages dans l'ordre : Dashboard → Clients → Équipe → Planning → Missions → Flotte → Facturation → Paramètres
10. `public/manifest.json`

---

## INSTRUCTION FINALE

Génère TOUS les fichiers listés, complets, dans l'ordre indiqué. Pour chaque fichier, commence par une ligne `// === NOM_DU_FICHIER ===` puis le code complet. Ne t'arrête pas entre les fichiers. Ne résume pas. Ne saute pas de fichier. Le résultat doit être directement copiable dans un projet Vite et déployable sur Vercel avec `npm install && npm run build`.
