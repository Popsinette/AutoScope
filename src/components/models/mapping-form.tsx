"use client";

import { Search, Wand2 } from "lucide-react";
import { useMemo, useState } from "react";
import { Button, ButtonLink } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import { FormError } from "@/components/ui/form-error";
import { useFormAction, type FormState } from "@/components/ui/use-form-action";
import { suggestComponentSlug } from "@/lib/gltf";
import { FAMILY_LABELS } from "@/lib/labels";

export function MappingForm({
  modelId,
  nodeNames,
  current,
  components,
  viewHref,
  action,
}: {
  modelId: string;
  nodeNames: string[];
  current: Record<string, string>;
  components: { slug: string; name: string; family: keyof typeof FAMILY_LABELS }[];
  viewHref: string;
  action: (form: FormData) => Promise<FormState>;
}) {
  const { state, pending, onSubmit } = useFormAction(action);
  const [values, setValues] = useState<Record<string, string>>(current);
  const [query, setQuery] = useState("");
  const [onlyEmpty, setOnlyEmpty] = useState(false);
  const grouped = useMemo(() => {
    const map = new Map<string, { slug: string; name: string }[]>();
    for (const c of components) map.set(FAMILY_LABELS[c.family], [...(map.get(FAMILY_LABELS[c.family]) ?? []), c]);
    return [...map.entries()];
  }, [components]);
  const visible = nodeNames.filter((n) => (!query || n.toLowerCase().includes(query.toLowerCase())) && (!onlyEmpty || !values[n]));
  const mappedCount = Object.values(values).filter(Boolean).length;

  const suggest = () =>
    setValues((v) => {
      const next = { ...v };
      for (const n of nodeNames) if (!next[n]) next[n] = suggestComponentSlug(n) ?? "";
      return next;
    });

  return (
    <form onSubmit={onSubmit}>
      <input type="hidden" name="modelId" value={modelId} />
      <div className="flex flex-wrap items-center gap-3 p-4 sm:px-5">
        <div className="relative w-full sm:w-64">
          <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" aria-hidden />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Filtrer les objets…" aria-label="Filtrer les objets" className="pl-9" />
        </div>
        <label className="flex items-center gap-2 text-sm text-ink-2">
          <input type="checkbox" checked={onlyEmpty} onChange={(e) => setOnlyEmpty(e.target.checked)} className="accent-accent" /> Non associés uniquement
        </label>
        <Button variant="secondary" size="sm" onClick={suggest}>
          <Wand2 size={14} aria-hidden /> Suggérer d’après les noms
        </Button>
        <p className="ml-auto text-sm text-muted">
          {mappedCount} / {nodeNames.length} associés
        </p>
      </div>
      <div className="px-4 sm:px-5">
        <FormError message={state?.error} />
      </div>
      <div className="max-h-[60dvh] overflow-y-auto border-y border-line">
        <table className="w-full text-sm">
          <caption className="sr-only">Correspondance entre objets du modèle et fiches composants</caption>
          <thead className="sticky top-0 bg-surface text-left text-xs text-muted">
            <tr>
              <th scope="col" className="px-5 py-2 font-medium">Objet du fichier</th>
              <th scope="col" className="px-5 py-2 font-medium">Fiche composant</th>
            </tr>
          </thead>
          <tbody>
            {nodeNames.map((n) => (
              <tr key={n} className={visible.includes(n) ? "border-t border-line" : "hidden"}>
                <td className="px-5 py-2 font-mono text-xs">{n}</td>
                <td className="px-5 py-2">
                  <select name={`node:${n}`} value={values[n] ?? ""} onChange={(e) => setValues((v) => ({ ...v, [n]: e.target.value }))} className="field py-1.5" aria-label={`Fiche pour ${n}`}>
                    <option value="">— Aucune —</option>
                    {grouped.map(([family, items]) => (
                      <optgroup key={family} label={family}>
                        {items.map((c) => (
                          <option key={c.slug} value={c.slug}>
                            {c.name}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex justify-end gap-2 p-4 sm:px-5">
        <ButtonLink href={viewHref} variant="secondary">
          Voir en 3D
        </ButtonLink>
        <Button type="submit" disabled={pending}>
          {pending ? "Enregistrement…" : "Enregistrer les correspondances"}
        </Button>
      </div>
    </form>
  );
}
