import type { ComponentFamily, ElectronicKind } from "@/generated/prisma/enums";

/** Couleurs des familles (modes Mécanique / Vue complète). Le rouge est réservé à la sélection. */
export const FAMILY_COLORS: Record<ComponentFamily, string> = {
  CARROSSERIE: "#8a9099",
  MOTEUR: "#d4a72c",
  TRANSMISSION: "#4a90d9",
  FREINAGE: "#e07b39",
  SUSPENSION: "#a483e0",
  DIRECTION: "#3fbfad",
  REFROIDISSEMENT: "#6fd0f5",
  ECHAPPEMENT: "#b0b4ba",
  ROUES: "#5a6069",
  ELECTRONIQUE: "#4f8ff7",
  HABITACLE: "#8c7d6c",
};

/** Couleurs des sous-familles électroniques (légende du mode Électronique). */
export const ELECTRONIC_COLORS: Record<ElectronicKind, string> = {
  CALCULATEUR: "#4f8ff7",
  FAISCEAU: "#f08a24",
  CAPTEUR: "#f2c94c",
  ACTIONNEUR: "#e46fb0",
  BATTERIE: "#9b7bff",
};

export const SELECTION_COLOR = "#ff3b2f";
