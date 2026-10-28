import { z } from "zod";
import {
  DocumentCategory,
  Energy,
  ExpenseCategory,
  InterventionCategory,
  ReminderOrigin,
  Transmission,
} from "@/generated/prisma/enums";
import { parseEurosToCents } from "./format";

const currentYear = new Date().getFullYear();

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `${max} caractères maximum.`)
    .optional()
    .transform((v) => (v ? v : null));

const requiredText = (max: number, message = "Champ obligatoire.") =>
  z.string({ error: message }).trim().min(1, message).max(max, `${max} caractères maximum.`);

const dateString = z
  .string({ error: "Date obligatoire." })
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date invalide.")
  .transform((v) => new Date(`${v}T12:00:00Z`))
  .refine((d) => !Number.isNaN(d.getTime()), "Date invalide.");

const optionalDate = z
  .string()
  .optional()
  .transform((v, ctx) => {
    if (!v) return null;
    const d = new Date(`${v}T12:00:00Z`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(v) || Number.isNaN(d.getTime())) {
      ctx.addIssue({ code: "custom", message: "Date invalide." });
      return z.NEVER;
    }
    return d;
  });

const km = z.coerce
  .number({ error: "Kilométrage invalide." })
  .int("Kilométrage entier attendu.")
  .min(0, "Kilométrage invalide.")
  .max(3_000_000, "Kilométrage invalide.");

const optionalKm = z
  .string()
  .optional()
  .transform((v, ctx) => {
    if (!v) return null;
    const n = Number(v.replace(/\s/g, ""));
    if (!Number.isInteger(n) || n < 0 || n > 3_000_000) {
      ctx.addIssue({ code: "custom", message: "Kilométrage invalide." });
      return z.NEVER;
    }
    return n;
  });

const euros = z
  .string()
  .optional()
  .transform((v, ctx) => {
    const cents = parseEurosToCents(v ?? "");
    if (cents === null || cents > 100_000_000) {
      ctx.addIssue({ code: "custom", message: "Montant invalide (ex. : 120,50)." });
      return z.NEVER;
    }
    return cents;
  });

export const vehicleSchema = z.object({
  make: requiredText(60, "Marque obligatoire."),
  model: requiredText(80, "Modèle obligatoire."),
  trim: optionalText(80),
  year: z.coerce
    .number({ error: "Année invalide." })
    .int("Année invalide.")
    .min(1886, "Année invalide.")
    .max(currentYear + 1, "Année invalide."),
  engine: optionalText(120),
  energy: z.enum(Energy, { error: "Énergie obligatoire." }),
  transmission: z.enum(Transmission, { error: "Transmission obligatoire." }),
  mileage: km,
  acquiredAt: optionalDate,
  registration: optionalText(20),
  vin: z
    .string()
    .trim()
    .toUpperCase()
    .optional()
    .transform((v) => (v ? v : null))
    .refine((v) => v === null || /^[A-HJ-NPR-Z0-9]{17}$/.test(v), "Le VIN comporte 17 caractères (sans I, O ni Q)."),
  notes: optionalText(4000),
});
export type VehicleInput = z.infer<typeof vehicleSchema>;

export const replacedPartSchema = z.object({
  name: requiredText(120, "Nom de pièce obligatoire."),
  reference: optionalText(80),
  quantity: z.coerce.number().int().min(1).max(999).default(1),
});

export const interventionSchema = z
  .object({
    date: dateString,
    mileage: km,
    category: z.enum(InterventionCategory, { error: "Catégorie obligatoire." }),
    description: requiredText(500, "Description obligatoire."),
    garage: optionalText(120),
    partsCost: euros,
    laborCost: euros,
    nextDueDate: optionalDate,
    nextDueMileage: optionalKm,
    notes: optionalText(4000),
    replacedParts: z.array(replacedPartSchema).max(50).default([]),
    componentIds: z.array(z.string().min(1).max(40)).max(30).default([]),
  })
  .refine((v) => !v.nextDueDate || v.nextDueDate > v.date, {
    path: ["nextDueDate"],
    message: "La prochaine échéance doit être postérieure à l'intervention.",
  })
  .refine((v) => v.nextDueMileage === null || v.nextDueMileage > v.mileage, {
    path: ["nextDueMileage"],
    message: "Le kilométrage d'échéance doit dépasser celui de l'intervention.",
  });
export type InterventionInput = z.infer<typeof interventionSchema>;

export const expenseSchema = z.object({
  date: dateString,
  category: z.enum(ExpenseCategory, { error: "Catégorie obligatoire." }),
  amount: euros.refine((c) => c > 0, "Montant obligatoire."),
  label: requiredText(160, "Libellé obligatoire."),
  notes: optionalText(2000),
});
export type ExpenseInput = z.infer<typeof expenseSchema>;

export const reminderSchema = z
  .object({
    title: requiredText(160, "Intitulé obligatoire."),
    category: z.enum(InterventionCategory, { error: "Catégorie obligatoire." }),
    dueDate: optionalDate,
    dueMileage: optionalKm,
    origin: z.enum(ReminderOrigin).default("UTILISATEUR"),
    sourceReference: optionalText(300),
    notes: optionalText(2000),
  })
  .refine((v) => v.dueDate !== null || v.dueMileage !== null, {
    path: ["dueDate"],
    message: "Indiquez une date, un kilométrage, ou les deux.",
  })
  .refine((v) => v.origin !== "CONSTRUCTEUR_DOCUMENTE" || !!v.sourceReference, {
    path: ["sourceReference"],
    message: "Une préconisation constructeur doit citer sa source (carnet, notice, page…).",
  });
export type ReminderInput = z.infer<typeof reminderSchema>;

export const documentSchema = z.object({
  title: requiredText(160, "Titre obligatoire."),
  category: z.enum(DocumentCategory, { error: "Catégorie obligatoire." }),
  interventionId: z
    .string()
    .optional()
    .transform((v) => v || null),
});

export type FieldErrors = Record<string, string[] | undefined>;

export function fieldErrors(error: z.ZodError): FieldErrors {
  return z.flattenError(error).fieldErrors as FieldErrors;
}

/** Convertit un FormData en objet simple (les champs vides deviennent undefined). */
export function formToObject(form: FormData, skip: string[] = []) {
  const out: Record<string, string | undefined> = {};
  for (const [key, value] of form.entries()) {
    if (skip.includes(key) || typeof value !== "string" || key.startsWith("$")) continue;
    out[key] = value.trim() === "" ? undefined : value;
  }
  return out;
}
