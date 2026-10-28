import "server-only";
import { prisma } from "./db";

export async function listComponents() {
  return prisma.component.findMany({ orderBy: [{ family: "asc" }, { name: "asc" }] });
}

/**
 * Fiche composant enrichie des interventions et documents de l'utilisateur
 * (limités au véhicule fourni s'il y en a un).
 */
export async function getComponentSheet(userId: string, slug: string, vehicleId?: string | null) {
  const component = await prisma.component.findUnique({ where: { slug } });
  if (!component) return null;
  const vehicleFilter = { userId, ...(vehicleId ? { id: vehicleId } : {}) };
  const [interventions, documents] = await Promise.all([
    prisma.intervention.findMany({
      where: { vehicle: vehicleFilter, components: { some: { componentId: component.id } } },
      select: { id: true, date: true, mileage: true, category: true, description: true },
      orderBy: { date: "desc" },
      take: 10,
    }),
    prisma.document.findMany({
      where: {
        userId,
        ...(vehicleId ? { vehicleId } : {}),
        OR: [{ componentId: component.id }, { intervention: { components: { some: { componentId: component.id } } } }],
      },
      select: { id: true, title: true, mimeType: true },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
  ]);
  return { component, interventions, documents };
}
