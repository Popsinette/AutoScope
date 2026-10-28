import "server-only";
import { prisma } from "./db";
import { NotFoundError } from "./errors";
import { getStorage, newStorageKey } from "./storage";
import type { VehicleInput } from "@/lib/validation";

export async function listVehicles(userId: string) {
  return prisma.vehicle.findMany({
    where: { userId },
    orderBy: [{ isDemo: "asc" }, { createdAt: "asc" }],
  });
}

export async function getVehicle(userId: string, id: string) {
  return prisma.vehicle.findFirst({ where: { id, userId }, include: { model3d: true } });
}

export async function requireVehicle(userId: string, id: string) {
  const vehicle = await getVehicle(userId, id);
  if (!vehicle) throw new NotFoundError("Véhicule introuvable.");
  return vehicle;
}

export async function createVehicle(
  userId: string,
  input: VehicleInput,
  photo?: { bytes: Uint8Array; type: string },
) {
  let photoKey: string | null = null;
  if (photo) {
    photoKey = newStorageKey(userId, "photos");
    await getStorage().put(photoKey, photo.bytes, photo.type);
  }
  try {
    return await prisma.vehicle.create({
      data: { ...input, userId, photoKey, photoMime: photo?.type ?? null },
    });
  } catch (error) {
    if (photoKey) await getStorage().delete(photoKey);
    throw error;
  }
}

export async function updateVehicle(
  userId: string,
  id: string,
  input: VehicleInput,
  photo?: { bytes: Uint8Array; type: string } | "remove",
) {
  const existing = await requireVehicle(userId, id);
  const storage = getStorage();
  let photoKey = existing.photoKey;
  let photoMime = existing.photoMime;
  if (photo === "remove") {
    photoKey = null;
    photoMime = null;
  } else if (photo) {
    photoKey = newStorageKey(userId, "photos");
    photoMime = photo.type;
    await storage.put(photoKey, photo.bytes, photo.type);
  }
  const updated = await prisma.vehicle.update({ where: { id: existing.id }, data: { ...input, photoKey, photoMime } });
  if (existing.photoKey && existing.photoKey !== photoKey) await storage.delete(existing.photoKey);
  return updated;
}

export async function deleteVehicle(userId: string, id: string) {
  const existing = await requireVehicle(userId, id);
  const documents = await prisma.document.findMany({ where: { vehicleId: existing.id }, select: { storageKey: true } });
  await prisma.vehicle.delete({ where: { id: existing.id } });
  const storage = getStorage();
  await Promise.all([
    ...documents.map((d) => storage.delete(d.storageKey)),
    existing.photoKey ? storage.delete(existing.photoKey) : Promise.resolve(),
  ]);
}

export const vehicleLabel = (v: { make: string; model: string; trim?: string | null }) =>
  [v.make, v.model, v.trim].filter(Boolean).join(" ");
