# Provenance et licences des ressources

## Ressources visuelles

| Ressource | Provenance | Licence |
| --- | --- | --- |
| Véhicule 3D de démonstration | Géométrie générée en code (`src/components/viewer3d/demo-car.tsx`) | Code du projet |
| Silhouette de véhicule (placeholder sans photo) | Dessin SVG du projet (`src/components/brand/car-silhouette.tsx`) | Code du projet |
| Logo « CarView » | Texte stylé en CSS | Code du projet |
| Icônes | [Lucide](https://lucide.dev) | ISC |
| Police Inter | [@fontsource-variable/inter](https://fontsource.org/fonts/inter) (auto-hébergée) | SIL Open Font License 1.1 |
| Environnement d’éclairage 3D | Généré à l’exécution (`Lightformer` de Drei), aucune image HDR téléchargée | — |

Aucune photo de véhicule réel ni marque n’est incluse. Les noms de modèles du jeu de démonstration (Porsche, BMW, Audi) ne servent qu’à reproduire l’esprit des maquettes ; aucune donnée constructeur n’est présentée comme réelle.

## Contenus

- Fiches composants : rédaction CarView, principes généraux de technologie automobile, fiabilité « Générique ». Ordres de grandeur indicatifs ; seule valeur réglementaire citée : profondeur minimale légale des pneus en France (1,6 mm).
- Catalogue de pièces : références génériques de démonstration. Seule compatibilité déclarée : le véhicule fictif « CarView Berline générique ».
- Factures de démonstration : PDF générés par le seed, marqués « DOCUMENT FICTIF ».

## Dépendances principales

Next.js (MIT), React (MIT), Prisma (Apache-2.0), Better Auth (MIT), three.js (MIT), React Three Fiber (MIT), Drei (MIT), camera-controls (MIT), Zod (MIT), Tailwind CSS (MIT), Vitest (MIT), Playwright (Apache-2.0), pg (MIT).
