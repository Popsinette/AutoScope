"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { checkUpload, DOCUMENT_TYPES, MAX_DOCUMENT_BYTES, safeFileName } from "@/lib/files";
import { documentSchema, fieldErrors, formToObject } from "@/lib/validation";
import { createDocument, deleteDocument } from "@/server/documents";
import { requireUser } from "@/server/session";
import type { FormState } from "@/components/ui/use-form-action";
import type { SimpleActionState } from "@/components/ui/confirm-action";
import { actionError } from "./helpers";

export async function uploadDocument(form: FormData): Promise<FormState> {
  const user = await requireUser();
  const vehicleId = String(form.get("vehicleId") ?? "");
  const parsed = documentSchema.safeParse(formToObject(form, ["file", "vehicleId"]));
  if (!parsed.success) return { error: "Certains champs sont à corriger.", fieldErrors: fieldErrors(parsed.error) };
  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) return { fieldErrors: { file: ["Choisissez un fichier."] } };
  const check = await checkUpload(file, DOCUMENT_TYPES, MAX_DOCUMENT_BYTES);
  if (!check.ok) return { fieldErrors: { file: [check.error] } };
  try {
    await createDocument(user.id, {
      vehicleId,
      interventionId: parsed.data.interventionId,
      title: parsed.data.title,
      category: parsed.data.category,
      file: { bytes: check.bytes, type: check.type, fileName: safeFileName(file.name), size: file.size },
    });
  } catch (error) {
    return actionError(error);
  }
  revalidatePath("/", "layout");
  redirect(`/documents?v=${vehicleId}&ok=document-ajoute`);
}

export async function deleteDocumentAction(_state: SimpleActionState, form: FormData): Promise<SimpleActionState> {
  const user = await requireUser();
  let vehicleId: string;
  try {
    vehicleId = (await deleteDocument(user.id, String(form.get("id")))).vehicleId;
  } catch (error) {
    return actionError(error);
  }
  revalidatePath("/", "layout");
  redirect(`/documents?v=${vehicleId}&ok=document-supprime`);
}
