/**
 * Lecture minimale d'un fichier GLB (glTF 2.0 binaire) côté serveur :
 * validation de l'en-tête et extraction des noms de nœuds, sans exécuter
 * ni charger les ressources du fichier.
 */
const GLB_MAGIC = 0x46546c67; // "glTF"
const CHUNK_JSON = 0x4e4f534a; // "JSON"

export type GlbInspection =
  | { ok: true; nodeNames: string[]; meshCount: number; generator: string | null }
  | { ok: false; error: string };

export function inspectGlb(bytes: Uint8Array): GlbInspection {
  if (bytes.byteLength < 20) return { ok: false, error: "Fichier GLB trop court." };
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (view.getUint32(0, true) !== GLB_MAGIC) return { ok: false, error: "Ce fichier n’est pas un GLB valide." };
  const version = view.getUint32(4, true);
  if (version !== 2) return { ok: false, error: `Version glTF ${version} non prise en charge (2 attendue).` };
  const declared = view.getUint32(8, true);
  if (declared > bytes.byteLength) return { ok: false, error: "Fichier GLB tronqué." };
  const chunkLength = view.getUint32(12, true);
  const chunkType = view.getUint32(16, true);
  if (chunkType !== CHUNK_JSON || 20 + chunkLength > bytes.byteLength) return { ok: false, error: "Bloc JSON du GLB introuvable." };
  let json: { nodes?: { name?: unknown; mesh?: unknown }[]; meshes?: unknown[]; asset?: { generator?: unknown; version?: unknown } };
  try {
    json = JSON.parse(new TextDecoder().decode(bytes.subarray(20, 20 + chunkLength)));
  } catch {
    return { ok: false, error: "Bloc JSON du GLB illisible." };
  }
  if (!json.asset || String(json.asset.version ?? "").split(".")[0] !== "2") return { ok: false, error: "Métadonnées glTF invalides." };
  const names = new Set<string>();
  for (const node of json.nodes ?? []) {
    if (typeof node.name === "string" && node.name.trim() !== "") names.add(node.name.trim().slice(0, 200));
    if (names.size >= 2000) break;
  }
  return {
    ok: true,
    nodeNames: [...names],
    meshCount: Array.isArray(json.meshes) ? json.meshes.length : 0,
    generator: typeof json.asset.generator === "string" ? json.asset.generator.slice(0, 200) : null,
  };
}

/** Normalisation des noms de nœuds telle que la pratique three.js (espaces, points retirés). */
export function sanitizeNodeName(name: string) {
  return name.replace(/\s/g, "_").replace(/[\[\]\.:\/]/g, "");
}

const KEYWORDS: [RegExp, string][] = [
  [/steering.?rack|cremaill/i, "cremaillere"],
  [/steering.?wheel|volant/i, "volant"],
  [/steering/i, "colonne-direction"],
  [/speed.?sensor|wheel.?sensor/i, "capteurs-vitesse-roue"],
  [/brake.?disc|rotor|disque/i, "disques-frein"],
  [/caliper|etrier|étrier/i, "etriers-frein"],
  [/tire|tyre|pneu/i, "pneumatiques"],
  [/rim|wheel|jante|roue/i, "jantes"],
  [/engine|motor|moteur|block/i, "bloc-moteur"],
  [/intake|air.?filter|admission/i, "admission"],
  [/gear.?box|transmission|boite/i, "boite-de-vitesses"],
  [/drive.?shaft|prop.?shaft|cardan/i, "arbre-de-transmission"],
  [/diff/i, "differentiel"],
  [/shock|damper|strut|amorti|spring|ressort/i, "amortisseurs"],
  [/wishbone|control.?arm|triangle/i, "triangles"],
  [/radiator|radiateur/i, "radiateur"],
  [/hose|durite/i, "durites"],
  [/muffler|silencer|silencieux/i, "silencieux"],
  [/exhaust|echapp/i, "ligne-echappement"],
  [/ecu|calculat/i, "calculateur-moteur"],
  [/abs|esp/i, "module-abs"],
  [/battery|batterie/i, "batterie"],
  [/alternator|alternateur/i, "alternateur"],
  [/harness|wire|wiring|cable|faisceau/i, "faisceau-principal"],
  [/lambda|o2.?sensor/i, "sonde-lambda"],
  [/injector|injecteur/i, "injecteurs"],
  [/starter|demarreur/i, "demarreur"],
  [/seat|siege|siège/i, "sieges"],
  [/dash/i, "tableau-de-bord"],
  [/head.?light|headlamp|phare|optique/i, "optiques-avant"],
  [/tail.?light|rear.?light|feu/i, "feux-arriere"],
  [/spoiler|wing|aileron/i, "aileron"],
  [/bumper.*(rear|back)|(rear|back).*bumper/i, "pare-chocs-arriere"],
  [/bumper|pare.?choc/i, "pare-chocs-avant"],
  [/hood|bonnet|capot/i, "capot"],
  [/door|porti/i, "portieres"],
  [/glass|window|windshield|vitr/i, "vitrage"],
  [/body|chassis|shell|caisse|roof/i, "caisse"],
];

/** Suggestion de fiche pour un nom de nœud (l'utilisateur valide toujours). */
export function suggestComponentSlug(nodeName: string): string | null {
  for (const [re, slug] of KEYWORDS) if (re.test(nodeName)) return slug;
  return null;
}
