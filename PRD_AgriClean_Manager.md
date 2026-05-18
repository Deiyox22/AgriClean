# PRD — AgriClean Manager
### App de gestion · Ramassage d'œufs avicole & Nettoyage agricole/industriel
**Version** : 1.0 · **Stack** : PWA (React 18 + Vite + Tailwind + Zustand + Dexie.js) · **Deploy** : Vercel

---

## 1. Contexte & Objectif

AgriClean Manager est une PWA mobile-first destinée au **patron/manager** d'une entreprise proposant deux activités :
1. **Ramassage d'œufs** en exploitations avicoles (tournées régulières)
2. **Nettoyage agricole et industriel** (chantiers ponctuels ou récurrents)

L'objectif est de centraliser la gestion de l'équipe, des clients, du planning, des missions et de la facturation dans une seule application installable sur mobile et desktop, fonctionnant partiellement hors ligne.

---

## 2. Utilisateurs

| Rôle | Description |
|---|---|
| **Manager / Patron** | Utilisateur principal. Accès complet à tous les modules. |
| **Employé** *(v2)* | Vue planning personnel + compte-rendu de mission uniquement. |

MVP : un seul rôle (manager). Multi-utilisateurs en v2.

---

## 3. Modules & Fonctionnalités

### 3.1 Dashboard
**Objectif** : Vue d'ensemble instantanée de l'activité.

- Cartes KPI du jour : missions planifiées, en cours, terminées
- KPI du mois : CA facturé, CA encaissé, heures équipe totales
- Liste "À faire aujourd'hui" : missions sans assignation, factures en retard, relances à envoyer
- Graphe : évolution CA sur 6 mois (ramassage vs nettoyage)
- Météo locale (widget, utile pour planification chantiers extérieurs)

---

### 3.2 Clients
**Objectif** : CRM léger centré sur les entreprises clientes.

#### Fiche Client
- Raison sociale, SIRET, adresse complète
- Type : `Élevage avicole` | `Agricole` | `Industriel` | `Mixte`
- Statut : `Actif` | `Inactif` | `Prospect`
- **Contacts multiples** : nom, fonction, téléphone, email, contact privilégié (✓)
- Notes libres
- Documents attachés (PDF/photos) : contrats, plans de bâtiments, fiches de sécurité

#### Vue Clients
- Liste searchable + filtres (type, statut, département)
- Tri par dernière intervention ou CA

#### Onglet Historique (dans fiche client)
- Timeline de toutes les missions passées
- Total facturé au client (all time et 12 mois glissants)

---

### 3.3 Équipe
**Objectif** : Gérer les ressources humaines opérationnelles.

#### Fiche Employé
- Prénom, nom, photo (optionnelle)
- Rôle : `Chauffeur` | `Agent de nettoyage` | `Polyvalent`
- Téléphone, email
- Permis : `B` | `C` | `CE` | `CACES` (cases à cocher)
- Disponibilités récurrentes (jours travaillés)
- Notes (ex : "Ne peut pas conduire le camion citerne")
- Statut : `Actif` | `Congé` | `Arrêt`

#### Vue Équipe
- Liste avec statut du jour (disponible / en mission / absent)
- Indicateur charge mensuelle (heures assignées vs heures contractuelles)

#### Suivi des heures *(simplifié MVP)*
- Saisie manuelle des heures par mission (validée par le manager)
- Total heures / employé / mois exportable

---

### 3.4 Planning
**Objectif** : Visualiser et organiser toutes les interventions.

- **Vue Semaine** (défaut) et **Vue Mois**
- Couleur par type : 🟡 Ramassage · 🔵 Nettoyage
- Couleur par statut : ⬜ Planifié · 🟠 En cours · ✅ Terminé · 🔴 Annulé
- Clic sur un créneau → détail de la mission (popup)
- **Filtres** : par employé, par client, par type d'activité
- Bouton "Nouvelle mission" directement depuis le planning (date pré-remplie)
- Drag & drop pour déplacer une mission *(si faisable sans lib lourde)*

---

### 3.5 Missions
**Objectif** : Cœur opérationnel de l'app. Couvre les deux types d'activité.

#### Création de mission
- Type : `Ramassage d'œufs` | `Nettoyage agricole` | `Nettoyage industriel`
- Client (sélection depuis CRM)
- Site d'intervention (adresse, peut différer de l'adresse client)
- Date + heure de début + durée estimée
- Équipe assignée (sélection multi-employés)
- Véhicule assigné (sélection depuis flotte)
- Instructions spécifiques (champ texte libre)
- Documents joints (fiche de sécurité, plan de bâtiment)
- Récurrence : `Aucune` | `Hebdomadaire` | `Bimensuelle` | `Mensuelle`

#### Champs spécifiques Ramassage
- Nombre de bâtiments / cages
- Quantité estimée (plateaux ou unités)
- Quantité réelle collectée (saisie post-mission)

#### Champs spécifiques Nettoyage
- Surface estimée (m²)
- Produits prévus (liste consommables)
- Check-list de protocole (étapes à valider)
- Photos avant/après (upload depuis mobile)

#### Statuts de mission
`Planifié` → `En cours` → `Terminé` → `Facturé` → `Payé`

#### Compte-rendu (post-mission)
- Durée réelle
- Notes d'intervention
- Incidents signalés (champ + gravité : Info / Attention / Urgent)
- Quantités réelles (ramassage) ou surfaces traitées (nettoyage)
- Consommables utilisés (quantités)
- Photos jointes
- Validation manager (bouton "Clôturer la mission")

#### Vue Missions
- Liste avec filtres : statut, type, client, employé, période
- Tri par date
- Recherche full-text

---

### 3.6 Flotte & Matériel
**Objectif** : Suivi simple des véhicules et équipements.

#### Véhicules
- Nom/immatriculation, type (camion, utilitaire, tracteur...)
- Kilométrage actuel
- Date prochaine révision + contrôle technique
- Alertes automatiques (révision dans < 30 jours)
- Historique des missions associées

#### Matériel de nettoyage
- Nom, catégorie (haute pression, aspirateur industriel, pompe...)
- État : `Opérationnel` | `En maintenance` | `Hors service`
- Date dernier contrôle

---

### 3.7 Facturation
**Objectif** : Générer et suivre devis et factures depuis les missions.

#### Devis
- Généré depuis une mission planifiée
- Lignes de prestation pré-remplies (type mission → tarif par défaut configurable)
- Ajout/suppression de lignes, modification prix
- TVA (taux configurable : 0%, 10%, 20%)
- Envoi par email (mailto:) ou export PDF
- Statuts : `Brouillon` | `Envoyé` | `Accepté` | `Refusé`

#### Factures
- Générée depuis une mission terminée (ou depuis un devis accepté)
- Numérotation automatique (ex : FAC-2025-001)
- Mentions légales configurables (SIRET, RCS, conditions de paiement)
- Export PDF
- Statuts : `Émise` | `En attente` | `Payée` | `Relance 1` | `Relance 2` | `Litige`
- Date d'échéance + alertes automatiques (J+30, J+60)

#### Vue Facturation
- Dashboard financier : total émis, encaissé, en retard (par mois)
- Liste filtrable par statut, client, période
- Bouton relance rapide (ouvre mailto: avec template pré-rempli)

---

### 3.8 Paramètres
- Informations de l'entreprise (nom, logo, SIRET, adresse, RIB)
- Tarifs par défaut par type de prestation
- Templates de facture (mentions légales, conditions de paiement)
- Gestion des types de consommables
- Export global des données (JSON backup)
- Thème : clair / sombre

---

## 4. Architecture Technique

### Stack
| Couche | Technologie |
|---|---|
| Framework | React 18 + Vite |
| Styling | Tailwind CSS v3 |
| State global | Zustand |
| Base de données locale | Dexie.js (IndexedDB) |
| Routing | React Router v6 |
| PDF | jsPDF + jsPDF-AutoTable |
| Charts | Recharts |
| Icons | Lucide React |
| Dates | date-fns |
| PWA | vite-plugin-pwa (Workbox) |
| Deploy | Vercel |

### Structure des fichiers (34 fichiers cible)
```
/
├── public/
│   ├── manifest.json
│   └── icons/ (192x192, 512x512)
├── src/
│   ├── main.jsx
│   ├── App.jsx
│   ├── db/
│   │   └── db.js                  # Dexie schema (toutes les tables)
│   ├── store/
│   │   ├── useClientStore.js
│   │   ├── useEmployeeStore.js
│   │   ├── useMissionStore.js
│   │   ├── useInvoiceStore.js
│   │   └── useSettingsStore.js
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Layout.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   └── TopBar.jsx
│   │   └── ui/
│   │       ├── Card.jsx
│   │       ├── Badge.jsx
│   │       ├── Modal.jsx
│   │       ├── Table.jsx
│   │       └── EmptyState.jsx
│   ├── pages/
│   │   ├── Dashboard.jsx
│   │   ├── clients/
│   │   │   ├── ClientList.jsx
│   │   │   └── ClientDetail.jsx
│   │   ├── team/
│   │   │   ├── TeamList.jsx
│   │   │   └── EmployeeDetail.jsx
│   │   ├── planning/
│   │   │   └── Planning.jsx
│   │   ├── missions/
│   │   │   ├── MissionList.jsx
│   │   │   ├── MissionDetail.jsx
│   │   │   └── MissionForm.jsx
│   │   ├── fleet/
│   │   │   └── Fleet.jsx
│   │   ├── invoicing/
│   │   │   ├── InvoiceList.jsx
│   │   │   └── InvoiceDetail.jsx
│   │   └── Settings.jsx
│   └── utils/
│       ├── pdf.js                 # Génération PDF factures
│       └── formatters.js
├── vite.config.js
└── tailwind.config.js
```

### Schéma de données (Dexie / IndexedDB)

```javascript
// Tables principales
clients:        { id, name, siret, type, status, address, contacts[], notes, documents[], createdAt }
employees:      { id, firstName, lastName, role, phone, email, licenses[], availability, status, notes }
missions:       { id, type, clientId, siteAddress, date, duration, teamIds[], vehicleId, status,
                  recurrence, instructions, eggData{}, cleaningData{}, report{}, createdAt }
vehicles:       { id, name, plate, type, mileage, nextService, nextCT, status }
equipment:      { id, name, category, status, lastCheck }
invoices:       { id, number, missionId, clientId, lines[], tax, status, dueDate, paidAt, createdAt }
quotes:         { id, missionId, clientId, lines[], tax, status, createdAt }
settings:       { id, company{}, defaultRates{}, legalMentions, theme }
```

---

## 5. Règles PWA

```javascript
// vite.config.js — SPA rewrite rules
server: { historyApiFallback: true }

// vite-plugin-pwa config
manifest: {
  name: "AgriClean Manager",
  short_name: "AgriClean",
  display: "standalone",
  orientation: "portrait-primary",
  theme_color: "#1a4731",
  background_color: "#f8fafc"
}

// vercel.json — SPA rewrites
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

---

## 6. Design System

- **Palette** : Vert forêt foncé `#1a4731` (primary) · Ambre `#d97706` (accent) · Gris slate (neutres)
- **Typographie** : `DM Sans` (UI) + `DM Mono` (chiffres/codes)
- **Rayon** : `rounded-xl` partout · Ombres douces
- **Mobile-first** : sidebar collapsible, touch targets ≥ 44px, saisie numérique optimisée

---

## 7. Roadmap MVP (Sprints)

| Sprint | Contenu | Durée estimée |
|---|---|---|
| S1 | Setup projet, Dexie schema, Layout + routing | 1 jour |
| S2 | Module Clients (liste + fiche + CRUD) | 1 jour |
| S3 | Module Équipe (liste + fiche + CRUD) | 1 jour |
| S4 | Module Missions (formulaire + liste + détail) | 2 jours |
| S5 | Planning (vue calendrier + filtres) | 1,5 jour |
| S6 | Dashboard (KPIs + graphes + alertes) | 1 jour |
| S7 | Facturation (factures + PDF) | 1,5 jour |
| S8 | Flotte & Matériel | 0,5 jour |
| S9 | Paramètres + PWA manifest + Vercel deploy | 0,5 jour |
| S10 | QA mobile, offline testing, polish | 1 jour |

**Total estimé : ~11 jours de dev**

---

## 8. Hors scope MVP (v2)
- Espace employé (app secondaire ou rôle séparé)
- Notifications push (rappels de mission)
- Synchronisation cloud multi-device (Supabase ou Firebase)
- Intégration comptable (export FEC, connecteur Pennylane)
- Géolocalisation des sites sur carte
- Signature électronique des bons de livraison
