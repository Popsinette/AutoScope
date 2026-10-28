# Modèles 3D : import et correspondance des composants

CarView ne dispose pas automatiquement d’un modèle détaillé de chaque voiture. L’explorateur fonctionne avec :

1. **Le véhicule générique de démonstration**, construit en code (`src/components/viewer3d/demo-car.tsx`). Simplifié et **illustratif**, il possède des sous-ensembles séparés (carrosserie, moteur, transmission, freins, suspension, direction, refroidissement, échappement, électronique, habitacle) et active tous les modes.
2. **Un modèle GLB importé** par l’utilisateur pour son véhicule.

Un véhicule sans modèle affiche un état explicite (« Aucun modèle 3D pour ce véhicule ») et ne montre jamais une mécanique inventée.

## Architecture

```
Model3D (PROCEDURAL_DEMO | GLB) ──< ComponentMapping (nodeName → Component) >── Component (fiche)
Vehicle.model3dId ──> Model3D
```

- La scène (`src/components/viewer3d/scene.tsx`) parcourt les objets du modèle. Pour chaque maillage, elle remonte ses parents jusqu’à trouver un nom présent dans la table de correspondance : un groupe « Seat_L » contenant plusieurs maillages est donc associé d’un seul tenant.
- Le véhicule de démonstration utilise exactement ce mécanisme : sa table est définie dans `src/lib/demo-model.ts` et écrite en base par le seed.
- Les modes (`src/lib/viewer-modes.ts`) ne sont proposés que si le modèle contient des objets associés aux familles concernées. Une carrosserie seule n’active ni Transparent, ni Mécanique, ni Électronique, ni Vue éclatée ; la raison est affichée au survol du bouton désactivé.
- Les objets non associés restent visibles (et masquables) mais n’ouvrent pas de fiche.

## Préparer un fichier

- Format **glTF 2.0 binaire (.glb)**, 60 Mo maximum.
- Repère : **Y vers le haut, avant du véhicule vers +Z**, unités en mètres. Les vues Avant/Arrière/Profil/Dessus en dépendent.
- **Pas de compression Draco** : son décodeur serait téléchargé depuis un CDN tiers. Les compressions Meshopt et les textures intégrées sont acceptées. Pour activer Draco, auto-héberger le décodeur et le passer à `useGLTF`.
- Un objet par sous-ensemble, avec un **nom explicite** (`Brake_Disc_FL`, `Engine_Block`, `Battery`…). Les noms sont normalisés comme le fait three.js (espaces → `_`, points supprimés).
- La vue Intérieur n’est proposée que si des objets sont associés à « Sièges » ou « Volant ».
- Vérifiez la licence : seul un modèle dont l’usage est autorisé doit être importé. L’import demande la provenance, la licence et une confirmation.

## Importer

1. Vue 3D → « Importer un modèle » (ou `/vue-3d/import?v=<véhicule>`).
2. Le serveur vérifie la signature `glTF`, la version 2 et lit le bloc JSON pour lister les noms de nœuds (`src/lib/gltf.ts`) sans exécuter le contenu.
3. Écran **Correspondances** : choisir une fiche pour chaque objet. « Suggérer d’après les noms » propose des associations à partir de mots-clés anglais/français (à valider). Enregistrer.
4. Le modèle est servi uniquement au propriétaire via `/api/modeles/<id>`.

Remplacer le fichier crée un nouveau modèle et supprime l’ancien s’il n’est plus utilisé. « Retirer le modèle » revient à l’état sans modèle.

## Ajouter des fiches composants

Les fiches sont dans `prisma/demo-data/components.ts` (slug, famille, système, sous-famille électronique, fonction, description, caractéristiques, fiabilité). Indiquez `reliability: "DOCUMENTEE"` et une source précise uniquement pour une information vérifiable ; sinon `GENERIQUE`. Relancez `npm run db:seed`.

## Remplacer la démonstration par un modèle détaillé

Pour proposer un modèle détaillé à tous les utilisateurs d’un même véhicule, créer un `Model3D` avec `userId = null`, `kind = GLB`, un `storageKey` dans le stockage et ses `ComponentMapping`, puis l’associer aux véhicules concernés. Vérifier au préalable que la licence autorise cette diffusion.
