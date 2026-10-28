"use client";

import { Upload } from "lucide-react";
import { uploadDocument } from "@/app/actions/documents";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/field";
import { FormError } from "@/components/ui/form-error";
import { useFormAction } from "@/components/ui/use-form-action";
import { DOCUMENT_LABELS, enumOptions } from "@/lib/labels";

export function UploadDocumentForm({ vehicleId, interventions }: { vehicleId: string; interventions: { id: string; label: string }[] }) {
  const { state, pending, onSubmit, fe } = useFormAction(uploadDocument);
  return (
    <form onSubmit={onSubmit} className="grid gap-4 p-4 pt-0 sm:grid-cols-2 sm:p-5 sm:pt-0">
      <input type="hidden" name="vehicleId" value={vehicleId} />
      <div className="sm:col-span-2">
        <FormError message={state?.error} />
      </div>
      <Field label="Titre" htmlFor="doc-title" required error={fe.title}>
        <Input id="doc-title" name="title" required maxLength={160} invalid={!!fe.title} placeholder="Facture révision 2026" />
      </Field>
      <Field label="Catégorie" htmlFor="doc-category" required error={fe.category}>
        <Select id="doc-category" name="category" required defaultValue="FACTURE" options={enumOptions(DOCUMENT_LABELS)} invalid={!!fe.category} />
      </Field>
      <Field label="Intervention liée" htmlFor="doc-intervention" error={fe.interventionId}>
        <Select id="doc-intervention" name="interventionId" defaultValue="" options={interventions.map((i) => ({ value: i.id, label: i.label }))} placeholder="Aucune" />
      </Field>
      <Field label="Fichier" htmlFor="doc-file" required error={fe.file} hint="PDF, JPEG, PNG ou WebP — 10 Mo maximum.">
        <Input id="doc-file" name="file" type="file" required accept="application/pdf,image/jpeg,image/png,image/webp" invalid={!!fe.file} className="file:mr-3 file:rounded-md file:border-0 file:bg-surface-3 file:px-3 file:py-1 file:text-ink" />
      </Field>
      <div className="flex justify-end sm:col-span-2">
        <Button type="submit" disabled={pending}>
          <Upload size={15} aria-hidden /> {pending ? "Envoi…" : "Ajouter le document"}
        </Button>
      </div>
    </form>
  );
}
