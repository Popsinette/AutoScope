"use client";

import { Button, ButtonLink } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { FormError } from "@/components/ui/form-error";
import { useFormAction, type FormState } from "@/components/ui/use-form-action";
import { centsToInput, toDateInput } from "@/lib/format";
import { EXPENSE_LABELS, enumOptions } from "@/lib/labels";

export function ExpenseForm({
  vehicleId,
  initial,
  cancelHref,
  action,
}: {
  vehicleId: string;
  initial?: { id: string; date: Date; category: string; amountCents: number; label: string; notes: string | null };
  cancelHref?: string;
  action: (form: FormData) => Promise<FormState>;
}) {
  const { state, pending, onSubmit, fe } = useFormAction(action);
  return (
    <form onSubmit={onSubmit} className="grid gap-4 p-4 pt-0 sm:grid-cols-2 sm:p-5 sm:pt-0 lg:grid-cols-4">
      <input type="hidden" name="vehicleId" value={vehicleId} />
      {initial && <input type="hidden" name="id" value={initial.id} />}
      <div className="sm:col-span-2 lg:col-span-4">
        <FormError message={state?.error} />
      </div>
      <Field label="Date" htmlFor="exp-date" required error={fe.date}>
        <Input id="exp-date" name="date" type="date" required defaultValue={toDateInput(initial?.date ?? new Date())} invalid={!!fe.date} />
      </Field>
      <Field label="Catégorie" htmlFor="exp-category" required error={fe.category}>
        <Select id="exp-category" name="category" required defaultValue={initial?.category ?? ""} placeholder="Choisir…" options={enumOptions(EXPENSE_LABELS)} invalid={!!fe.category} />
      </Field>
      <Field label="Montant (€)" htmlFor="exp-amount" required error={fe.amount}>
        <Input id="exp-amount" name="amount" inputMode="decimal" required defaultValue={initial ? centsToInput(initial.amountCents) : ""} placeholder="0,00" invalid={!!fe.amount} />
      </Field>
      <Field label="Libellé" htmlFor="exp-label" required error={fe.label}>
        <Input id="exp-label" name="label" required maxLength={160} defaultValue={initial?.label} placeholder="Plein, assurance…" invalid={!!fe.label} />
      </Field>
      <Field label="Notes" htmlFor="exp-notes" error={fe.notes} className="sm:col-span-2 lg:col-span-3">
        <Textarea id="exp-notes" name="notes" maxLength={2000} defaultValue={initial?.notes ?? ""} className="min-h-10" rows={1} />
      </Field>
      <div className="flex items-end justify-end gap-2">
        {cancelHref && (
          <ButtonLink href={cancelHref} variant="secondary">
            Annuler
          </ButtonLink>
        )}
        <Button type="submit" disabled={pending}>
          {pending ? "Enregistrement…" : initial ? "Enregistrer" : "Ajouter la dépense"}
        </Button>
      </div>
    </form>
  );
}
