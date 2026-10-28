"use client";

import { Lock } from "lucide-react";
import { saveVehicle } from "@/app/actions/vehicles";
import { Button, ButtonLink } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { FormError } from "@/components/ui/form-error";
import { useFormAction } from "@/components/ui/use-form-action";
import { ENERGY_LABELS, TRANSMISSION_LABELS, enumOptions } from "@/lib/labels";
import { toDateInput } from "@/lib/format";

export interface VehicleFormValues {
  id?: string;
  make?: string;
  model?: string;
  trim?: string | null;
  year?: number;
  engine?: string | null;
  energy?: string;
  transmission?: string;
  mileage?: number;
  acquiredAt?: Date | null;
  registration?: string | null;
  vin?: string | null;
  notes?: string | null;
  hasPhoto?: boolean;
}

export function VehicleForm({ initial = {}, cancelHref }: { initial?: VehicleFormValues; cancelHref: string }) {
  const { state, pending, onSubmit, fe } = useFormAction(saveVehicle);
  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6" encType="multipart/form-data">
      {initial.id && <input type="hidden" name="id" value={initial.id} />}
      <FormError message={state?.error} />

      <fieldset className="card grid gap-4 p-4 sm:grid-cols-2 sm:p-5 lg:grid-cols-4">
        <legend className="sr-only">Identification</legend>
        <h2 className="text-sm font-semibold sm:col-span-2 lg:col-span-4">Identification</h2>
        <Field label="Marque" htmlFor="make" required error={fe.make}>
          <Input id="make" name="make" defaultValue={initial.make} required maxLength={60} invalid={!!fe.make} placeholder="Porsche" />
        </Field>
        <Field label="Modèle" htmlFor="model" required error={fe.model}>
          <Input id="model" name="model" defaultValue={initial.model} required maxLength={80} invalid={!!fe.model} placeholder="911 GT3" />
        </Field>
        <Field label="Finition" htmlFor="trim" error={fe.trim}>
          <Input id="trim" name="trim" defaultValue={initial.trim ?? ""} maxLength={80} placeholder="(992), Touring…" />
        </Field>
        <Field label="Année" htmlFor="year" required error={fe.year}>
          <Input id="year" name="year" type="number" inputMode="numeric" min={1886} max={new Date().getFullYear() + 1} defaultValue={initial.year} required invalid={!!fe.year} />
        </Field>
        <Field label="Motorisation" htmlFor="engine" error={fe.engine} className="sm:col-span-2">
          <Input id="engine" name="engine" defaultValue={initial.engine ?? ""} maxLength={120} placeholder="6 cylindres à plat 4,0 L" />
        </Field>
        <Field label="Énergie" htmlFor="energy" required error={fe.energy}>
          <Select id="energy" name="energy" defaultValue={initial.energy ?? ""} options={enumOptions(ENERGY_LABELS)} placeholder="Choisir…" required invalid={!!fe.energy} />
        </Field>
        <Field label="Transmission" htmlFor="transmission" required error={fe.transmission}>
          <Select id="transmission" name="transmission" defaultValue={initial.transmission ?? ""} options={enumOptions(TRANSMISSION_LABELS)} placeholder="Choisir…" required invalid={!!fe.transmission} />
        </Field>
      </fieldset>

      <fieldset className="card grid gap-4 p-4 sm:grid-cols-2 sm:p-5 lg:grid-cols-4">
        <legend className="sr-only">Usage</legend>
        <h2 className="text-sm font-semibold sm:col-span-2 lg:col-span-4">Usage et photo</h2>
        <Field label="Kilométrage actuel (km)" htmlFor="mileage" required error={fe.mileage}>
          <Input id="mileage" name="mileage" type="number" inputMode="numeric" min={0} defaultValue={initial.mileage} required invalid={!!fe.mileage} />
        </Field>
        <Field label="Date d'acquisition" htmlFor="acquiredAt" error={fe.acquiredAt}>
          <Input id="acquiredAt" name="acquiredAt" type="date" defaultValue={toDateInput(initial.acquiredAt)} invalid={!!fe.acquiredAt} />
        </Field>
        <Field label="Photo" htmlFor="photo" error={fe.photo} hint="JPEG, PNG ou WebP, 8 Mo maximum." className="sm:col-span-2">
          <Input id="photo" name="photo" type="file" accept="image/jpeg,image/png,image/webp" invalid={!!fe.photo} className="file:mr-3 file:rounded-md file:border-0 file:bg-surface-3 file:px-3 file:py-1 file:text-ink" />
          {initial.hasPhoto && (
            <label className="mt-1 flex items-center gap-2 text-xs text-muted">
              <input type="checkbox" name="removePhoto" className="accent-accent" /> Supprimer la photo actuelle
            </label>
          )}
        </Field>
      </fieldset>

      <fieldset className="card grid gap-4 p-4 sm:grid-cols-2 sm:p-5">
        <legend className="sr-only">Informations privées</legend>
        <div className="sm:col-span-2">
          <h2 className="flex items-center gap-2 text-sm font-semibold">
            <Lock size={14} aria-hidden /> Informations privées
          </h2>
          <p className="mt-1 text-xs text-muted">Facultatives. Visibles uniquement par vous, jamais partagées ni publiées.</p>
        </div>
        <Field label="Immatriculation" htmlFor="registration" error={fe.registration}>
          <Input id="registration" name="registration" defaultValue={initial.registration ?? ""} maxLength={20} autoComplete="off" placeholder="AA-123-AA" />
        </Field>
        <Field label="Numéro VIN" htmlFor="vin" error={fe.vin} hint="17 caractères.">
          <Input id="vin" name="vin" defaultValue={initial.vin ?? ""} maxLength={17} autoComplete="off" className="uppercase" invalid={!!fe.vin} />
        </Field>
        <Field label="Notes personnelles" htmlFor="notes" error={fe.notes} className="sm:col-span-2">
          <Textarea id="notes" name="notes" defaultValue={initial.notes ?? ""} maxLength={4000} />
        </Field>
      </fieldset>

      <div className="flex justify-end gap-2">
        <ButtonLink href={cancelHref} variant="secondary">
          Annuler
        </ButtonLink>
        <Button type="submit" disabled={pending}>
          {pending ? "Enregistrement…" : initial.id ? "Enregistrer les modifications" : "Ajouter le véhicule"}
        </Button>
      </div>
    </form>
  );
}
