"use client";

import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { FormError } from "@/components/ui/form-error";
import { useFormAction, type FormState } from "@/components/ui/use-form-action";

export function ImportModelForm({
  vehicleId,
  defaultName,
  action,
}: {
  vehicleId: string;
  defaultName: string;
  action: (form: FormData) => Promise<FormState>;
}) {
  const { state, pending, onSubmit, fe } = useFormAction(action);
  return (
    <form onSubmit={onSubmit} className="grid gap-4 p-4 pt-0 sm:grid-cols-2 sm:p-5 sm:pt-0">
      <input type="hidden" name="vehicleId" value={vehicleId} />
      <div className="sm:col-span-2">
        <FormError message={state?.error} />
      </div>
      <Field label="Fichier GLB" htmlFor="file" required error={fe.file} hint="glTF 2.0 binaire (.glb), 60 Mo maximum, sans compression Draco." className="sm:col-span-2">
        <Input id="file" name="file" type="file" accept=".glb,model/gltf-binary" required invalid={!!fe.file} className="file:mr-3 file:rounded-md file:border-0 file:bg-surface-3 file:px-3 file:py-1 file:text-ink" />
      </Field>
      <Field label="Nom du modèle" htmlFor="name" required error={fe.name}>
        <Input id="name" name="name" defaultValue={defaultName} maxLength={120} required invalid={!!fe.name} />
      </Field>
      <Field label="Licence / droit d’usage" htmlFor="license" required error={fe.license}>
        <Input id="license" name="license" maxLength={200} required placeholder="CC BY 4.0, création personnelle…" invalid={!!fe.license} />
      </Field>
      <Field label="Provenance" htmlFor="source" required error={fe.source} className="sm:col-span-2">
        <Input id="source" name="source" maxLength={300} required placeholder="Auteur, URL de la page d’origine…" invalid={!!fe.source} />
      </Field>
      <label className="flex items-start gap-2 text-sm sm:col-span-2">
        <input type="checkbox" name="illustrative" defaultChecked className="mt-1 accent-accent" />
        <span>
          Modèle illustratif
          <span className="block text-xs text-muted">Décochez uniquement si la géométrie correspond fidèlement à ce véhicule.</span>
        </span>
      </label>
      <label className="flex items-start gap-2 text-sm sm:col-span-2">
        <input type="checkbox" name="rights" required className="mt-1 accent-accent" aria-invalid={!!fe.rights || undefined} />
        <span>Je confirme disposer du droit d’utiliser ce fichier.</span>
      </label>
      {fe.rights && <p className="text-xs text-danger sm:col-span-2" role="alert">{fe.rights[0]}</p>}
      <div className="flex justify-end sm:col-span-2">
        <Button type="submit" disabled={pending}>
          <Upload size={15} aria-hidden /> {pending ? "Analyse du fichier…" : "Importer"}
        </Button>
      </div>
    </form>
  );
}
