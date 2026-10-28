"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { checkUpload, DOCUMENT_TYPES, MAX_DOCUMENT_BYTES, safeFileName } from "@/lib/files";
import { fieldErrors, formToObject, interventionSchema } from "@/lib/validation";
import { createIntervention, deleteIntervention, updateIntervention, type UploadedFile } from "@/server/interventions";
import { requireUser } from "@/server/session";
import type { FormState } from "@/components/ui/use-form-action";
import type { SimpleActionState } from "@/components/ui/confirm-action";
import { actionError } from "./helpers";

const MAX_FILES = 5;

function parseParts(raw: FormDataEntryValue | null) {
  try {
    const parsed = JSON.parse(String(raw ?? "[]"));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function readFiles(form: FormData): Promise<{ files: UploadedFile[] } | { error: string }> {
  const entries = form.getAll("files").filter((f): f is File => f instanceof File && f.size > 0);
  if (entries.length > MAX_FILES) return { error: `${MAX_FILES} fichiers maximum par envoi.` };
  const files: UploadedFile[] = [];
  for (const file of entries) {
    const check = await checkUpload(file, DOCUMENT_TYPES, MAX_DOCUMENT_BYTES);
    if (!check.ok) return { error: `${file.name} : ${check.error}` };
    files.push({ bytes: check.bytes, type: check.type, fileName: safeFileName(file.name), size: file.size });
  }
  return { files };
}

export async function saveIntervention(form: FormData): Promise<FormState> {
  const user = await requireUser();
  const id = form.get("id")?.toString() || null;
  const vehicleId = form.get("vehicleId")?.toString() || "";
  const parsed = interventionSchema.safeParse({
    ...formToObject(form, ["id", "vehicleId", "files", "replacedParts", "componentIds", "completesReminderId"]),
    replacedParts: parseParts(form.get("replacedParts")).filter((p) => p && typeof p.name === "string" && p.name.trim() !== ""),
    componentIds: form.getAll("componentIds").map(String),
  });
  if (!parsed.success) return { error: "Certains champs sont à corriger.", fieldErrors: fieldErrors(parsed.error) };

  const uploads = await readFiles(form);
  if ("error" in uploads) return { fieldErrors: { files: [uploads.error] } };

  let interventionId: string;
  try {
    if (id) {
      interventionId = (await updateIntervention(user.id, id, parsed.data, uploads.files)).id;
    } else {
      interventionId = (
        await createIntervention(user.id, vehicleId, parsed.data, uploads.files, {
          completesReminderId: form.get("completesReminderId")?.toString() || null,
        })
      ).id;
    }
  } catch (error) {
    return actionError(error);
  }
  revalidatePath("/", "layout");
  redirect(`/entretiens/${interventionId}?ok=${id ? "entretien-modifie" : "entretien-cree"}`);
}

export async function deleteInterventionAction(_state: SimpleActionState, form: FormData): Promise<SimpleActionState> {
  const user = await requireUser();
  let vehicleId: string;
  try {
    vehicleId = (await deleteIntervention(user.id, String(form.get("id")))).vehicleId;
  } catch (error) {
    return actionError(error);
  }
  revalidatePath("/", "layout");
  redirect(`/entretiens?v=${vehicleId}&ok=entretien-supprime`);
}
