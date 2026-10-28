"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { inspectGlb } from "@/lib/gltf";
import { checkUpload, MAX_MODEL_BYTES } from "@/lib/files";
import { fieldErrors } from "@/lib/validation";
import { detachModel, importGlbModel, saveMappings } from "@/server/models3d";
import { requireUser } from "@/server/session";
import type { FormState } from "@/components/ui/use-form-action";
import { actionError } from "./helpers";

const importSchema = z.object({
  name: z.string().trim().min(1, "Nom obligatoire.").max(120),
  source: z.string().trim().min(3, "Indiquez la provenance du fichier.").max(300),
  license: z.string().trim().min(2, "Indiquez la licence ou le droit d’usage.").max(200),
  rights: z.literal("on", { error: "Vous devez confirmer disposer du droit d’utiliser ce modèle." }),
});

export async function importModel(form: FormData): Promise<FormState> {
  const user = await requireUser();
  const parsed = importSchema.safeParse({
    name: form.get("name") ?? "",
    source: form.get("source") ?? "",
    license: form.get("license") ?? "",
    rights: form.get("rights") ?? undefined,
  });
  if (!parsed.success) return { error: "Certains champs sont à corriger.", fieldErrors: fieldErrors(parsed.error) };
  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) return { fieldErrors: { file: ["Choisissez un fichier .glb."] } };
  const check = await checkUpload(file, ["model/gltf-binary"], MAX_MODEL_BYTES);
  if (!check.ok) return { fieldErrors: { file: [check.error === "Type de fichier non accepté." ? "Seuls les fichiers GLB (glTF binaire) sont acceptés." : check.error] } };
  const inspection = inspectGlb(check.bytes);
  if (!inspection.ok) return { fieldErrors: { file: [inspection.error] } };
  if (inspection.nodeNames.length === 0) return { fieldErrors: { file: ["Le modèle ne contient aucun objet nommé : impossible d’associer des composants."] } };
  let modelId: string;
  try {
    modelId = (
      await importGlbModel(user.id, String(form.get("vehicleId") ?? ""), {
        name: parsed.data.name,
        source: parsed.data.source,
        license: parsed.data.license,
        isIllustrative: form.get("illustrative") === "on",
        bytes: check.bytes,
        nodeNames: inspection.nodeNames,
      })
    ).id;
  } catch (error) {
    return actionError(error);
  }
  revalidatePath("/", "layout");
  redirect(`/vue-3d/correspondances/${modelId}?ok=modele-importe`);
}

export async function saveMappingsAction(form: FormData): Promise<FormState> {
  const user = await requireUser();
  const modelId = String(form.get("modelId") ?? "");
  const entries: { nodeName: string; slug: string }[] = [];
  for (const [key, value] of form.entries()) {
    if (key.startsWith("node:") && typeof value === "string" && value) entries.push({ nodeName: key.slice(5), slug: value });
  }
  try {
    await saveMappings(user.id, modelId, entries);
  } catch (error) {
    return actionError(error);
  }
  revalidatePath("/", "layout");
  redirect(`/vue-3d/correspondances/${modelId}?ok=correspondances-enregistrees`);
}

export async function detachModelAction(_state: { error?: string } | undefined, form: FormData) {
  const user = await requireUser();
  const vehicleId = String(form.get("vehicleId") ?? "");
  try {
    await detachModel(user.id, vehicleId);
  } catch (error) {
    return actionError(error);
  }
  revalidatePath("/", "layout");
  redirect(`/vue-3d?v=${vehicleId}`);
}
