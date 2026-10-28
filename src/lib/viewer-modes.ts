/**
 * Logique (pure, testée) des modes de l'explorateur 3D : disponibilité selon
 * les composants présents dans le modèle, et apparence de chaque objet.
 */
import type { ComponentFamily, ComponentSystem, ElectronicKind } from "@/generated/prisma/enums";

export type ViewerMode = "exterieur" | "transparent" | "mecanique" | "electronique" | "complete" | "eclatee";

export const MODES: { key: ViewerMode; label: string; hint: string }[] = [
  { key: "exterieur", label: "Extérieur", hint: "Carrosserie et apparence du véhicule" },
  { key: "transparent", label: "Transparent", hint: "Carrosserie translucide pour voir les éléments internes" },
  { key: "mecanique", label: "Mécanique", hint: "Moteur, transmission, freinage, suspension, direction, refroidissement" },
  { key: "electronique", label: "Électronique", hint: "Calculateurs, capteurs, batterie et faisceaux" },
  { key: "complete", label: "Vue complète", hint: "Superposition de tous les systèmes avec légende" },
  { key: "eclatee", label: "Vue éclatée", hint: "Séparation progressive des composants" },
];

export interface PartInfo {
  family: ComponentFamily;
  system: ComponentSystem;
  electronicKind: ElectronicKind | null;
}

export type Appearance =
  | { visible: false }
  | { visible: true; style: "original" | "ghost" | "dim" | "family" | "electronic" };

const MECHANICAL_FAMILIES: ComponentFamily[] = ["MOTEUR", "TRANSMISSION", "FREINAGE", "SUSPENSION", "DIRECTION", "REFROIDISSEMENT", "ECHAPPEMENT"];
// Éléments visibles de l'extérieur sur une voiture réelle (roues, disques à travers les jantes).
const VISIBLE_FROM_OUTSIDE: ComponentFamily[] = ["CARROSSERIE", "ROUES", "FREINAGE", "HABITACLE"];

/** Apparence d'un objet selon le mode. `info` null = objet non associé à une fiche. */
export function appearanceFor(mode: ViewerMode, info: PartInfo | null): Appearance {
  if (!info) {
    // Un objet non associé reste visible tel quel en extérieur/éclaté, discret ailleurs.
    return mode === "exterieur" || mode === "eclatee" ? { visible: true, style: "original" } : { visible: true, style: "ghost" };
  }
  const isBody = info.family === "CARROSSERIE";
  switch (mode) {
    case "exterieur":
      return VISIBLE_FROM_OUTSIDE.includes(info.family) ? { visible: true, style: "original" } : { visible: false };
    case "transparent":
      return { visible: true, style: isBody ? "ghost" : "original" };
    case "mecanique":
      if (isBody) return { visible: true, style: "ghost" };
      if (MECHANICAL_FAMILIES.includes(info.family)) return { visible: true, style: "family" };
      if (info.family === "ROUES") return { visible: true, style: "dim" };
      if (info.family === "HABITACLE") return { visible: true, style: "ghost" };
      return { visible: false };
    case "electronique":
      if (info.system === "ELECTRONIQUE") return { visible: true, style: "electronic" };
      return { visible: true, style: isBody || info.family === "HABITACLE" ? "ghost" : "dim" };
    case "complete":
      if (isBody) return { visible: true, style: "ghost" };
      return { visible: true, style: info.system === "ELECTRONIQUE" ? "electronic" : "family" };
    case "eclatee":
      return { visible: true, style: "original" };
  }
}

export interface ModeAvailability {
  available: boolean;
  reason?: string;
}

/**
 * Un mode n'est proposé que si le modèle contient réellement des objets séparés
 * pour les systèmes concernés : une carrosserie seule ne révèle aucune mécanique.
 */
export function modeAvailability(mode: ViewerMode, parts: PartInfo[], distinctNodes: number): ModeAvailability {
  const has = (pred: (p: PartInfo) => boolean) => parts.some(pred);
  const hasBody = has((p) => p.family === "CARROSSERIE");
  const hasInternal = has((p) => p.family !== "CARROSSERIE" && !VISIBLE_FROM_OUTSIDE.includes(p.family));
  switch (mode) {
    case "exterieur":
      return { available: true };
    case "transparent":
      return hasBody && hasInternal
        ? { available: true }
        : { available: false, reason: "Le modèle ne contient pas d’éléments internes séparés de la carrosserie." };
    case "mecanique":
      return has((p) => MECHANICAL_FAMILIES.includes(p.family))
        ? { available: true }
        : { available: false, reason: "Aucun organe mécanique n’est associé dans ce modèle." };
    case "electronique":
      return has((p) => p.system === "ELECTRONIQUE")
        ? { available: true }
        : { available: false, reason: "Aucun composant électronique n’est associé dans ce modèle." };
    case "complete":
      return has((p) => p.system === "MECANIQUE") || has((p) => p.system === "ELECTRONIQUE")
        ? { available: true }
        : { available: false, reason: "Le modèle ne contient pas de systèmes internes à superposer." };
    case "eclatee":
      return distinctNodes >= 3
        ? { available: true }
        : { available: false, reason: "Le modèle n’est pas découpé en objets séparés." };
  }
}

/** Mode à utiliser pour rendre visible une pièce sélectionnée depuis la liste. */
export function modeToReveal(current: ViewerMode, info: PartInfo): ViewerMode {
  if (appearanceFor(current, info).visible) return current;
  return info.system === "ELECTRONIQUE" ? "electronique" : "transparent";
}

/**
 * Direction d'éclatement d'un objet : depuis le centre du modèle vers le centre
 * de l'objet, accentuée verticalement pour les éléments de carrosserie.
 */
export function explodeDirection(
  center: [number, number, number],
  partCenter: [number, number, number],
  family: ComponentFamily | null,
): [number, number, number] {
  let dx = partCenter[0] - center[0];
  let dy = partCenter[1] - center[1];
  let dz = partCenter[2] - center[2];
  if (family === "CARROSSERIE" || family === "HABITACLE") dy += 0.6;
  if (family === "ROUES" || family === "FREINAGE") dy *= 0.2; // les roues s'écartent latéralement
  const len = Math.hypot(dx, dy, dz);
  if (len < 1e-6) return [0, 1, 0];
  dx /= len;
  dy /= len;
  dz /= len;
  const scale = family === "CARROSSERIE" ? 1.4 : family === "ROUES" || family === "FREINAGE" ? 0.9 : 1;
  return [dx * scale, dy * scale, dz * scale];
}
