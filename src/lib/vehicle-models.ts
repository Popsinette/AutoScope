/**
 * Catalogue des modèles 3D intégrés et association véhicule → modèle.
 *
 * Ordre de résolution (voir resolveVehicleModel) :
 *  1. modèle GLB importé par l'utilisateur pour ce véhicule ;
 *  2. modèle dédié du catalogue (ex. Porsche 911 GT3 992), s'il est installé
 *     dans public/models (vérifié à l'exécution, voir useInstalledModel) ;
 *  3. modèle de présentation générique, signalé comme tel à l'écran.
 *
 * Aucun modèle n'est présenté comme fidèle à un véhicule qu'il ne représente pas.
 */
import type { ExplorerModel } from "@/components/viewer3d/types";
import { DEMO_NODE_MAPPING } from "./demo-model";

let assetBase = "/";
/** Préfixe des fichiers statiques (« / » pour Next.js, BASE_URL de Vite pour la démo). */
export function setAssetBase(base: string) {
  assetBase = base.endsWith("/") ? base : `${base}/`;
}
export const assetUrl = (relative: string) => `${assetBase}${relative.replace(/^\//, "")}`;

/**
 * Organes illustratifs CarView ajoutés au modèle générique, qui n'en contient pas :
 * transmission, suspension, direction, refroidissement, échappement, électronique.
 * Ils sont recalés sur les essieux du modèle et signalés comme illustratifs.
 */
export const CONCEPT_OVERLAY_NODES = [
  "Gearbox",
  "Driveshaft",
  "Differential",
  "Radiator",
  "Coolant_Hose_Upper",
  "Coolant_Hose_Lower",
  "Exhaust_Pipe",
  "Muffler",
  "Steering_Rack",
  "ECU",
  "ABS_Module",
  "Battery",
  "Alternator",
  "Starter",
  "Lambda_Sensor",
  "Harness_Main",
  "Harness_Rear",
  "Harness_Wheels",
  ...["FL", "FR", "RL", "RR"].flatMap((w) => [`Damper_${w}`, `Wishbone_${w}`, `WheelSpeed_Sensor_${w}`]),
];

const wheels = (side: string) => ({
  [`Wheel${side}`]: "pneumatiques",
  [`Wheel${side}Rim`]: "jantes",
  [`Wheel${side}BrakeDisc`]: "disques-frein",
  [`Wheel${side}BrakePad`]: "etriers-frein",
});

const door = (side: "L" | "R") => ({
  [`BodyDoor${side}Color1`]: "portieres",
  [`BodyDoor${side}Window`]: "vitrage",
  ...Object.fromEntries([1, 2, 3, 4, 5, 6].map((n) => [`InteriorDoor${side}0${n}`, "garnitures"])),
});

/** Correspondance des objets du modèle « Car Concept » (Khronos) avec les fiches. */
const CONCEPT_MAPPING: Record<string, string> = {
  BodyUnderside: "caisse",
  BodyRoofPanel: "caisse",
  BodyPillars: "caisse",
  BodyPanelsColor2: "caisse",
  BodyRearPanelsColor1: "caisse",
  BodyWindshield: "vitrage",
  BodyRearwindow: "vitrage",
  BodyWindowsRearSides: "vitrage",
  BodyHood: "capot",
  BodyHeadlights: "optiques-avant",
  BodyTaillights: "feux-arriere",
  BodyTaillightsPanels: "feux-arriere",
  BodyTurnsignalsRear: "feux-arriere",
  Engine: "bloc-moteur",
  Axles: "arbre-de-transmission",
  ...door("L"),
  ...door("R"),
  ...wheels("FrontL"),
  ...wheels("FrontR"),
  ...wheels("RearL"),
  ...wheels("RearR"),
  InteriorSeatsColor1: "sieges",
  InteriorSeatsColor2: "sieges",
  InteriorSeatsFrame1: "sieges",
  InteriorSeatsFrame2: "sieges",
  InteriorSteeringCylinder: "volant",
  InteriorSteeringBase: "colonne-direction",
  InteriorSteeringDashColumn: "colonne-direction",
  InteriorSteeringDash: "tableau-de-bord",
  InteriorSteeringHandleL: "volant",
  InteriorSteeringHandleR: "volant",
  InteriorDashMid: "tableau-de-bord",
  InteriorDashSides: "tableau-de-bord",
  InteriorPedalAccel: "pedalier",
  InteriorPedalAccelArm: "pedalier",
  InteriorPedalBrake: "pedalier",
  InteriorPedalBrakeArm: "pedalier",
  InteriorCage: "garnitures",
  InteriorFloor: "garnitures",
  InteriorFloormats: "garnitures",
  InteriorMid: "garnitures",
  InteriorPillar: "garnitures",
  InteriorRearHatch: "garnitures",
  InteriorRearPanels: "garnitures",
};

export interface PaintVariant {
  name: string;
  label: string;
  swatch: string;
}

export interface CatalogEntry {
  id: string;
  file: string;
  name: string;
  /** true : modèle de présentation, ne représente aucun véhicule précis. */
  generic: boolean;
  /** Véhicules représentés fidèlement par ce modèle (modèles dédiés uniquement). */
  matches?: (v: { make: string; model: string; trim: string | null; year: number }) => boolean;
  credit: string;
  license: string;
  sourceUrl: string;
  /** Rotation (radians, autour de Y) pour orienter l'avant du véhicule vers +Z. */
  rotationY: number;
  /** Table nœud → fiche ; absente = correspondance automatique d'après les noms. */
  mapping?: Record<string, string>;
  overlayNodes?: string[];
  paints?: PaintVariant[];
  defaultPaint?: string;
  /** Fichier livré avec le projet (sinon, à installer : voir docs/MODELES_3D.md). */
  bundled: boolean;
}

const norm = (s: string | null | undefined) => (s ?? "").toLowerCase().replace(/\s+/g, " ").trim();

export const CATALOG_MODELS: CatalogEntry[] = [
  {
    id: "car-concept",
    file: "models/car-concept.glb",
    name: "Modèle de présentation « Car Concept »",
    generic: true,
    credit: "« Car Concept » — Eric Chadwick / Darmstadt Graphics Group, Khronos glTF Sample Assets",
    license: "CC BY 4.0",
    sourceUrl: "https://github.com/KhronosGroup/glTF-Sample-Assets/tree/main/Models/CarConcept",
    rotationY: 0,
    mapping: CONCEPT_MAPPING,
    overlayNodes: CONCEPT_OVERLAY_NODES,
    paints: [
      { name: "Carmine Candy", label: "Carmin", swatch: "#a5131b" },
      { name: "Torched Graphite", label: "Graphite", swatch: "#3c3f45" },
      { name: "Pearly Swirly", label: "Nacré", swatch: "#e9e6df" },
    ],
    defaultPaint: "Carmine Candy",
    bundled: true,
  },
  {
    id: "porsche-911-gt3-992",
    file: "models/porsche-911-gt3-992.glb",
    name: "Porsche 911 GT3 (992)",
    generic: false,
    matches: (v) => norm(v.make) === "porsche" && norm(v.model).includes("911 gt3") && (norm(v.trim).includes("992") || v.year >= 2021),
    credit: "À renseigner lors de l'installation du fichier",
    license: "À vérifier (voir docs/MODELES_3D.md)",
    sourceUrl: "",
    rotationY: 0,
    bundled: false,
  },
  {
    id: "peugeot-106",
    file: "models/peugeot-106.glb",
    name: "Peugeot 106",
    generic: false,
    matches: (v) => norm(v.make) === "peugeot" && norm(v.model).startsWith("106"),
    credit: "À renseigner lors de l'installation du fichier",
    license: "À vérifier (voir docs/MODELES_3D.md)",
    sourceUrl: "",
    rotationY: 0,
    bundled: false,
  },
];

export const GENERIC_MODEL = CATALOG_MODELS[0];

export function catalogEntryFor(vehicle: { make: string; model: string; trim: string | null; year: number } | null) {
  return (vehicle && CATALOG_MODELS.find((m) => m.matches?.(vehicle))) || null;
}

/** Modèle d'explorateur pour une entrée du catalogue. */
export function explorerModelFromCatalog(entry: CatalogEntry, vehicleLabel?: string): ExplorerModel {
  const overlay = entry.overlayNodes ?? [];
  return {
    id: entry.id,
    kind: "GLB",
    name: entry.name,
    url: assetUrl(entry.file),
    isIllustrative: entry.generic,
    source: entry.credit,
    license: entry.license,
    mapping: { ...(entry.mapping ?? {}), ...Object.fromEntries(overlay.map((n) => [n, DEMO_NODE_MAPPING[n]])) },
    autoMap: !entry.mapping,
    rotationY: entry.rotationY,
    overlayNodes: overlay,
    paints: entry.paints,
    defaultPaint: entry.defaultPaint,
    credit: `${entry.credit} — ${entry.license}`,
    notice: entry.generic
      ? `Modèle de présentation générique${vehicleLabel ? ` : il ne représente pas votre ${vehicleLabel}` : ""}.${overlay.length ? " Transmission, suspensions, refroidissement, échappement et électronique sont des organes illustratifs ajoutés par CarView." : ""}`
      : null,
  };
}

/**
 * Modèle à afficher pour un véhicule : modèle importé, sinon modèle dédié du
 * catalogue (`preferred`, utilisé seulement si son fichier est installé), avec
 * le modèle de présentation générique en repli.
 */
export function resolveVehicleModel(
  vehicle: { make: string; model: string; trim: string | null; year: number } | null,
  ownModel: ExplorerModel | null,
  { forceGeneric = false }: { forceGeneric?: boolean } = {},
): { model: ExplorerModel; preferred: ExplorerModel | null } {
  if (ownModel && !forceGeneric) return { model: ownModel, preferred: null };
  const label = vehicle ? [vehicle.make, vehicle.model, vehicle.trim].filter(Boolean).join(" ") : undefined;
  const exact = !forceGeneric ? catalogEntryFor(vehicle) : null;
  return { model: explorerModelFromCatalog(GENERIC_MODEL, label), preferred: exact ? explorerModelFromCatalog(exact) : null };
}
