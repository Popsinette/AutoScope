import type {
  ComponentFamily,
  DocumentCategory,
  ElectronicKind,
  Energy,
  ExpenseCategory,
  InfoReliability,
  InterventionCategory,
  ReminderOrigin,
  Transmission,
} from "@/generated/prisma/enums";

export const ENERGY_LABELS: Record<Energy, string> = {
  ESSENCE: "Essence",
  DIESEL: "Diesel",
  HYBRIDE: "Hybride",
  HYBRIDE_RECHARGEABLE: "Hybride rechargeable",
  ELECTRIQUE: "Électrique",
  GPL: "GPL",
  AUTRE: "Autre",
};

export const TRANSMISSION_LABELS: Record<Transmission, string> = {
  MANUELLE: "Manuelle",
  AUTOMATIQUE: "Automatique",
  DOUBLE_EMBRAYAGE: "Double embrayage",
  CVT: "Variation continue (CVT)",
  AUTRE: "Autre",
};

export const INTERVENTION_LABELS: Record<InterventionCategory, string> = {
  VIDANGE: "Vidange",
  REVISION: "Révision",
  FREINAGE: "Freinage",
  PNEUS: "Pneus",
  BATTERIE: "Batterie",
  CONTROLE_TECHNIQUE: "Contrôle technique",
  REPARATION: "Réparation",
  AUTRE: "Autre",
};

export const EXPENSE_LABELS: Record<ExpenseCategory, string> = {
  ENTRETIEN: "Entretien",
  REPARATION: "Réparations",
  PIECES: "Pièces",
  PNEUMATIQUES: "Pneumatiques",
  CARBURANT: "Carburant",
  ASSURANCE: "Assurance",
  AUTRE: "Autres",
};

export const DOCUMENT_LABELS: Record<DocumentCategory, string> = {
  FACTURE: "Facture",
  PHOTO: "Photo",
  NOTICE: "Notice",
  CONTROLE_TECHNIQUE: "Contrôle technique",
  ASSURANCE: "Assurance",
  CARTE_GRISE: "Certificat d'immatriculation",
  AUTRE: "Autre",
};

export const FAMILY_LABELS: Record<ComponentFamily, string> = {
  CARROSSERIE: "Carrosserie",
  MOTEUR: "Moteur",
  TRANSMISSION: "Transmission",
  FREINAGE: "Freinage",
  SUSPENSION: "Suspension",
  DIRECTION: "Direction",
  REFROIDISSEMENT: "Refroidissement",
  ECHAPPEMENT: "Échappement",
  ROUES: "Roues et pneumatiques",
  ELECTRONIQUE: "Électronique",
  HABITACLE: "Habitacle",
};

export const ELECTRONIC_LABELS: Record<ElectronicKind, string> = {
  CALCULATEUR: "Calculateurs (ECU)",
  FAISCEAU: "Faisceaux électriques",
  CAPTEUR: "Capteurs",
  ACTIONNEUR: "Actionneurs",
  BATTERIE: "Batterie & alimentation",
};

export const RELIABILITY_LABELS: Record<InfoReliability, { label: string; hint: string }> = {
  DOCUMENTEE: { label: "Documentée", hint: "Information issue d'une source précise citée." },
  GENERIQUE: { label: "Générique", hint: "Principe général valable pour la plupart des véhicules ; à confirmer pour le vôtre." },
  ILLUSTRATIVE: { label: "Illustrative", hint: "Donnée de démonstration, ne pas utiliser pour un entretien réel." },
};

export const ORIGIN_LABELS: Record<ReminderOrigin, string> = {
  UTILISATEUR: "Saisie personnelle",
  CONSTRUCTEUR_DOCUMENTE: "Préconisation constructeur documentée",
};

export const enumOptions = <T extends string>(labels: Record<T, string>) =>
  (Object.entries(labels) as [T, string][]).map(([value, label]) => ({ value, label }));
