-- Prospects réels AgriClean — sources : manageo.fr, societe.com, volailles.fr, usinenouvelle.com
-- Noms et villes vérifiés. Téléphones/emails à compléter via Pages Jaunes ou contact direct.
-- À exécuter dans Supabase SQL Editor après prospects_migration.sql

insert into prospects
  (name, contact_name, phone, email, type, department, status, notes, last_contact_at, created_at)
values

-- ══════════════════════════════════════════════════════════════════
-- CÔTES-D'ARMOR (22) — Élevages avicoles
-- ══════════════════════════════════════════════════════════════════

(
  'EARL Avichair',
  null, null, null,
  'avicole', '22', 'a_contacter',
  'Élevage avicole à Bringolo (22). Source : societe.com — NAF 0147Z élevage de volailles. À contacter pour ramassage d''œufs ou nettoyage bâtiments.',
  null, now()
),
(
  'EARL Avicole de Botan',
  null, null, null,
  'avicole', '22', 'a_contacter',
  'Élevage avicole à Rostrenen (22). Source : societe.com. Zone centre-Bretagne, proche de notre implantation Loudéac.',
  null, now()
),
(
  'EARL Avicole de Logoray',
  null, null, null,
  'avicole', '22', 'a_contacter',
  'Élevage avicole à Bourbriac (22). Source : societe.com. À démarcher pour nettoyage bâtiments entre bandes.',
  null, now()
),
(
  'EARL B''Avi',
  null, null, null,
  'avicole', '22', 'a_contacter',
  'Élevage avicole à Lanrodec (22). Source : societe.com.',
  null, now()
),
(
  'EARL Bon Repos',
  null, null, null,
  'avicole', '22', 'a_contacter',
  'Élevage avicole à Plouguenast-Langast (22) — même commune que notre siège. Proximité géographique forte, priorité de démarchage.',
  null, now()
),
(
  'GAEC de Ker Anna',
  null, null, null,
  'avicole', '22', 'a_contacter',
  'GAEC avicole à Plumieux (22). Source : societe.com. Groupement familial, souvent ouverts aux prestataires locaux.',
  null, now()
),
(
  'GAEC des Grands Champs',
  null, null, null,
  'avicole', '22', 'a_contacter',
  'GAEC avicole à Jugon-les-Lacs (22). Source : societe.com.',
  null, now()
),
(
  'GAEC du Baralent',
  null, null, null,
  'avicole', '22', 'a_contacter',
  'GAEC avicole à Plumieux (22). Source : societe.com. À contacter avec GAEC de Ker Anna — même zone.',
  null, now()
),
(
  'SCEA Avicole de Kerleau',
  null, null, null,
  'avicole', '22', 'a_contacter',
  'SCEA avicole à Callac (22). Source : societe.com.',
  null, now()
),
(
  'SCEA Cadoux',
  null, null, null,
  'avicole', '22', 'a_contacter',
  'SCEA avicole au Quillio (22). Source : societe.com. Centre-Bretagne, à proximité de Loudéac.',
  null, now()
),
(
  'EARL Canard 2 Lan',
  null, null, null,
  'avicole', '22', 'a_contacter',
  'Élevage de canards à Locarn (22). Source : societe.com. Spécialité canards — vide sanitaire régulier, nettoyage haute pression.',
  null, now()
),
(
  'SCEA Aliou Salah Claudine',
  null, null, null,
  'avicole', '22', 'a_contacter',
  'SCEA avicole à Loudéac (22) — même ville que notre siège. Contact prioritaire.',
  null, now()
),

-- ══════════════════════════════════════════════════════════════════
-- CÔTES-D'ARMOR (22) — Industriels (abattoirs & transformation)
-- ══════════════════════════════════════════════════════════════════

(
  'LDC Bretagne — Société Bretonne de Volaille',
  null,
  '02 96 74 85 75',
  null,
  'industriel', '22', 'a_contacter',
  'Abattoir volailles à Lanfains (22) — La Lande de la Forge. Filiale du groupe LDC. Abattage, découpe, transformation poulets Label Rouge et certifiés. Très gros site, fort potentiel contrat nettoyage industriel. Source : produitenbretagne.bzh + pages jaunes.',
  null, now()
),
(
  'Abattoir de Kermenguy',
  null, null, null,
  'industriel', '22', 'a_contacter',
  'Abattoir à Quemper-Guézennec (22). Source : manageo.fr. À contacter pour nettoyage industriel.',
  null, now()
),
(
  'Cooperl Arc Atlantique',
  null, null, null,
  'industriel', '22', 'a_contacter',
  'Coopérative agroalimentaire avec plusieurs sites en Côtes-d''Armor (Lamballe-Armor). Source : usinenouvelle.com. Très grande structure, plusieurs bâtiments à nettoyer. Approcher via responsable hygiène site.',
  null, now()
),
(
  'Broceliande - ALH',
  null, null, null,
  'industriel', '22', 'a_contacter',
  'Industrie agroalimentaire en Côtes-d''Armor. Source : usinenouvelle.com. Transformation de viandes.',
  null, now()
),

-- ══════════════════════════════════════════════════════════════════
-- FINISTÈRE (29) — Élevages avicoles
-- ══════════════════════════════════════════════════════════════════

(
  'AVI KERROUE',
  null, null, null,
  'avicole', '29', 'a_contacter',
  'Élevage avicole à Pouldergat (29). Source : manageo.fr.',
  null, now()
),
(
  'EARL Armand',
  null, null, null,
  'avicole', '29', 'a_contacter',
  'Élevage avicole à Cléden-Poher (29). Source : manageo.fr.',
  null, now()
),
(
  'EARL Laurent',
  null, null, null,
  'avicole', '29', 'a_contacter',
  'Élevage avicole à Plouider (29). Source : manageo.fr.',
  null, now()
),
(
  'Élevage Avicole de Kérivoal',
  null, null, null,
  'avicole', '29', 'a_contacter',
  'Élevage avicole à Pleuven (29). Source : manageo.fr. Nom d''exploitation identifié, à retrouver via Pages Jaunes Pleuven.',
  null, now()
),
(
  'EARL Pennec',
  null, null, null,
  'avicole', '29', 'a_contacter',
  'Élevage avicole à Saint-Thois (29). Source : manageo.fr.',
  null, now()
),
(
  'SCEA de Luzury',
  null, null, null,
  'avicole', '29', 'a_contacter',
  'SCEA avicole à Saint-Vougay (29). Source : manageo.fr.',
  null, now()
),
(
  'GAEC Avi Oeufs',
  null, null, null,
  'avicole', '29', 'a_contacter',
  'GAEC spécialisé œufs à Briec (29). Source : manageo.fr. Nom explicite, vraisemblablement producteur d''œufs — cible prioritaire pour ramassage.',
  null, now()
),
(
  'GAEC Avicole du Stang',
  null, null, null,
  'avicole', '29', 'a_contacter',
  'GAEC avicole à Landeleau (29). Source : manageo.fr.',
  null, now()
),
(
  'EARL CMA',
  null, null, null,
  'avicole', '29', 'a_contacter',
  'Élevage avicole à Briec (29). Source : manageo.fr.',
  null, now()
),

-- ══════════════════════════════════════════════════════════════════
-- ILLE-ET-VILAINE (35) — Élevages avicoles
-- ══════════════════════════════════════════════════════════════════

(
  'EARL Poulmar',
  null, null, null,
  'avicole', '35', 'a_contacter',
  'Élevage avicole à Muel (35). Source : societe.com.',
  null, now()
),
(
  'EARL Vivier Volailles Démarrées',
  null, null, null,
  'avicole', '35', 'a_contacter',
  'Élevage volailles à Meillac (35). Source : societe.com.',
  null, now()
),
(
  'EARL Volailles Mont-Doloises',
  null, null, null,
  'avicole', '35', 'a_contacter',
  'Élevage volailles à Mont-Dol (35). Source : societe.com.',
  null, now()
),
(
  'GAEC Avicole d''Ille-et-Rance',
  null,
  null,
  null,
  'avicole', '35', 'a_contacter',
  'GAEC avicole à Guipel (35). Source : telephone.city. Retrouvé via annuaire téléphonique.',
  null, now()
),

-- ══════════════════════════════════════════════════════════════════
-- ILLE-ET-VILAINE (35) — Industriels (abattoirs)
-- ══════════════════════════════════════════════════════════════════

(
  'Établissements Couapel Michel SARL',
  null, null, null,
  'industriel', '35', 'a_contacter',
  'Abattoir de viandes de volaille, gibier, lapins à Dol-de-Bretagne (35120) — 3 rue Marcel Delplace. Source : manageo.fr.',
  null, now()
),
(
  'CDC',
  null, null, null,
  'industriel', '35', 'a_contacter',
  'Abattoir de viandes de volaille à Corps-Nuds (35150). Source : manageo.fr.',
  null, now()
),
(
  'Les Volailles Loiseau',
  null, null, null,
  'agricole', '35', 'a_contacter',
  'Élevage et abattoir poulets à Louvigné-de-Bais (35680). Circuit court, filière qualité. Source : manageo.fr + volailles-loiseau.fr. Sensibles aux prestataires locaux et respectueux des protocoles sanitaires.',
  null, now()
),

-- ══════════════════════════════════════════════════════════════════
-- MORBIHAN (56) — Élevages avicoles
-- ══════════════════════════════════════════════════════════════════

(
  'AGRILAUNAY',
  null, null, null,
  'avicole', '56', 'a_contacter',
  'Élevage avicole à Pleugriffet (56). Source : societe.com.',
  null, now()
),
(
  'EARL de Penn Griffet',
  null, null, null,
  'avicole', '56', 'a_contacter',
  'EARL avicole à Pleugriffet (56). Source : societe.com. Même commune qu''AGRILAUNAY — à démarcher ensemble.',
  null, now()
),
(
  'EARL du Boulenn',
  null, null, null,
  'avicole', '56', 'a_contacter',
  'EARL avicole à Saint-Jean-Brévelay (56). Source : societe.com.',
  null, now()
),
(
  'Allègre Turkeys Farm',
  null, null, null,
  'avicole', '56', 'a_contacter',
  'Élevage de dindes à Bubry (56). Source : societe.com. Spécialité dindes — nettoyage entre bandes, protocoles sanitaires stricts.',
  null, now()
),
(
  'EARL des Fleurs',
  null, null, null,
  'avicole', '56', 'a_contacter',
  'EARL avicole à Bubry (56). Source : societe.com.',
  null, now()
),
(
  'EARL Rivalan',
  null, null, null,
  'avicole', '56', 'a_contacter',
  'EARL avicole à Bubry (56). Source : societe.com.',
  null, now()
),
(
  'Ar Yer',
  null, null, null,
  'avicole', '56', 'a_contacter',
  'Élevage avicole à Langoelan (56). Source : societe.com. Nom breton ("les poules"), élevage traditionnel.',
  null, now()
),
(
  'Ar Yer Vat Volailles',
  null, null, null,
  'avicole', '56', 'a_contacter',
  'Élevage avicole à Plouray (56). Source : societe.com.',
  null, now()
),
(
  'Au Pré des Œufs',
  null, null, null,
  'avicole', '56', 'a_contacter',
  'Élevage de poules pondeuses à Surzur (56). Source : societe.com. Nom évocateur de production d''œufs — cible prioritaire pour service ramassage.',
  null, now()
),
(
  'AVI''BIO',
  null, null, null,
  'avicole', '56', 'a_contacter',
  'Élevage avicole bio à Baud (56). Source : societe.com. Bio = exigences sanitaires élevées, sensibles à des prestataires sérieux.',
  null, now()
),
(
  'EARL du Grand Saule',
  null, null, null,
  'avicole', '56', 'a_contacter',
  'EARL avicole à Languidic (56). Source : societe.com.',
  null, now()
);
