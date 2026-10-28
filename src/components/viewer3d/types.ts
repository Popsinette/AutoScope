import type { ComponentFamily, ComponentSystem, ElectronicKind } from "@/generated/prisma/enums";

export interface ExplorerComponent {
  id: string;
  slug: string;
  name: string;
  family: ComponentFamily;
  system: ComponentSystem;
  electronicKind: ElectronicKind | null;
}

export interface ExplorerModel {
  id: string;
  kind: "PROCEDURAL_DEMO" | "GLB";
  name: string;
  url: string | null;
  isIllustrative: boolean;
  source: string;
  license: string;
  /** nom de nœud → slug du composant */
  mapping: Record<string, string>;
  /** Correspondance automatique d'après les noms des objets (modèle installé sans table). */
  autoMap?: boolean;
  /** Rotation (radians, axe Y) pour orienter l'avant du véhicule vers +Z. */
  rotationY?: number;
  /** Organes illustratifs CarView ajoutés au modèle (noms de nœuds du véhicule procédural). */
  overlayNodes?: string[];
  /** Variantes de peinture (extension glTF KHR_materials_variants). */
  paints?: { name: string; label: string; swatch: string }[];
  defaultPaint?: string;
  /** Attribution à afficher (licence CC BY…). */
  credit?: string;
  /** Avertissement affiché quand le modèle ne représente pas le véhicule. */
  notice?: string | null;
}

export type CameraPreset = "avant" | "arriere" | "gauche" | "droite" | "dessus" | "perspective" | "interieur" | "reset";
