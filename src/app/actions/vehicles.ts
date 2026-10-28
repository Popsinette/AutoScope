"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { checkUpload, MAX_PHOTO_BYTES, PHOTO_TYPES } from "@/lib/files";
import { fieldErrors, formToObject, vehicleSchema } from "@/lib/validation";
import { requireUser } from "@/server/session";
import { createVehicle, deleteVehicle, updateVehicle } from "@/server/vehicles";
import type { FormState } from "@/components/ui/use-form-action";
import type { SimpleActionState } from "@/components/ui/confirm-action";
import { actionError } from "./helpers";

export async function saveVehicle(form: FormData): Promise<FormState> {
  const user = await requireUser();
  const id = form.get("id")?.toString() || null;
  const parsed = vehicleSchema.safeParse(formToObject(form, ["photo", "id", "removePhoto"]));
  if (!parsed.success) return { error: "Certains champs sont à corriger.", fieldErrors: fieldErrors(parsed.error) };

  let photo: { bytes: Uint8Array; type: string } | "remove" | undefined;
  const file = form.get("photo");
  if (file instanceof File && file.size > 0) {
    const check = await checkUpload(file, PHOTO_TYPES, MAX_PHOTO_BYTES);
    if (!check.ok) return { fieldErrors: { photo: [check.error] } };
    photo = { bytes: check.bytes, type: check.type };
  } else if (form.get("removePhoto") === "on") {
    photo = "remove";
  }

  let vehicleId: string;
  try {
    if (id) {
      vehicleId = (await updateVehicle(user.id, id, parsed.data, photo)).id;
    } else {
      vehicleId = (await createVehicle(user.id, parsed.data, photo === "remove" ? undefined : photo)).id;
    }
  } catch (error) {
    return actionError(error);
  }
  revalidatePath("/", "layout");
  redirect(`/garage/${vehicleId}?ok=${id ? "vehicule-modifie" : "vehicule-cree"}`);
}

export async function deleteVehicleAction(_state: SimpleActionState, form: FormData): Promise<SimpleActionState> {
  const user = await requireUser();
  try {
    await deleteVehicle(user.id, String(form.get("id")));
  } catch (error) {
    return actionError(error);
  }
  revalidatePath("/", "layout");
  redirect("/garage?ok=vehicule-supprime");
}
