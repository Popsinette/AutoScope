import type {
  DocumentCategory,
  Energy,
  ExpenseCategory,
  InterventionCategory,
  ReminderOrigin,
  Transmission,
} from "@/generated/prisma/enums";

export interface DVehicle {
  id: string;
  make: string;
  model: string;
  trim: string | null;
  year: number;
  engine: string | null;
  energy: Energy;
  transmission: Transmission;
  mileage: number;
  acquiredAt: Date | null;
  /** Identifiant du fichier photo dans le stockage local. */
  photoKey: string | null;
  registration: string | null;
  vin: string | null;
  notes: string | null;
  isDemo: boolean;
  model3dId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface DIntervention {
  id: string;
  vehicleId: string;
  date: Date;
  mileage: number;
  category: InterventionCategory;
  description: string;
  garage: string | null;
  partsCostCents: number;
  laborCostCents: number;
  nextDueDate: Date | null;
  nextDueMileage: number | null;
  notes: string | null;
  replacedParts: { id: string; name: string; reference: string | null; quantity: number }[];
  componentSlugs: string[];
  createdAt: Date;
}

export interface DExpense {
  id: string;
  vehicleId: string;
  date: Date;
  category: ExpenseCategory;
  amountCents: number;
  label: string;
  notes: string | null;
  interventionId: string | null;
  createdAt: Date;
}

export interface DReminder {
  id: string;
  vehicleId: string;
  title: string;
  category: InterventionCategory;
  dueDate: Date | null;
  dueMileage: number | null;
  origin: ReminderOrigin;
  sourceReference: string | null;
  notes: string | null;
  completedAt: Date | null;
  completedById: string | null;
  sourceInterventionId: string | null;
  createdAt: Date;
}

export interface DDocument {
  id: string;
  vehicleId: string;
  interventionId: string | null;
  category: DocumentCategory;
  title: string;
  fileName: string;
  mimeType: string;
  size: number;
  createdAt: Date;
}

export interface DModel {
  id: string;
  name: string;
  source: string;
  license: string;
  isIllustrative: boolean;
  nodeNames: string[];
  /** nom de nœud (tel qu'écrit dans le fichier) → slug de fiche */
  mapping: Record<string, string>;
  fileSize: number;
  updatedAt: Date;
}

export interface DemoData {
  version: 1;
  vehicles: DVehicle[];
  interventions: DIntervention[];
  expenses: DExpense[];
  reminders: DReminder[];
  documents: DDocument[];
  models: DModel[];
  selectedVehicleId: string | null;
}

/** Persistance des enregistrements (localStorage dans le navigateur, mémoire en test). */
export interface RecordPersistence {
  load(): DemoData | null;
  save(data: DemoData): void;
  clear(): void;
}

/** Persistance des fichiers (IndexedDB dans le navigateur, mémoire en test). */
export interface FilePersistence {
  put(id: string, blob: Blob): Promise<void>;
  delete(id: string): Promise<void>;
  all(): Promise<Map<string, Blob>>;
  clear(): Promise<void>;
}
