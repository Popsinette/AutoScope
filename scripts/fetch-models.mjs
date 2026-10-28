/**
 * Récupère et optimise les modèles 3D libres utilisés par CarView.
 * Usage : node scripts/fetch-models.mjs
 *
 * Seuls des modèles à licence vérifiée sont listés ici. Les modèles de
 * véhicules précis (ex. Porsche 911 GT3 992) ne sont pas téléchargés
 * automatiquement : voir docs/MODELES_3D.md.
 */
import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

const MODELS = [
  {
    out: "public/models/car-concept.glb",
    url: "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/CarConcept/glTF-Binary/CarConcept.glb",
    license: "CC-BY-4.0 — Eric Chadwick / Darmstadt Graphics Group (Khronos glTF-Sample-Assets)",
  },
];

const dir = mkdtempSync(path.join(tmpdir(), "carview-models-"));
for (const m of MODELS) {
  const raw = path.join(dir, path.basename(m.out));
  const res = await fetch(m.url);
  if (!res.ok) throw new Error(`${m.url} : HTTP ${res.status}`);
  writeFileSync(raw, Buffer.from(await res.arrayBuffer()));
  // Textures WebP 1024 px + Meshopt ; noms et séparation des pièces conservés.
  execFileSync(
    "npx",
    ["gltf-transform", "optimize", raw, m.out, "--compress", "meshopt", "--texture-compress", "webp", "--texture-size", "1024", "--join", "false", "--flatten", "false", "--instance", "false", "--palette", "false", "--simplify", "false"],
    { stdio: "inherit" },
  );
  console.log(`${m.out} prêt (${m.license})`);
}
