"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { expenseSchema, fieldErrors, formToObject } from "@/lib/validation";
import { createExpense, deleteExpense, getExpense, updateExpense } from "@/server/expenses";
import { requireUser } from "@/server/session";
import type { FormState } from "@/components/ui/use-form-action";
import type { SimpleActionState } from "@/components/ui/confirm-action";
import { actionError } from "./helpers";

export async function saveExpense(form: FormData): Promise<FormState> {
  const user = await requireUser();
  const id = form.get("id")?.toString() || null;
  const parsed = expenseSchema.safeParse(formToObject(form, ["id", "vehicleId"]));
  if (!parsed.success) return { error: "Certains champs sont à corriger.", fieldErrors: fieldErrors(parsed.error) };
  let vehicleId: string;
  try {
    vehicleId = id
      ? (await updateExpense(user.id, id, parsed.data)).vehicleId
      : (await createExpense(user.id, String(form.get("vehicleId") ?? ""), parsed.data)).vehicleId;
  } catch (error) {
    return actionError(error);
  }
  revalidatePath("/", "layout");
  redirect(`/depenses?v=${vehicleId}&annee=${parsed.data.date.getUTCFullYear()}&ok=${id ? "depense-modifiee" : "depense-creee"}`);
}

export async function deleteExpenseAction(_state: SimpleActionState, form: FormData): Promise<SimpleActionState> {
  const user = await requireUser();
  const id = String(form.get("id"));
  const expense = await getExpense(user.id, id);
  try {
    await deleteExpense(user.id, id);
  } catch (error) {
    return actionError(error);
  }
  revalidatePath("/", "layout");
  redirect(`/depenses?v=${expense?.vehicleId ?? ""}&ok=depense-supprimee`);
}
