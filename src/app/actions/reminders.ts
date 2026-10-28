"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { fieldErrors, formToObject, reminderSchema } from "@/lib/validation";
import { createReminder, deleteReminder, setReminderCompleted, updateReminder } from "@/server/reminders";
import { requireUser } from "@/server/session";
import type { FormState } from "@/components/ui/use-form-action";
import type { SimpleActionState } from "@/components/ui/confirm-action";
import { actionError } from "./helpers";

export async function saveReminder(form: FormData): Promise<FormState> {
  const user = await requireUser();
  const id = form.get("id")?.toString() || null;
  const parsed = reminderSchema.safeParse(formToObject(form, ["id", "vehicleId"]));
  if (!parsed.success) return { error: "Certains champs sont à corriger.", fieldErrors: fieldErrors(parsed.error) };
  let vehicleId: string;
  try {
    vehicleId = id
      ? (await updateReminder(user.id, id, parsed.data)).vehicleId
      : (await createReminder(user.id, String(form.get("vehicleId") ?? ""), parsed.data)).vehicleId;
  } catch (error) {
    return actionError(error);
  }
  revalidatePath("/", "layout");
  redirect(`/echeances?v=${vehicleId}&ok=${id ? "echeance-modifiee" : "echeance-creee"}`);
}

export async function toggleReminderAction(form: FormData) {
  const user = await requireUser();
  await setReminderCompleted(user.id, String(form.get("id")), form.get("completed") === "1");
  revalidatePath("/", "layout");
}

export async function deleteReminderAction(_state: SimpleActionState, form: FormData): Promise<SimpleActionState> {
  const user = await requireUser();
  try {
    await deleteReminder(user.id, String(form.get("id")));
  } catch (error) {
    return actionError(error);
  }
  revalidatePath("/", "layout");
  redirect(`/echeances?ok=echeance-supprimee`);
}
