# CarView

Garage numérique pour passionnés d’automobile : véhicules, carnet d’entretien, dépenses, documents, échéances et exploration 3D des composants. Interface entièrement en français (euros, dates françaises, kilomètres).

## Stack

| Domaine | Choix |
| --- | --- |
| Application | Next.js 16 (App Router, Turbopack), React 19, TypeScript 5.9 |
| Interface | Tailwind CSS 4, composants accessibles maison (dialog natif, rôles ARIA), Lucide, police Inter (auto-hébergée) |
| 3D | three.js 0.186, React Three Fiber 9, Drei 10 — chargée à la demande |
| Données | PostgreSQL 16, Prisma 7 (adaptateur `pg`, migrations SQL versionnées) |
| Authentification | Better Auth 1.7 (e-mail + mot de passe, sessions en base, limitation de débit) |
| Fichiers | Interface `FileStorage` + implémentation locale (`STORAGE_DIR`, hors du dossier public) |
| Tests | Vitest 5 (unitaires + intégration sur base dédiée), Playwright 1.63 (desktop + mobile) |

## Installation

Prérequis : Node.js 22, PostgreSQL 14+.

```bash
npm install
```

```bash
cp .env.example .env
```

Renseignez `DATABASE_URL` et un `BETTER_AUTH_SECRET` aléatoire (`openssl rand -base64 32`). Créez ensuite la base, appliquez les migrations et chargez le jeu de démonstration :

```bash
npx prisma migrate deploy
```

```bash
npm run db:seed
```

## Lancement

```bash
npm run dev
```

Ouvrez http://localhost:3000. Compte de démonstration (données **fictives**) : `demo@example.com` / `demo-carview-2026`. Relancer `npm run db:seed` réinitialise uniquement ce compte.

Production :

```bash
npm run build && npm run start
```

## Démo hors ligne (GitHub Pages)

Une version de démonstration **sans serveur** est publiée sur GitHub Pages par le workflow `.github/workflows/deploy-demo.yml` : `https://<compte>.github.io/<nom-du-depot>/` (ici https://popsinette.github.io/AutoScope/). Elle s’ouvre sur ordinateur comme sur téléphone.

- Aucune inscription : le garage de démonstration fictif est préchargé ; tout ce que vous ajoutez reste dans le navigateur (localStorage pour les données, IndexedDB pour les photos, factures et modèles GLB). Rien n’est envoyé sur Internet.
- Mêmes écrans, mêmes validations et mêmes règles métier que l’application complète (une dépense par intervention, échéances date/km, vue 3D, import GLB). Paramètres → « Réinitialiser » ou « Tout effacer ».
- Pas de comptes, pas de synchronisation entre appareils, pas de partage : c’est le rôle de l’application serveur.

Mise en place (une seule fois) : Settings → Pages → Source : « GitHub Actions ». Le déploiement se fait à chaque push sur la branche par défaut du dépôt ; sur les autres branches et les PR, le workflow exécute seulement les tests et le build.

Architecture : `demo/` est une application Vite monopage qui réutilise les vues et composants de `src/` (`src/components/views/*`). Des adaptateurs remplacent `next/link`, `next/navigation` et `next/dynamic` par React Router ; `demo/src/store` reproduit les services serveur sur un stockage local.

```bash
npm run demo:dev
```

```bash
DEMO_BASE=/AutoScope/ npm run demo:build
```

## Tests

Unitaires et intégration (base `carview_test`, migrée automatiquement ; surchargez avec `TEST_DATABASE_URL`) :

```bash
npm test
```

Parcours utilisateurs (nécessite `npm run build` au préalable ; démarre `next start` sur le port 3100, applique les migrations et le seed sur la base de `.env`) :

```bash
npm run test:e2e
```

Parcours de la démo hors ligne (build Vite servi sous `/AutoScope/`, desktop + mobile) :

```bash
npx playwright test -c playwright.demo.config.ts
```

Résultats de la dernière exécution : voir [docs/BILAN.md](docs/BILAN.md).

## Organisation du code

```
prisma/                schéma, migrations, seed et données de démonstration
src/app/(auth)         connexion, inscription
src/app/(app)          écrans authentifiés (tableau de bord, garage, entretiens…)
src/app/actions        server actions (validation zod + appel des services)
src/app/api            fichiers privés, export CSV/JSON, fiches composants, Better Auth
src/server             services métier : chaque requête est filtrée par l'utilisateur
src/lib                logique pure testée (échéances, dépenses, modes 3D, GLB, validation)
src/components/viewer3d explorateur 3D et vitrine d’accueil (scène, studio, fiche, arborescence)
public/models          modèles GLB livrés (« Car Concept », CC BY 4.0) — npm run models:fetch
src/components/views   affichage des écrans, partagé par l'app serveur et la démo
demo/                  démo hors ligne (Vite, React Router, stockage navigateur)
tests/                 Vitest (unit, integration) et Playwright (e2e, e2e-demo)
docs/                  guide 3D, licences, bilan
```

## Sécurité et confidentialité

- Autorisation côté serveur sur chaque ressource : les services (`src/server/*`) ne lisent et n’écrivent qu’à travers le `userId` de la session ; une ressource d’un autre utilisateur répond « introuvable ».
- Validation zod de toutes les saisies côté serveur ; montants en centimes.
- Fichiers contrôlés par signature binaire (PDF, JPEG, PNG, WebP, GLB), taille limitée, servis uniquement par des routes authentifiées avec `Content-Disposition`, `nosniff` et une CSP restrictive.
- VIN, immatriculation et documents privés, masqués à l’écran par défaut ; aucun partage communautaire.
- Export JSON complet et suppression du compte (fichiers compris) depuis Paramètres.
- Aucun secret dans le code : configuration par variables d’environnement (`.env.example`).

## Notifications

Les rappels sont affichés dans l’application (tableau de bord, badge du menu). L’envoi par e-mail ou push n’est pas intégré : l’interface l’indique explicitement. Le point d’intégration est `src/server/notifications.ts`.

## Documentation

- [Modèles 3D : catalogue, ajout d’un modèle dédié, import](docs/MODELES_3D.md)
- [Provenance et licences](docs/LICENCES.md)
- [Bilan : fonctionnel, simulé, à intégrer](docs/BILAN.md)
