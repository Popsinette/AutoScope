import "server-only";
import { prisma } from "./db";
import { NotFoundError } from "./errors";
import { getStorage, newStorageKey } from "./storage";
import { requireVehicle } from "./vehicles";
import { DEMO_MODEL_ID } from "@/lib/demo-model";
import { sanitizeNodeName } from "@/lib/gltf";
import { explorerModelFromCatalog, GENERIC_MODEL } from "@/lib/vehicle-models";
import type { ExplorerModel } from "@/components/viewer3d/types";

/** Modèle accessible : modèle intégré (userId null) ou modèle importé par l'utilisateur. */
export async function getAccessibleModel(userId: string, id: string) {
  return prisma.model3D.findFirst({
    where: { id, OR: [{ userId: null }, { userId }] },
    include: { mappings: { include: { component: { select: { slug: true } } } } },
  });
}

export async function getExplorerModel(userId: string, id: string): Promise<ExplorerModel | null> {
  // Le véhicule de démonstration utilise désormais le modèle de présentation réaliste du catalogue.
  if (id === DEMO_MODEL_ID) return explorerModelFromCatalog(GENERIC_MODEL);
  const model = await getAccessibleModel(userId, id);
  if (!model) return null;
  return {
    id: model.id,
    kind: model.kind,
    name: model.name,
    url: model.kind === "GLB" ? `/api/modeles/${model.id}?v=${model.updatedAt.getTime()}` : null,
    isIllustrative: model.isIllustrative,
    source: model.source,
    license: model.license,
    // GLTFLoader normalise les noms de nœuds : on applique la même règle à la table.
    mapping: Object.fromEntries(
      model.mappings.map((m) => [model.kind === "GLB" ? sanitizeNodeName(m.nodeName) : m.nodeName, m.component.slug]),
    ),
  };
}

export const getDemoExplorerModel = (userId: string) => getExplorerModel(userId, DEMO_MODEL_ID);

export async function getOwnedModel(userId: string, id: string) {
  const model = await prisma.model3D.findFirst({ where: { id, userId }, include: { mappings: true, vehicles: { select: { id: true } } } });
  if (!model) throw new NotFoundError("Modèle introuvable.");
  return model;
}

export async function importGlbModel(
  userId: string,
  vehicleId: string,
  input: { name: string; source: string; license: string; isIllustrative: boolean; bytes: Uint8Array; nodeNames: string[] },
) {
  const vehicle = await requireVehicle(userId, vehicleId);
  const key = newStorageKey(userId, "models");
  await getStorage().put(key, input.bytes, "model/gltf-binary");
  try {
    const model = await prisma.model3D.create({
      data: {
        userId,
        name: input.name,
        kind: "GLB",
        storageKey: key,
        fileSize: input.bytes.byteLength,
        source: input.source,
        license: input.license,
        isIllustrative: input.isIllustrative,
        nodeNames: input.nodeNames,
      },
    });
    const previous = vehicle.model3d?.userId === userId ? vehicle.model3d : null;
    await prisma.vehicle.update({ where: { id: vehicle.id }, data: { model3dId: model.id } });
    if (previous) await deleteModelIfUnused(userId, previous.id);
    return model;
  } catch (error) {
    await getStorage().delete(key);
    throw error;
  }
}

/** Remplace la table de correspondance (nœuds inconnus du fichier et fiches inexistantes ignorés). */
export async function saveMappings(userId: string, modelId: string, entries: { nodeName: string; slug: string }[]) {
  const model = await getOwnedModel(userId, modelId);
  const nodes = new Set(model.nodeNames);
  const components = await prisma.component.findMany({ where: { slug: { in: entries.map((e) => e.slug) } }, select: { id: true, slug: true } });
  const idBySlug = new Map(components.map((c) => [c.slug, c.id]));
  const data = entries
    .filter((e) => nodes.has(e.nodeName) && idBySlug.has(e.slug))
    .map((e) => ({ model3dId: model.id, nodeName: e.nodeName, componentId: idBySlug.get(e.slug)! }));
  await prisma.$transaction([
    prisma.componentMapping.deleteMany({ where: { model3dId: model.id } }),
    prisma.componentMapping.createMany({ data }),
    prisma.model3D.update({ where: { id: model.id }, data: { updatedAt: new Date() } }),
  ]);
  return data.length;
}

export async function detachModel(userId: string, vehicleId: string) {
  const vehicle = await requireVehicle(userId, vehicleId);
  await prisma.vehicle.update({ where: { id: vehicle.id }, data: { model3dId: null } });
  if (vehicle.model3d?.userId === userId) await deleteModelIfUnused(userId, vehicle.model3d.id);
}

async function deleteModelIfUnused(userId: string, modelId: string) {
  const model = await prisma.model3D.findFirst({ where: { id: modelId, userId }, include: { _count: { select: { vehicles: true } } } });
  if (!model || model._count.vehicles > 0) return;
  await prisma.model3D.delete({ where: { id: model.id } });
  if (model.storageKey) await getStorage().delete(model.storageKey);
}
