# Modèles 3D : catalogue, import et correspondance des composants

CarView n’a pas de modèle détaillé de chaque voiture. Pour chaque véhicule, le modèle affiché (page d’accueil et Vue 3D) est choisi dans cet ordre (`resolveVehicleModel`, `src/lib/vehicle-models.ts`) :

1. **le modèle GLB importé** par l’utilisateur pour ce véhicule ;
2. **le modèle dédié du catalogue** (ex. Porsche 911 GT3 992, Peugeot 106), seulement si son fichier est installé dans `public/models/` (le navigateur vérifie sa présence ; un fichier absent ne casse rien) ;
3. **le modèle de présentation générique** « Car Concept », toujours signalé à l’écran : « Modèle de présentation générique : il ne représente pas votre … ».

`/vue-3d?demo=1` force le modèle de présentation.

## Modèle de présentation livré : « Car Concept »

- Source : [Khronos glTF Sample Assets — CarConcept](https://github.com/KhronosGroup/glTF-Sample-Assets/tree/main/Models/CarConcept), par Eric Chadwick / Darmstadt Graphics Group, licence **CC BY 4.0** (crédit affiché sous la scène et dans `docs/LICENCES.md`).
- Coupé sportif fictif : carrosserie, vitrages, optiques, portières, roues (pneus, jantes, disques, plaquettes), bloc moteur, essieux et habitacle complet (sièges, volant, tableau de bord, pédalier).
- Trois teintes d’origine via l’extension `KHR_materials_variants` (Carmin, Graphite, Nacré).
- `npm run models:fetch` le retélécharge et l’optimise (`scripts/fetch-models.mjs` : meshopt + textures WebP 1024 px, ~2,6 Mo). Les noms d’objets sont conservés.
- Il ne contient **ni transmission détaillée, ni suspensions, ni refroidissement, ni échappement, ni électronique**. CarView y ajoute des **organes illustratifs** (boîtes et tubes simplifiés de `demo-car.tsx`), recalés sur les essieux du modèle, et le signale. Les modes Mécanique, Électronique et Vue éclatée s’appuient donc en partie sur ces organes illustratifs.

## Ajouter le modèle dédié d’un véhicule (ex. Porsche 911 GT3 992, Peugeot 106)

Aucun modèle de ces véhicules sous licence vérifiable n’est livré. Pour en installer un :

1. Trouver un modèle dont la licence autorise votre usage (ex. Sketchfab filtré sur « Downloadable » + CC BY / CC0, ou un modèle acheté). **Vérifier la licence et les droits de marque** : une diffusion publique d’un modèle de marque peut nécessiter un accord.
2. Exporter en **glTF 2.0 binaire (.glb)** : Y vers le haut, **avant du véhicule vers +Z**, mètres, sous-ensembles séparés et nommés. Optimiser si besoin :
   `npx gltf-transform optimize in.glb out.glb --compress meshopt --texture-compress webp --texture-size 2048`
3. Copier le fichier sous le nom attendu par le catalogue : `public/models/porsche-911-gt3-992.glb` ou `public/models/peugeot-106.glb`.
4. Dans `CATALOG_MODELS` (`src/lib/vehicle-models.ts`), renseigner `credit`, `license`, `sourceUrl`, et si nécessaire `rotationY` (si l’avant n’est pas vers +Z), `mapping` (nom d’objet → fiche composant ; sinon association automatique d’après les noms), `paints`/`defaultPaint` (variantes `KHR_materials_variants`).
5. Le modèle est alors utilisé automatiquement pour les véhicules reconnus par `matches` (ex. Porsche + « 911 GT3 » + finition « 992 » ou année ≥ 2021), sans mention « générique ». Pour un nouveau véhicule, ajouter une entrée au catalogue.

## Modèle importé par l’utilisateur

```
Model3D (PROCEDURAL_DEMO | GLB) ──< ComponentMapping (nodeName → Component) >── Component (fiche)
Vehicle.model3dId ──> Model3D
```

1. Vue 3D → « Importer le modèle de ce véhicule » (`/vue-3d/import?v=<véhicule>`). 60 Mo maximum.
2. Le serveur vérifie la signature `glTF`, la version 2 et lit le bloc JSON pour lister les noms de nœuds (`src/lib/gltf.ts`) sans exécuter le contenu. Provenance, licence et confirmation des droits sont demandées.
3. Écran **Correspondances** : une fiche par objet ; « Suggérer d’après les noms » propose des associations (à valider).
4. Le fichier est servi uniquement à son propriétaire (`/api/modeles/<id>`) ; dans la démo hors ligne, il reste dans le navigateur (IndexedDB).

Règles communes :
- **Pas de compression Draco** (décodeur sur un CDN tiers). Meshopt et textures intégrées sont acceptées.
- La scène remonte les parents de chaque maillage jusqu’à un nom présent dans la table : un groupe « Seat_L » est associé d’un seul tenant. Les noms sont normalisés comme three.js (espaces → `_`, points supprimés).
- Les modes (`src/lib/viewer-modes.ts`) ne sont proposés que si le modèle contient des objets des familles concernées ; la raison est affichée sur le bouton désactivé. La vue Intérieur demande des objets « Sièges » ou « Volant ».
- Les objets non associés restent visibles (et masquables) mais n’ouvrent pas de fiche.

## Rendu et interactions

- `src/components/viewer3d/scene.tsx` : studio sombre (éclairage par `Lightformer`, aucune image HDR téléchargée), sol réfléchissant, ombres de contact, tone mapping ACES ; caméra `CameraControls` (rotation 360°, molette/pincement, boutons ±, vues 3/4, avant, arrière, gauche, droite, dessus, intérieur, recentrage sur la pièce, réinitialisation, transitions douces sauf `prefers-reduced-motion`).
- Modes : extérieur, transparent (opacité réglable), mécanique (carrosserie fantôme ou masquée, isolement d’une pièce), électronique (couleur par sous-famille : calculateurs, capteurs, actionneurs, alimentation, faisceaux), vue complète, vue éclatée (sous-ensembles écartés depuis le centre, curseur « Séparation »).
- Qualité réduite automatiquement (sans sol réfléchissant, résolution plafonnée) sur petit écran tactile et en rendu WebGL logiciel. Sans WebGL ou si le fichier est illisible : message explicite, la liste des pièces et les fiches restent accessibles ; la vitrine de l’accueil affiche une silhouette 2D.
- `vehicle-showcase.tsx` : vitrine de la page d’accueil (rotation lente quand elle est à l’écran, au doigt sans bloquer le défilement, clic sur une pièce → fiche en Vue 3D).

## Ajouter des fiches composants

Les fiches sont dans `prisma/demo-data/components.ts` (slug, famille, système, sous-famille électronique, fonction, description, caractéristiques, fiabilité). Indiquez `reliability: "DOCUMENTEE"` et une source précise uniquement pour une information vérifiable ; sinon `GENERIQUE`. Relancez `npm run db:seed`.
