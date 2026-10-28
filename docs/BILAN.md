# Bilan — état du projet CarView

## Résultats des tests (exécution réelle du 28/10/2026)

- `npm run typecheck` : aucune erreur.
- `npm run build` : build de production réussi (33 routes).
- `npm test` (Vitest 5, base PostgreSQL `carview_test`) : **8 fichiers, 43 tests réussis** (dont 5 sur le stockage de la démo hors ligne : jeu préchargé, une dépense par intervention, échéances, relecture des données, cascades, import GLB).
  - `tests/unit/reminders.test.ts` : statuts date/km, double seuil (signalé dès qu’un seuil est atteint), tri, libellés.
  - `tests/unit/expenses.test.ts` : catégories dérivées, totaux, répartition, mois, CSV, saisie des montants.
  - `tests/unit/files.test.ts` : détection par signature, fichier déguisé/vide/trop gros refusé, noms nettoyés.
  - `tests/unit/viewer.test.ts` : apparence par mode, modes indisponibles pour une carrosserie seule, cohérence du modèle de démonstration avec les fiches, lecture/refus de GLB, suggestions.
  - `tests/unit/vehicle-models.test.ts` : association véhicule → modèle du catalogue (Porsche 911 GT3 992 reconnue, 991 refusée), priorité au modèle importé, mention « ne représente pas votre … » sur le modèle générique, chemins des fichiers selon l’hébergement.
  - `tests/unit/validation.test.ts` : véhicule, intervention, échéance (source obligatoire pour une préconisation constructeur).
  - `tests/integration/services.test.ts` : **absence de double comptage** (une dépense par intervention, recalculée, supprimée avec elle, non modifiable directement), filtre par année, kilométrage et échéance de suivi, réalisation d’une échéance, **isolation entre utilisateurs** sur toutes les ressources et l’export.
- `npm run test:e2e` (Playwright 1.63, Chromium + SwiftShader) : **15 tests réussis** (11 desktop 1440×960, 4 mobile Pixel 7).
  - Création de compte, validation serveur, véhicule retrouvé après rechargement (desktop + mobile).
  - Déconnexion, mauvais mot de passe, reconnexion.
  - Entretien avec facture PDF, téléchargement protégé (401 sans session), modification → dépense recalculée (150,50 € → 250,50 €, une seule ligne), kilométrage mis à jour, export CSV (desktop + mobile).
  - Suppression d’une intervention avec boîte de confirmation (annulation puis confirmation).
  - Échéances par date et kilométrage : « À prévoir prochainement », « Dépassé », refus d’une préconisation constructeur sans source, marquage réalisé.
  - Vue 3D : vitrine 3D de l’accueil chargée avec la mention « ne représente pas ce véhicule » puis « Explorer en 3D » (desktop + mobile) ; sélection au clic/toucher dans la scène ; sélection depuis la liste qui révèle la pièce et ouvre sa fiche (desktop + mobile) ; six modes ; curseur d’éclatement et retour ; vues 3/4, avant, arrière, gauche, droite, dessus, intérieur ; zoom ± ; teintes ; masquage de famille.
  - Import GLB, suggestions, correspondances, modes activés selon le contenu, refus d’un faux GLB.
  - Isolation : un second utilisateur reçoit 404 sur véhicule, document, photo, export CSV ; son export ne contient rien de l’autre.
  - Export JSON puis suppression du compte (connexion ensuite refusée).

- `npx playwright test -c playwright.demo.config.ts` (démo compilée servie sous `/AutoScope/`) : **10 tests réussis** (5 desktop, 5 mobile) — jeu préchargé, véhicule conservé après rechargement, entretien avec facture et dépense recalculée, sélection 3D (modèle « Car Concept ») et vue éclatée, vitrine 3D de l’accueil, réinitialisation.

Note : les E2E tournent avec `reducedMotion: "reduce"` (pas de rotation automatique continue de la vitrine sous WebGL logiciel) ; la qualité réduite est activée automatiquement en rendu logiciel.

Note : pour les E2E, la limitation de débit de Better Auth est désactivée par `AUTH_RATE_LIMIT=off` (inscriptions rapides successives) ; elle est active partout ailleurs.

## Ce qui fonctionne

- Authentification e-mail/mot de passe, sessions en base, déconnexion, suppression de compte avec ses fichiers, export JSON.
- Garage : ajout, modification, suppression (confirmation), photo, VIN/immatriculation privés et masqués, notes ; véhicule courant mémorisé.
- Tableau de bord calculé : véhicule, kilométrage, échéance la plus urgente avec progression, échéances, dernières interventions, dépenses de l’année et comparaison à date avec l’année précédente, accès rapides.
- Carnet d’entretien : chronologie et tableau, filtres, recherche, pièces remplacées, coûts, justificatifs, prochaine échéance, notes, liaison aux composants 3D.
- Dépenses : par véhicule ou tous, par année, par catégorie, histogramme mensuel avec info-bulle, répartition, export CSV, dépenses manuelles ; aucune double saisie des entretiens.
- Échéances : date, kilométrage ou les deux ; statuts à venir / prochainement (30 j ou 1 000 km) / dépassé / réalisé ; origine saisie personnelle ou constructeur documentée (source obligatoire) ; réalisation par une intervention ; badge de menu.
- Documents : catégories, rattachement à une intervention, recherche, téléchargement protégé, suppression.
- Accueil : vitrine 3D du véhicule (rotation lente, manipulation au doigt/souris, teintes, clic sur une pièce → fiche), mention du modèle générique, kilométrage et entretien à côté.
- Explorateur 3D : modèle GLB réaliste « Car Concept » (CC BY 4.0) dans un studio sombre (reflets, sol réfléchissant, ombres), rotation, zoom molette/pincement/boutons, déplacement, réinitialisation, vues 3/4/avant/arrière/gauche/droite/dessus/intérieur, opacité de carrosserie réglable, masquage de la carrosserie, isolement d’une pièce, teintes, sélection au clic/toucher, surbrillance, cadrage, arborescence accessible avec recherche, masquage de familles, six modes, légende, vue éclatée, fiche avec interventions et documents liés, source et fiabilité, qualité réduite sur mobile, chargement à la demande, libération des ressources, alternative sans WebGL, respect de `prefers-reduced-motion`.
- Import GLB avec vérification, provenance/licence, table de correspondance éditable.
- Catalogue : familles, recherche, « compatibilité à vérifier » sauf donnée explicite.
- Interface responsive : barre latérale sur ordinateur, navigation inférieure et tiroirs sur mobile ; états de chargement, d’erreur, vides et confirmations.

## Démo hors ligne (GitHub Pages)

Application Vite sans serveur qui réutilise les vues de l’application ; données dans le navigateur (localStorage + IndexedDB), aucun compte, aucune synchronisation. Publiée par `.github/workflows/deploy-demo.yml` après typecheck, tests Vitest (avec PostgreSQL de CI) et build.

## Ce qui est simulé ou illustratif

- Modèle 3D générique « Car Concept » (coupé fictif) affiché pour tous les véhicules sans modèle dédié, clairement signalé ; transmission, suspensions, refroidissement, échappement et électronique sont des organes illustratifs ajoutés par CarView.
- Fiches composants génériques (pas de valeurs constructeur).
- Compte et garage de démonstration, factures PDF fictives, catalogue de références génériques.

## Ce qui reste à intégrer

- Notifications par e-mail et push (point d’intégration `src/server/notifications.ts`, aucun succès simulé).
- Stockage objet de production (implémenter `FileStorage` pour S3/GCS) ; actuellement stockage disque local.
- Modèles 3D dédiés sous licence (emplacements Porsche 911 GT3 992 et Peugeot 106 prêts dans le catalogue, fichiers à fournir : voir `docs/MODELES_3D.md`) et fiches documentées par modèle de véhicule.
- Vérification d’e-mail, réinitialisation de mot de passe, connexions Google/Apple (affichées comme indisponibles).
- Modules Performances (journal manuel), Communauté, Événements, Actualités : pages « en préparation » avec leurs engagements ; aucun contenu factice, aucune télémétrie ni OBD.
- Prise en charge Draco (auto-hébergement du décodeur).
