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

export { compatibilityFor } from "@/lib/catalog";
