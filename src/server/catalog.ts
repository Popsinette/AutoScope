import "server-only";
import type { ComponentFamily } from "@/generated/prisma/enums";
import { prisma } from "./db";

export async function listCatalog(filters: { family?: ComponentFamily | null; q?: string | null }) {
  return prisma.catalogPart.findMany({
    where: {
      ...(filters.family ? { family: filters.family } : {}),
      ...(filters.q
        ? {
            OR: [
              { name: { contains: filters.q, mode: "insensitive" } },
              { description: { contains: filters.q, mode: "insensitive" } },
              { reference: { contains: filters.q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    include: { compatibility: true },
    orderBy: [{ family: "asc" }, { name: "asc" }],
  });
}

/**
 * Compatibilité confirmée uniquement si une ligne explicite correspond au
 * véhicule (marque + modèle + année). Sinon : « compatibilité à vérifier ».
 */
export function compatibilityFor(
  compat: { make: string; model: string; yearFrom: number | null; yearTo: number | null; source: string }[],
  vehicle: { make: string; model: string; year: number } | null,
) {
  if (!vehicle) return null;
  const norm = (s: string) => s.trim().toLowerCase();
  return (
    compat.find(
      (c) =>
        norm(c.make) === norm(vehicle.make) &&
        norm(c.model) === norm(vehicle.model) &&
        (c.yearFrom === null || vehicle.year >= c.yearFrom) &&
        (c.yearTo === null || vehicle.year <= c.yearTo),
    ) ?? null
  );
}
