"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { parseInterventionForm, readDocumentUploads } from "@/lib/form-parsing";
import { createIntervention, deleteIntervention, updateIntervention } from "@/server/interventions";
import { requireUser } from "@/server/session";
import type { FormState } from "@/components/ui/use-form-action";
import type { SimpleActionState } from "@/components/ui/confirm-action";
import { actionError } from "./helpers";

export async function saveIntervention(form: FormData): Promise<FormState> {
  const user = await requireUser();
  const id = form.get("id")?.toString() || null;
  const vehicleId = form.get("vehicleId")?.toString() || "";
  const parsed = parseInterventionForm(form);
  if (!parsed.ok) return { error: "Certains champs sont à corriger.", fieldErrors: parsed.fieldErrors };

  const uploads = await readDocumentUploads(form);
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
