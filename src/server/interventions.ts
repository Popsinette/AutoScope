import "server-only";
import type { InterventionCategory } from "@/generated/prisma/enums";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "./db";
import { NotFoundError } from "./errors";
import { getStorage, newStorageKey } from "./storage";
import { requireVehicle } from "./vehicles";
import { expenseCategoryFor } from "@/lib/expenses";
import { INTERVENTION_LABELS } from "@/lib/labels";
import { formatShortDate } from "@/lib/format";
import type { InterventionInput } from "@/lib/validation";

type Tx = Prisma.TransactionClient;

export interface UploadedFile {
  bytes: Uint8Array;
  type: string;
  fileName: string;
  size: number;
}

const detailInclude = {
  vehicle: true,
  replacedParts: true,
  components: { include: { component: true } },
  documents: { orderBy: { createdAt: "desc" } },
  expense: true,
  followUpReminder: true,
} satisfies Prisma.InterventionInclude;

export async function listInterventions(
  userId: string,
  vehicleId: string,
  filters: { category?: InterventionCategory; q?: string } = {},
) {
  return prisma.intervention.findMany({
    where: {
      vehicleId,
      vehicle: { userId },
      ...(filters.category ? { category: filters.category } : {}),
      ...(filters.q
        ? {
            OR: [
              { description: { contains: filters.q, mode: "insensitive" } },
              { garage: { contains: filters.q, mode: "insensitive" } },
              { notes: { contains: filters.q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    include: { _count: { select: { documents: true } } },
    orderBy: [{ date: "desc" }, { mileage: "desc" }],
  });
}

export async function getIntervention(userId: string, id: string) {
  return prisma.intervention.findFirst({ where: { id, vehicle: { userId } }, include: detailInclude });
}

async function requireIntervention(userId: string, id: string) {
  const found = await getIntervention(userId, id);
  if (!found) throw new NotFoundError("Intervention introuvable.");
  return found;
}

/**
 * Une intervention produit au plus une dépense, recalculée à chaque modification.
 * C'est l'unique point d'écriture de ces dépenses : pas de double comptage possible.
 */
async function syncExpense(tx: Tx, intervention: { id: string; vehicleId: string; date: Date; category: InterventionCategory; description: string; partsCostCents: number; laborCostCents: number }) {
  const amountCents = intervention.partsCostCents + intervention.laborCostCents;
  if (amountCents <= 0) {
    await tx.expense.deleteMany({ where: { interventionId: intervention.id } });
    return;
  }
  const data = {
    vehicleId: intervention.vehicleId,
    date: intervention.date,
    category: expenseCategoryFor(intervention.category),
    amountCents,
    label: `${INTERVENTION_LABELS[intervention.category]} — ${intervention.description}`.slice(0, 160),
  };
  await tx.expense.upsert({
    where: { interventionId: intervention.id },
    create: { ...data, interventionId: intervention.id },
    update: data,
  });
}

/** Échéance de suivi créée à partir des champs « prochaine échéance ». */
async function syncFollowUp(tx: Tx, intervention: { id: string; vehicleId: string; date: Date; category: InterventionCategory; nextDueDate: Date | null; nextDueMileage: number | null }) {
  if (!intervention.nextDueDate && intervention.nextDueMileage === null) {
    await tx.reminder.deleteMany({ where: { sourceInterventionId: intervention.id } });
    return;
  }
  const data = {
    vehicleId: intervention.vehicleId,
    title: `${INTERVENTION_LABELS[intervention.category]} (suite au ${formatShortDate(intervention.date)})`,
    category: intervention.category,
    dueDate: intervention.nextDueDate,
    dueMileage: intervention.nextDueMileage,
    origin: "UTILISATEUR" as const,
  };
  await tx.reminder.upsert({
    where: { sourceInterventionId: intervention.id },
    create: { ...data, sourceInterventionId: intervention.id },
    update: data,
  });
}

async function validComponentIds(tx: Tx, ids: string[]) {
  if (ids.length === 0) return [];
  const found = await tx.component.findMany({ where: { id: { in: ids } }, select: { id: true } });
  return found.map((c) => c.id);
}

async function storeFiles(userId: string, files: UploadedFile[]) {
  const storage = getStorage();
  const stored: (UploadedFile & { key: string })[] = [];
  for (const file of files) {
    const key = newStorageKey(userId, "documents");
    await storage.put(key, file.bytes, file.type);
    stored.push({ ...file, key });
  }
  return stored;
}

function columns(input: InterventionInput) {
  return {
    date: input.date,
    mileage: input.mileage,
    category: input.category,
    description: input.description,
    garage: input.garage,
    partsCostCents: input.partsCost,
    laborCostCents: input.laborCost,
    nextDueDate: input.nextDueDate,
    nextDueMileage: input.nextDueMileage,
    notes: input.notes,
  };
}

export async function createIntervention(
  userId: string,
  vehicleId: string,
  input: InterventionInput,
  files: UploadedFile[] = [],
  options: { completesReminderId?: string | null } = {},
) {
  const vehicle = await requireVehicle(userId, vehicleId);
  const stored = await storeFiles(userId, files);
  try {
    return await prisma.$transaction(async (tx) => {
      const componentIds = await validComponentIds(tx, input.componentIds);
      const created = await tx.intervention.create({
        data: {
          ...columns(input),
          vehicleId: vehicle.id,
          replacedParts: { create: input.replacedParts },
          components: { create: componentIds.map((componentId) => ({ componentId })) },
          documents: {
            create: stored.map((f) => ({
              userId,
              vehicleId: vehicle.id,
              category: f.type === "application/pdf" ? "FACTURE" : "PHOTO",
              title: f.fileName.replace(/\.[^.]+$/, "") || "Justificatif",
              fileName: f.fileName,
              mimeType: f.type,
              size: f.size,
              storageKey: f.key,
            })),
          },
        },
      });
      await syncExpense(tx, created);
      await syncFollowUp(tx, created);
      if (input.mileage > vehicle.mileage) {
        await tx.vehicle.update({ where: { id: vehicle.id }, data: { mileage: input.mileage } });
      }
      if (options.completesReminderId) {
        await tx.reminder.updateMany({
          where: { id: options.completesReminderId, vehicleId: vehicle.id, completedAt: null },
          data: { completedAt: input.date, completedById: created.id },
        });
      }
      return created;
    });
  } catch (error) {
    await Promise.all(stored.map((f) => getStorage().delete(f.key)));
    throw error;
  }
}

export async function updateIntervention(userId: string, id: string, input: InterventionInput, files: UploadedFile[] = []) {
  const existing = await requireIntervention(userId, id);
  const stored = await storeFiles(userId, files);
  try {
    return await prisma.$transaction(async (tx) => {
      const componentIds = await validComponentIds(tx, input.componentIds);
      await tx.replacedPart.deleteMany({ where: { interventionId: existing.id } });
      await tx.interventionComponent.deleteMany({ where: { interventionId: existing.id } });
      const updated = await tx.intervention.update({
        where: { id: existing.id },
        data: {
          ...columns(input),
          replacedParts: { create: input.replacedParts },
          components: { create: componentIds.map((componentId) => ({ componentId })) },
          documents: {
            create: stored.map((f) => ({
              userId,
              vehicleId: existing.vehicleId,
              category: f.type === "application/pdf" ? "FACTURE" : "PHOTO",
              title: f.fileName.replace(/\.[^.]+$/, "") || "Justificatif",
              fileName: f.fileName,
              mimeType: f.type,
              size: f.size,
              storageKey: f.key,
            })),
          },
        },
      });
      await syncExpense(tx, updated);
      await syncFollowUp(tx, updated);
      if (input.mileage > existing.vehicle.mileage) {
        await tx.vehicle.update({ where: { id: existing.vehicleId }, data: { mileage: input.mileage } });
      }
      return updated;
    });
  } catch (error) {
    await Promise.all(stored.map((f) => getStorage().delete(f.key)));
    throw error;
  }
}

/** Supprime l'intervention et sa dépense liée ; les documents restent rattachés au véhicule. */
export async function deleteIntervention(userId: string, id: string) {
  const existing = await requireIntervention(userId, id);
  await prisma.intervention.delete({ where: { id: existing.id } });
  return existing;
}
