"use client";

import { Plus, Search, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { saveIntervention } from "@/app/actions/interventions";
import { Button, ButtonLink } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { FormError } from "@/components/ui/form-error";
import { useFormAction } from "@/components/ui/use-form-action";
import { centsToInput, formatEuros, parseEurosToCents, toDateInput } from "@/lib/format";
import { FAMILY_LABELS, INTERVENTION_LABELS, enumOptions } from "@/lib/labels";

export interface ComponentOption {
  id: string;
  name: string;
  family: keyof typeof FAMILY_LABELS;
}

export interface InterventionFormValues {
  id?: string;
  date?: Date;
  mileage?: number;
  category?: string;
  description?: string;
  garage?: string | null;
  partsCostCents?: number;
  laborCostCents?: number;
  nextDueDate?: Date | null;
  nextDueMileage?: number | null;
  notes?: string | null;
  replacedParts?: { name: string; reference: string | null; quantity: number }[];
  componentIds?: string[];
}

type PartRow = { key: number; name: string; reference: string; quantity: number };

export function InterventionForm({
  vehicleId,
  initial = {},
  components,
  cancelHref,
  completesReminderId,
}: {
  vehicleId: string;
  initial?: InterventionFormValues;
  components: ComponentOption[];
  cancelHref: string;
  completesReminderId?: string;
}) {
  const { state, pending, onSubmit, fe } = useFormAction(saveIntervention);
  const [parts, setParts] = useState<PartRow[]>(
    (initial.replacedParts ?? []).map((p, i) => ({ key: i, name: p.name, reference: p.reference ?? "", quantity: p.quantity })),
  );
  const [selected, setSelected] = useState<Set<string>>(new Set(initial.componentIds ?? []));
  const [componentQuery, setComponentQuery] = useState("");
  const [partsCost, setPartsCost] = useState(centsToInput(initial.partsCostCents ?? 0));
  const [laborCost, setLaborCost] = useState(centsToInput(initial.laborCostCents ?? 0));
  const total = (parseEurosToCents(partsCost) ?? 0) + (parseEurosToCents(laborCost) ?? 0);

  const filteredComponents = useMemo(() => {
    const q = componentQuery.trim().toLowerCase();
    return components.filter((c) => !q || c.name.toLowerCase().includes(q) || FAMILY_LABELS[c.family].toLowerCase().includes(q));
  }, [componentQuery, components]);

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6">
      <input type="hidden" name="vehicleId" value={vehicleId} />
      {initial.id && <input type="hidden" name="id" value={initial.id} />}
      {completesReminderId && <input type="hidden" name="completesReminderId" value={completesReminderId} />}
      <input type="hidden" name="replacedParts" value={JSON.stringify(parts.map(({ name, reference, quantity }) => ({ name, reference, quantity })))} />
      <FormError message={state?.error} />

      <fieldset className="card grid gap-4 p-4 sm:grid-cols-2 sm:p-5 lg:grid-cols-4">
        <legend className="sr-only">Intervention</legend>
        <h2 className="text-sm font-semibold sm:col-span-2 lg:col-span-4">Intervention</h2>
        <Field label="Date" htmlFor="date" required error={fe.date}>
          <Input id="date" name="date" type="date" required defaultValue={toDateInput(initial.date ?? new Date())} invalid={!!fe.date} />
        </Field>
        <Field label="Kilométrage (km)" htmlFor="mileage" required error={fe.mileage}>
          <Input id="mileage" name="mileage" type="number" inputMode="numeric" min={0} required defaultValue={initial.mileage} invalid={!!fe.mileage} />
        </Field>
        <Field label="Catégorie" htmlFor="category" required error={fe.category}>
          <Select id="category" name="category" required defaultValue={initial.category ?? ""} options={enumOptions(INTERVENTION_LABELS)} placeholder="Choisir…" invalid={!!fe.category} />
        </Field>
        <Field label="Garage / intervenant" htmlFor="garage" error={fe.garage}>
          <Input id="garage" name="garage" defaultValue={initial.garage ?? ""} maxLength={120} placeholder="Moi-même, concession…" />
        </Field>
        <Field label="Description" htmlFor="description" required error={fe.description} className="sm:col-span-2 lg:col-span-4">
          <Input id="description" name="description" required maxLength={500} defaultValue={initial.description} invalid={!!fe.description} placeholder="Révision annuelle, remplacement plaquettes avant…" />
        </Field>
      </fieldset>

      <fieldset className="card grid gap-4 p-4 sm:grid-cols-3 sm:p-5">
        <legend className="sr-only">Coûts</legend>
        <div className="sm:col-span-3">
          <h2 className="text-sm font-semibold">Coûts</h2>
          <p className="mt-1 text-xs text-muted">Le total crée automatiquement une dépense liée à cette intervention (mise à jour à chaque modification).</p>
        </div>
        <Field label="Pièces (€)" htmlFor="partsCost" error={fe.partsCost}>
          <Input id="partsCost" name="partsCost" inputMode="decimal" value={partsCost} onChange={(e) => setPartsCost(e.target.value)} placeholder="0,00" invalid={!!fe.partsCost} />
        </Field>
        <Field label="Main-d'œuvre (€)" htmlFor="laborCost" error={fe.laborCost}>
          <Input id="laborCost" name="laborCost" inputMode="decimal" value={laborCost} onChange={(e) => setLaborCost(e.target.value)} placeholder="0,00" invalid={!!fe.laborCost} />
        </Field>
        <div className="flex flex-col justify-end">
          <p className="text-xs text-muted">Total</p>
          <p className="text-xl font-semibold tabular-nums" aria-live="polite">
            {formatEuros(total)}
          </p>
        </div>
      </fieldset>

      <fieldset className="card p-4 sm:p-5">
        <legend className="sr-only">Pièces remplacées</legend>
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold">Pièces remplacées</h2>
          <Button variant="secondary" size="sm" onClick={() => setParts((p) => [...p, { key: Date.now(), name: "", reference: "", quantity: 1 }])}>
            <Plus size={14} aria-hidden /> Ajouter une pièce
          </Button>
        </div>
        {parts.length === 0 ? (
          <p className="text-sm text-muted">Aucune pièce renseignée.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {parts.map((part, index) => (
              <li key={part.key} className="grid grid-cols-[1fr_auto] gap-2 sm:grid-cols-[2fr_1.2fr_90px_auto]">
                <Input aria-label={`Nom de la pièce ${index + 1}`} value={part.name} maxLength={120} placeholder="Nom de la pièce" onChange={(e) => setParts((ps) => ps.map((p) => (p.key === part.key ? { ...p, name: e.target.value } : p)))} />
                <Input aria-label={`Référence de la pièce ${index + 1}`} value={part.reference} maxLength={80} placeholder="Référence (facultatif)" className="order-3 col-span-2 sm:order-none sm:col-span-1" onChange={(e) => setParts((ps) => ps.map((p) => (p.key === part.key ? { ...p, reference: e.target.value } : p)))} />
                <Input aria-label={`Quantité de la pièce ${index + 1}`} type="number" min={1} max={999} value={part.quantity} className="order-4 sm:order-none" onChange={(e) => setParts((ps) => ps.map((p) => (p.key === part.key ? { ...p, quantity: Math.max(1, Number(e.target.value) || 1) } : p)))} />
                <Button variant="ghost" size="sm" className="h-10" aria-label={`Retirer la pièce ${index + 1}`} onClick={() => setParts((ps) => ps.filter((p) => p.key !== part.key))}>
                  <Trash2 size={15} />
                </Button>
              </li>
            ))}
          </ul>
        )}
        {fe.replacedParts && <p className="mt-2 text-xs text-danger">Vérifiez les pièces renseignées.</p>}
      </fieldset>

      <fieldset className="card p-4 sm:p-5">
        <legend className="sr-only">Composants concernés</legend>
        <h2 className="text-sm font-semibold">Composants concernés (vue 3D)</h2>
        <p className="mt-1 text-xs text-muted">Reliez l’intervention aux fiches de composants : elle apparaîtra dans la fiche de la pièce en vue 3D.</p>
        <div className="relative mt-3 max-w-sm">
          <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" aria-hidden />
          <Input aria-label="Filtrer les composants" value={componentQuery} onChange={(e) => setComponentQuery(e.target.value)} placeholder="Filtrer (freins, batterie…)" className="pl-9" />
        </div>
        <div className="mt-3 flex max-h-56 flex-wrap gap-2 overflow-y-auto">
          {components.map((c) => {
            const visible = filteredComponents.includes(c);
            const checked = selected.has(c.id);
            return (
              <label key={c.id} className={`${visible || checked ? "flex" : "hidden"} cursor-pointer items-center gap-2 rounded-full border px-3 py-1.5 text-xs ${checked ? "border-accent bg-accent-soft text-ink" : "border-line-strong text-ink-2 hover:border-muted"}`}>
                <input
                  type="checkbox"
                  name="componentIds"
                  value={c.id}
                  checked={checked}
                  onChange={(e) =>
                    setSelected((s) => {
                      const next = new Set(s);
                      if (e.target.checked) next.add(c.id);
                      else next.delete(c.id);
                      return next;
                    })
                  }
                  className="accent-accent"
                />
                {c.name}
                <span className="text-muted">· {FAMILY_LABELS[c.family]}</span>
              </label>
            );
          })}
        </div>
      </fieldset>

      <fieldset className="card grid gap-4 p-4 sm:grid-cols-2 sm:p-5">
        <legend className="sr-only">Suivi</legend>
        <div className="sm:col-span-2">
          <h2 className="text-sm font-semibold">Prochaine échéance (facultatif)</h2>
          <p className="mt-1 text-xs text-muted">Une échéance de suivi sera créée ; elle sera signalée dès que la date ou le kilométrage est atteint.</p>
        </div>
        <Field label="Date" htmlFor="nextDueDate" error={fe.nextDueDate}>
          <Input id="nextDueDate" name="nextDueDate" type="date" defaultValue={toDateInput(initial.nextDueDate)} invalid={!!fe.nextDueDate} />
        </Field>
        <Field label="Kilométrage (km)" htmlFor="nextDueMileage" error={fe.nextDueMileage}>
          <Input id="nextDueMileage" name="nextDueMileage" type="number" inputMode="numeric" min={0} defaultValue={initial.nextDueMileage ?? ""} invalid={!!fe.nextDueMileage} />
        </Field>
        <Field label="Notes" htmlFor="notes" error={fe.notes} className="sm:col-span-2">
          <Textarea id="notes" name="notes" defaultValue={initial.notes ?? ""} maxLength={4000} />
        </Field>
        <Field label="Factures, photos, documents" htmlFor="files" error={fe.files} hint="PDF, JPEG, PNG ou WebP — 10 Mo par fichier, 5 fichiers maximum par envoi." className="sm:col-span-2">
          <Input id="files" name="files" type="file" multiple accept="application/pdf,image/jpeg,image/png,image/webp" invalid={!!fe.files} className="file:mr-3 file:rounded-md file:border-0 file:bg-surface-3 file:px-3 file:py-1 file:text-ink" />
        </Field>
      </fieldset>

      <div className="flex justify-end gap-2">
        <ButtonLink href={cancelHref} variant="secondary">
          Annuler
        </ButtonLink>
        <Button type="submit" disabled={pending}>
          {pending ? "Enregistrement…" : initial.id ? "Enregistrer les modifications" : "Enregistrer l’intervention"}
        </Button>
      </div>
    </form>
  );
}
