# Bilan — état du projet CarView

## Résultats des tests (exécution réelle du 28/10/2026)

- `npm run typecheck` : aucune erreur.
- `npm run build` : build de production réussi (33 routes).
- `npm test` (Vitest 5, base PostgreSQL `carview_test`) : **6 fichiers, 33 tests réussis**.
  - `tests/unit/reminders.test.ts` : statuts date/km, double seuil (signalé dès qu’un seuil est atteint), tri, libellés.
  - `tests/unit/expenses.test.ts` : catégories dérivées, totaux, répartition, mois, CSV, saisie des montants.
  - `tests/unit/files.test.ts` : détection par signature, fichier déguisé/vide/trop gros refusé, noms nettoyés.
  - `tests/unit/viewer.test.ts` : apparence par mode, modes indisponibles pour une carrosserie seule, cohérence du modèle de démonstration avec les fiches, lecture/refus de GLB, suggestions.
  - `tests/unit/validation.test.ts` : véhicule, intervention, échéance (source obligatoire pour une préconisation constructeur).
  - `tests/integration/services.test.ts` : **absence de double comptage** (une dépense par intervention, recalculée, supprimée avec elle, non modifiable directement), filtre par année, kilométrage et échéance de suivi, réalisation d’une échéance, **isolation entre utilisateurs** sur toutes les ressources et l’export.
- `npm run test:e2e` (Playwright 1.63, Chromium + SwiftShader) : **15 tests réussis** (11 desktop 1440×960, 4 mobile Pixel 7).
  - Création de compte, validation serveur, véhicule retrouvé après rechargement (desktop + mobile).
  - Déconnexion, mauvais mot de passe, reconnexion.
  - Entretien avec facture PDF, téléchargement protégé (401 sans session), modification → dépense recalculée (150,50 € → 250,50 €, une seule ligne), kilométrage mis à jour, export CSV (desktop + mobile).
  - Suppression d’une intervention avec boîte de confirmation (annulation puis confirmation).
  - Échéances par date et kilométrage : « À prévoir prochainement », « Dépassé », refus d’une préconisation constructeur sans source, marquage réalisé.
  - Vue 3D : état explicite sans modèle ; sélection au clic/toucher dans la scène ; sélection depuis la liste qui révèle la pièce et ouvre sa fiche (desktop + mobile) ; six modes ; curseur d’éclatement et retour ; vues caméra ; masquage de famille.
  - Import GLB, suggestions, correspondances, modes activés selon le contenu, refus d’un faux GLB.
  - Isolation : un second utilisateur reçoit 404 sur véhicule, document, photo, export CSV ; son export ne contient rien de l’autre.
  - Export JSON puis suppression du compte (connexion ensuite refusée).

Note : pour les E2E, la limitation de débit de Better Auth est désactivée par `AUTH_RATE_LIMIT=off` (inscriptions rapides successives) ; elle est active partout ailleurs.

## Ce qui fonctionne

- Authentification e-mail/mot de passe, sessions en base, déconnexion, suppression de compte avec ses fichiers, export JSON.
- Garage : ajout, modification, suppression (confirmation), photo, VIN/immatriculation privés et masqués, notes ; véhicule courant mémorisé.
- Tableau de bord calculé : véhicule, kilométrage, échéance la plus urgente avec progression, échéances, dernières interventions, dépenses de l’année et comparaison à date avec l’année précédente, accès rapides.
- Carnet d’entretien : chronologie et tableau, filtres, recherche, pièces remplacées, coûts, justificatifs, prochaine échéance, notes, liaison aux composants 3D.
- Dépenses : par véhicule ou tous, par année, par catégorie, histogramme mensuel avec info-bulle, répartition, export CSV, dépenses manuelles ; aucune double saisie des entretiens.
- Échéances : date, kilométrage ou les deux ; statuts à venir / prochainement (30 j ou 1 000 km) / dépassé / réalisé ; origine saisie personnelle ou constructeur documentée (source obligatoire) ; réalisation par une intervention ; badge de menu.
- Documents : catégories, rattachement à une intervention, recherche, téléchargement protégé, suppression.
- Explorateur 3D : rotation, zoom, déplacement, réinitialisation, vues avant/arrière/profil/dessus/intérieur, sélection au clic/toucher, surbrillance, cadrage, arborescence accessible avec recherche, masquage de familles, six modes, légende, vue éclatée, fiche avec interventions et documents liés, source et fiabilité, qualité réduite sur mobile, chargement à la demande, libération des ressources, alternative sans WebGL, respect de `prefers-reduced-motion`.
- Import GLB avec vérification, provenance/licence, table de correspondance éditable.
- Catalogue : familles, recherche, « compatibilité à vérifier » sauf donnée explicite.
- Interface responsive : barre latérale sur ordinateur, navigation inférieure et tiroirs sur mobile ; états de chargement, d’erreur, vides et confirmations.

## Ce qui est simulé ou illustratif

- Véhicule 3D générique (forme et emplacements simplifiés), clairement signalé.
- Fiches composants génériques (pas de valeurs constructeur).
- Compte et garage de démonstration, factures PDF fictives, catalogue de références génériques.

## Ce qui reste à intégrer

- Notifications par e-mail et push (point d’intégration `src/server/notifications.ts`, aucun succès simulé).
- Stockage objet de production (implémenter `FileStorage` pour S3/GCS) ; actuellement stockage disque local.
- Modèles 3D détaillés sous licence et fiches documentées par modèle de véhicule.
- Vérification d’e-mail, réinitialisation de mot de passe, connexions Google/Apple (affichées comme indisponibles).
- Modules Performances (journal manuel), Communauté, Événements, Actualités : pages « en préparation » avec leurs engagements ; aucun contenu factice, aucune télémétrie ni OBD.
- Prise en charge Draco (auto-hébergement du décodeur).
