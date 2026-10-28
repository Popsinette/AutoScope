"use client";

import { useState } from "react";
import { saveReminder } from "@/app/actions/reminders";
import { Button, ButtonLink } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { FormError } from "@/components/ui/form-error";
import { useFormAction } from "@/components/ui/use-form-action";
import { toDateInput } from "@/lib/format";
import { INTERVENTION_LABELS, ORIGIN_LABELS, enumOptions } from "@/lib/labels";

export function ReminderForm({
  vehicleId,
  currentMileage,
  initial,
  cancelHref,
}: {
  vehicleId: string;
  currentMileage: number;
  initial?: { id: string; title: string; category: string; dueDate: Date | null; dueMileage: number | null; origin: string; sourceReference: string | null; notes: string | null };
  cancelHref?: string;
}) {
  const { state, pending, onSubmit, fe } = useFormAction(saveReminder);
  const [origin, setOrigin] = useState(initial?.origin ?? "UTILISATEUR");
  return (
    <form onSubmit={onSubmit} className="grid gap-4 p-4 pt-0 sm:grid-cols-2 sm:p-5 sm:pt-0 lg:grid-cols-4">
      <input type="hidden" name="vehicleId" value={vehicleId} />
      {initial && <input type="hidden" name="id" value={initial.id} />}
      <div className="sm:col-span-2 lg:col-span-4">
        <FormError message={state?.error} />
      </div>
      <Field label="Intitulé" htmlFor="rem-title" required error={fe.title} className="sm:col-span-2">
        <Input id="rem-title" name="title" required maxLength={160} defaultValue={initial?.title} placeholder="Vidange, contrôle technique…" invalid={!!fe.title} />
      </Field>
      <Field label="Catégorie" htmlFor="rem-category" required error={fe.category}>
        <Select id="rem-category" name="category" required defaultValue={initial?.category ?? ""} placeholder="Choisir…" options={enumOptions(INTERVENTION_LABELS)} invalid={!!fe.category} />
      </Field>
      <Field label="Origine" htmlFor="rem-origin" error={fe.origin}>
        <Select id="rem-origin" name="origin" value={origin} onChange={(e) => setOrigin(e.target.value)} options={enumOptions(ORIGIN_LABELS)} />
      </Field>
      <Field label="Date limite" htmlFor="rem-date" error={fe.dueDate} hint="Date, kilométrage, ou les deux.">
        <Input id="rem-date" name="dueDate" type="date" defaultValue={toDateInput(initial?.dueDate)} invalid={!!fe.dueDate} />
      </Field>
      <Field label="Kilométrage limite (km)" htmlFor="rem-km" error={fe.dueMileage} hint={`Actuel : ${new Intl.NumberFormat("fr-FR").format(currentMileage)} km`}>
        <Input id="rem-km" name="dueMileage" type="number" inputMode="numeric" min={0} defaultValue={initial?.dueMileage ?? ""} invalid={!!fe.dueMileage} />
      </Field>
      {origin === "CONSTRUCTEUR_DOCUMENTE" && (
        <Field label="Source de la préconisation" htmlFor="rem-source" required error={fe.sourceReference} hint="Ex. : carnet d’entretien constructeur, page 12." className="sm:col-span-2">
          <Input id="rem-source" name="sourceReference" maxLength={300} defaultValue={initial?.sourceReference ?? ""} invalid={!!fe.sourceReference} />
        </Field>
      )}
      <Field label="Notes" htmlFor="rem-notes" error={fe.notes} className={origin === "CONSTRUCTEUR_DOCUMENTE" ? "sm:col-span-2" : "sm:col-span-2 lg:col-span-4"}>
        <Textarea id="rem-notes" name="notes" maxLength={2000} defaultValue={initial?.notes ?? ""} rows={1} className="min-h-10" />
      </Field>
      <div className="flex justify-end gap-2 sm:col-span-2 lg:col-span-4">
        {cancelHref && (
          <ButtonLink href={cancelHref} variant="secondary">
            Annuler
          </ButtonLink>
        )}
        <Button type="submit" disabled={pending}>
          {pending ? "Enregistrement…" : initial ? "Enregistrer" : "Créer l’échéance"}
        </Button>
      </div>
    </form>
  );
}
