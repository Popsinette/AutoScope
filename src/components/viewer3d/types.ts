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
}

export type CameraPreset = "avant" | "arriere" | "profil" | "dessus" | "interieur" | "reset";
