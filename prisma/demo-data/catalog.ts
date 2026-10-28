/** Catalogue de démonstration : références génériques, non commerciales. */
import type { ComponentFamily } from "../../src/generated/prisma/enums";

export const CATALOG_SOURCE = "Catalogue de démonstration CarView — références génériques, non commerciales.";
export const CATALOG_COMPAT_SOURCE = "Donnée fictive de démonstration";

export interface CatalogSeed {
  name: string;
  family: ComponentFamily;
  description: string;
  componentSlug?: string;
  /** Compatibilité explicite uniquement avec le véhicule fictif « CarView Berline générique ». */
  compat?: boolean;
}

export const CATALOG: CatalogSeed[] = [
  { name: "Filtre à huile (générique)", family: "MOTEUR", description: "Retient les particules en suspension dans l'huile moteur. Se remplace à chaque vidange.", componentSlug: "bloc-moteur", compat: true },
  { name: "Filtre à air (générique)", family: "MOTEUR", description: "Filtre l'air admis par le moteur.", componentSlug: "admission", compat: true },
  { name: "Bougies d'allumage (jeu)", family: "MOTEUR", description: "Produisent l'étincelle qui enflamme le mélange sur un moteur essence." },
  { name: "Kit d'embrayage", family: "TRANSMISSION", description: "Disque, mécanisme et butée d'embrayage pour boîte manuelle." },
  { name: "Huile de boîte de vitesses", family: "TRANSMISSION", description: "Lubrifiant spécifique à la boîte ; la norme exacte dépend du constructeur.", componentSlug: "boite-de-vitesses" },
  { name: "Plaquettes de frein avant", family: "FREINAGE", description: "Garnitures de friction pour étriers avant.", componentSlug: "etriers-frein", compat: true },
  { name: "Disques de frein avant (paire)", family: "FREINAGE", description: "Disques ventilés à remplacer par paire.", componentSlug: "disques-frein", compat: true },
  { name: "Liquide de frein DOT 4", family: "FREINAGE", description: "Liquide hygroscopique à renouveler périodiquement." },
  { name: "Amortisseurs avant (paire)", family: "SUSPENSION", description: "Amortisseurs hydrauliques à remplacer par essieu.", componentSlug: "amortisseurs" },
  { name: "Rotule de direction", family: "DIRECTION", description: "Articulation entre biellette et porte-moyeu.", componentSlug: "cremaillere" },
  { name: "Liquide de refroidissement", family: "REFROIDISSEMENT", description: "Mélange antigel ; respecter le type préconisé par le constructeur.", componentSlug: "radiateur" },
  { name: "Thermostat", family: "REFROIDISSEMENT", description: "Régule la température de fonctionnement du moteur." },
  { name: "Silencieux arrière", family: "ECHAPPEMENT", description: "Élément terminal de la ligne d'échappement.", componentSlug: "silencieux" },
  { name: "Batterie 12 V AGM", family: "ELECTRONIQUE", description: "Batterie adaptée aux véhicules équipés du Stop & Start.", componentSlug: "batterie", compat: true },
  { name: "Sonde lambda amont", family: "ELECTRONIQUE", description: "Capteur d'oxygène placé avant le catalyseur.", componentSlug: "sonde-lambda" },
  { name: "Ampoule de phare H7", family: "CARROSSERIE", description: "Ampoule halogène courante pour feux de croisement.", componentSlug: "optiques-avant" },
  { name: "Balais d'essuie-glace (paire)", family: "CARROSSERIE", description: "À remplacer en cas de traces ou de broutement." },
  { name: "Pneumatique été 225/45 R17", family: "ROUES", description: "Dimension courante sur les compactes et berlines.", componentSlug: "pneumatiques" },
  { name: "Filtre d'habitacle", family: "HABITACLE", description: "Filtre l'air entrant dans l'habitacle (pollens, particules)." },
];
