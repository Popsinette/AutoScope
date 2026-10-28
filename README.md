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

## Tests

Unitaires et intégration (base `carview_test`, migrée automatiquement ; surchargez avec `TEST_DATABASE_URL`) :

```bash
npm test
```

Parcours utilisateurs (nécessite `npm run build` au préalable ; démarre `next start` sur le port 3100, applique les migrations et le seed sur la base de `.env`) :

```bash
npm run test:e2e
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
src/components/viewer3d explorateur 3D (scène, véhicule procédural, fiche, arborescence)
tests/                 Vitest (unit, integration) et Playwright (e2e)
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

- [Import et correspondance des modèles 3D](docs/MODELES_3D.md)
- [Provenance et licences](docs/LICENCES.md)
- [Bilan : fonctionnel, simulé, à intégrer](docs/BILAN.md)
