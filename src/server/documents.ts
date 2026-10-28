import "server-only";
import type { DocumentCategory } from "@/generated/prisma/enums";
import { prisma } from "./db";
import { NotFoundError } from "./errors";
import { getStorage, newStorageKey } from "./storage";
import { requireVehicle } from "./vehicles";

export async function listDocuments(
  userId: string,
  filters: { vehicleId?: string | null; category?: DocumentCategory | null; q?: string | null } = {},
) {
  return prisma.document.findMany({
    where: {
      userId,
      ...(filters.vehicleId ? { vehicleId: filters.vehicleId } : {}),
      ...(filters.category ? { category: filters.category } : {}),
      ...(filters.q
        ? {
            OR: [
              { title: { contains: filters.q, mode: "insensitive" } },
              { fileName: { contains: filters.q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    include: {
      vehicle: { select: { id: true, make: true, model: true, trim: true } },
      intervention: { select: { id: true, date: true, category: true, description: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getDocument(userId: string, id: string) {
  return prisma.document.findFirst({ where: { id, userId } });
}

export async function createDocument(
  userId: string,
  input: {
    vehicleId: string;
    interventionId: string | null;
    title: string;
    category: DocumentCategory;
    file: { bytes: Uint8Array; type: string; fileName: string; size: number };
  },
) {
  const vehicle = await requireVehicle(userId, input.vehicleId);
  if (input.interventionId) {
    const intervention = await prisma.intervention.findFirst({
      where: { id: input.interventionId, vehicleId: vehicle.id },
      select: { id: true },
    });
    if (!intervention) throw new NotFoundError("Intervention introuvable pour ce véhicule.");
  }
  const key = newStorageKey(userId, "documents");
  await getStorage().put(key, input.file.bytes, input.file.type);
  try {
    return await prisma.document.create({
      data: {
        userId,
        vehicleId: vehicle.id,
        interventionId: input.interventionId,
        category: input.category,
        title: input.title,
        fileName: input.file.fileName,
        mimeType: input.file.type,
        size: input.file.size,
        storageKey: key,
      },
    });
  } catch (error) {
    await getStorage().delete(key);
    throw error;
  }
}

export async function deleteDocument(userId: string, id: string) {
  const doc = await getDocument(userId, id);
  if (!doc) throw new NotFoundError("Document introuvable.");
  await prisma.document.delete({ where: { id: doc.id } });
  await getStorage().delete(doc.storageKey);
  return doc;
}
