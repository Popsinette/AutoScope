# Provenance et licences des ressources

## Ressources visuelles

| Ressource | Provenance | Licence |
| --- | --- | --- |
| Modèle 3D de présentation « Car Concept » (`public/models/car-concept.glb`, optimisé) | [Khronos glTF Sample Assets](https://github.com/KhronosGroup/glTF-Sample-Assets/tree/main/Models/CarConcept) — Eric Chadwick / Darmstadt Graphics Group | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) — crédit affiché sous chaque scène 3D |
| Organes mécaniques et électroniques illustratifs | Géométrie générée en code (`src/components/viewer3d/demo-car.tsx`) | Code du projet |
| Silhouette de véhicule (placeholder sans photo) | Dessin SVG du projet (`src/components/brand/car-silhouette.tsx`) | Code du projet |
| Logo « CarView » | Texte stylé en CSS | Code du projet |
| Icônes | [Lucide](https://lucide.dev) | ISC |
| Police Inter | [@fontsource-variable/inter](https://fontsource.org/fonts/inter) (auto-hébergée) | SIL Open Font License 1.1 |
| Environnement d’éclairage 3D | Généré à l’exécution (`Lightformer` de Drei), aucune image HDR téléchargée | — |

Aucune photo de véhicule réel n’est incluse. Le modèle « Car Concept » est un véhicule fictif ; ses plaques portent le logo Khronos, marque de The Khronos Group (aucune affiliation ni approbation). Aucun modèle 3D de véhicule de marque n’est livré : les emplacements Porsche 911 GT3 (992) et Peugeot 106 du catalogue attendent un fichier dont la licence aura été vérifiée (voir `docs/MODELES_3D.md`). Les noms de modèles du jeu de démonstration (Porsche, BMW, Audi) ne servent qu’à reproduire l’esprit des maquettes ; aucune donnée constructeur n’est présentée comme réelle.

## Contenus

- Fiches composants : rédaction CarView, principes généraux de technologie automobile, fiabilité « Générique ». Ordres de grandeur indicatifs ; seule valeur réglementaire citée : profondeur minimale légale des pneus en France (1,6 mm).
- Catalogue de pièces : références génériques de démonstration. Seule compatibilité déclarée : le véhicule fictif « CarView Berline générique ».
- Factures de démonstration : PDF générés par le seed, marqués « DOCUMENT FICTIF ».

## Dépendances principales

Next.js (MIT), React (MIT), Prisma (Apache-2.0), Better Auth (MIT), three.js (MIT), React Three Fiber (MIT), Drei (MIT), camera-controls (MIT), Zod (MIT), Tailwind CSS (MIT), Vitest (MIT), Playwright (Apache-2.0), pg (MIT).
