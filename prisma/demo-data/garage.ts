/**
 * Garage de démonstration — données FICTIVES, partagées par le seed serveur
 * et la démo hors ligne (navigateur). Dates au format AAAA-MM-JJ.
 */
import type { Energy, ExpenseCategory, InterventionCategory, Transmission } from "../../src/generated/prisma/enums";

export interface DemoIntervention {
  date: string;
  mileage: number;
  category: InterventionCategory;
  description: string;
  garage: string;
  parts: number; // euros
  labor: number; // euros
  replaced?: { name: string; reference?: string; quantity?: number }[];
  components?: string[];
  invoice?: boolean;
  nextDueDate?: string;
  nextDueMileage?: number;
}

export interface DemoVehicle {
  label: string;
  vehicle: {
    make: string;
    model: string;
    trim: string | null;
    year: number;
    engine: string | null;
    energy: Energy;
    transmission: Transmission;
    mileage: number;
    acquiredAt?: string;
    registration?: string;
    notes: string;
  };
  /** Véhicule associé au modèle 3D procédural de démonstration. */
  demoModel?: boolean;
  interventions: DemoIntervention[];
  reminders: { title: string; category: InterventionCategory; dueDate?: string; dueMileage?: number; notes: string }[];
  expenses: { date: string; category: ExpenseCategory; amount: number; label: string }[];
}

const NOTE = "Véhicule de démonstration : données fictives.";

export const DEMO_GARAGE: DemoVehicle[] = [
  {
    label: "Porsche 911 GT3 (992)",
    vehicle: {
      make: "Porsche",
      model: "911 GT3",
      trim: "(992)",
      year: 2023,
      engine: "6 cylindres à plat atmosphérique 4,0 L",
      energy: "ESSENCE",
      transmission: "DOUBLE_EMBRAYAGE",
      mileage: 12450,
      acquiredAt: "2023-03-15",
      registration: "AA-123-AA",
      notes: NOTE,
    },
    interventions: [
      { date: "2024-03-12", mileage: 6450, category: "REVISION", description: "Révision annuelle", garage: "Garage partenaire (fictif)", parts: 180, labor: 170, invoice: true, components: ["bloc-moteur", "admission"], replaced: [{ name: "Filtre à huile" }, { name: "Huile moteur", quantity: 9 }] },
      { date: "2024-09-18", mileage: 8320, category: "FREINAGE", description: "Remplacement plaquettes avant", garage: "Garage partenaire (fictif)", parts: 460, labor: 160, invoice: true, components: ["etriers-frein"], replaced: [{ name: "Plaquettes de frein avant", quantity: 1 }] },
      { date: "2025-02-10", mileage: 9800, category: "PNEUS", description: "Changement pneus (×4)", garage: "Centre pneus (fictif)", parts: 1760, labor: 120, components: ["pneumatiques"] },
      { date: "2025-11-14", mileage: 11200, category: "VIDANGE", description: "Vidange moteur", garage: "Garage partenaire (fictif)", parts: 210, labor: 90, components: ["bloc-moteur"], invoice: true, nextDueDate: "2026-11-14", nextDueMileage: 16200 },
      { date: "2026-04-22", mileage: 12100, category: "REPARATION", description: "Remplacement capteur de vitesse de roue AR gauche", garage: "Garage partenaire (fictif)", parts: 140, labor: 95, components: ["capteurs-vitesse-roue"] },
    ],
    reminders: [
      { title: "Remplacer les pneus avant", category: "PNEUS", dueMileage: 13000, notes: "Usure constatée lors de la dernière vidange (démo)." },
      { title: "Liquide de frein", category: "FREINAGE", dueDate: "2026-10-01", notes: "Échéance personnelle (démo)." },
    ],
    expenses: [
      { date: "2026-01-05", category: "ASSURANCE", amount: 1860, label: "Assurance annuelle (démo)" },
      { date: "2026-02-14", category: "CARBURANT", amount: 142.5, label: "Plein SP98 (démo)" },
      { date: "2026-05-30", category: "CARBURANT", amount: 138.9, label: "Plein SP98 (démo)" },
      { date: "2026-07-12", category: "PIECES", amount: 89, label: "Kit de nettoyage carrosserie (démo)" },
      { date: "2026-08-03", category: "CARBURANT", amount: 151.2, label: "Plein SP98 (démo)" },
    ],
  },
  {
    label: "BMW M3 (E92)",
    vehicle: {
      make: "BMW",
      model: "M3",
      trim: "(E92)",
      year: 2008,
      engine: "V8 atmosphérique 4,0 L",
      energy: "ESSENCE",
      transmission: "MANUELLE",
      mileage: 85230,
      acquiredAt: "2019-06-01",
      notes: NOTE,
    },
    interventions: [
      { date: "2025-06-02", mileage: 82100, category: "CONTROLE_TECHNIQUE", description: "Contrôle technique périodique", garage: "Centre de contrôle (fictif)", parts: 0, labor: 78, invoice: true, nextDueDate: "2027-06-02" },
      { date: "2026-03-20", mileage: 84600, category: "BATTERIE", description: "Remplacement batterie", garage: "Atelier (fictif)", parts: 210, labor: 40, components: ["batterie"] },
    ],
    reminders: [],
    expenses: [],
  },
  {
    label: "Audi RS4 Avant (B9)",
    vehicle: {
      make: "Audi",
      model: "RS4 Avant",
      trim: "(B9)",
      year: 2018,
      engine: "V6 biturbo 2,9 L",
      energy: "ESSENCE",
      transmission: "AUTOMATIQUE",
      mileage: 62100,
      notes: NOTE,
    },
    interventions: [],
    reminders: [{ title: "Révision", category: "REVISION", dueDate: "2026-12-15", dueMileage: 65000, notes: "Échéance personnelle (démo)." }],
    expenses: [],
  },
  {
    label: "CarView Berline générique",
    vehicle: {
      make: "CarView",
      model: "Berline générique",
      trim: "démonstration 3D",
      year: 2024,
      engine: "4 cylindres essence (illustratif)",
      energy: "ESSENCE",
      transmission: "MANUELLE",
      mileage: 15000,
      notes: "Véhicule fictif associé au modèle 3D de démonstration : toutes ses pièces sont illustratives.",
    },
    demoModel: true,
    interventions: [],
    reminders: [],
    expenses: [],
  },
];

export const invoiceLines = (vehicleLabel: string, it: DemoIntervention) => [
  "FACTURE DE DEMONSTRATION - DOCUMENT FICTIF",
  `Vehicule : ${vehicleLabel}`,
  `Intervention : ${it.description}`,
  `Date : ${it.date} - Kilometrage : ${it.mileage} km`,
  `Intervenant : ${it.garage}`,
  `Pieces : ${it.parts} EUR - Main-d'oeuvre : ${it.labor} EUR`,
  "Genere automatiquement par le jeu de demonstration CarView.",
];
