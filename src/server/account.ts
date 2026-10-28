import "server-only";
import { prisma } from "./db";
import { getStorage } from "./storage";

/** Supprime tous les fichiers stockés d'un utilisateur (appelé avant la suppression du compte). */
export async function deleteUserFiles(userId: string) {
  await getStorage().deletePrefix(userId);
}

/** Export complet (RGPD) des données de l'utilisateur, hors contenu binaire des fichiers. */
export async function exportUserData(userId: string) {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { id: true, name: true, email: true, createdAt: true },
  });
  const vehicles = await prisma.vehicle.findMany({
    where: { userId },
    include: {
      interventions: { include: { replacedParts: true, components: { include: { component: { select: { slug: true, name: true } } } } } },
      expenses: true,
      reminders: true,
      documents: { select: { id: true, title: true, category: true, fileName: true, mimeType: true, size: true, interventionId: true, createdAt: true } },
    },
  });
  const models3d = await prisma.model3D.findMany({ where: { userId }, include: { mappings: true } });
  return {
    exportedAt: new Date().toISOString(),
    format: "carview-export-v1",
    note: "Les fichiers (documents, photos, modèles 3D) se téléchargent individuellement depuis l'application.",
    user,
    vehicles: vehicles.map(({ photoKey: _p, ...v }) => ({
      ...v,
      documents: v.documents,
    })),
    models3d: models3d.map(({ storageKey: _s, ...m }) => m),
  };
}
