import Link from "next/link";
import { FileText, List, Plus, Rows3, Search, Wrench } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { DemoBadge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/field";
import { PageHeader } from "@/components/ui/page-header";
import { SegmentedLinks } from "@/components/ui/segmented";
import { CategoryIcon } from "@/components/interventions/category-icon";
import { formatDate, formatEuros, formatKm, formatShortDate } from "@/lib/format";
import { INTERVENTION_LABELS } from "@/lib/labels";
import { withParams } from "@/lib/search-params";
import { vehicleLabel } from "@/lib/vehicle";
import type { InterventionCategory } from "@/generated/prisma/enums";

export interface InterventionListItem {
  id: string;
  date: Date;
  mileage: number;
  category: InterventionCategory;
  description: string;
  garage: string | null;
  partsCostCents: number;
  laborCostCents: number;
  documentCount: number;
}

export function InterventionsView({
  vehicle,
  items,
  category,
  q,
  view,
}: {
  vehicle: { id: string; make: string; model: string; trim: string | null; isDemo: boolean };
  items: InterventionListItem[];
  category?: InterventionCategory;
  q?: string;
  view: "chronologie" | "tableau";
}) {
  const base = { v: vehicle.id, vue: view === "tableau" ? "tableau" : undefined, categorie: category, q };

  return (
    <>
      <PageHeader
        title="Carnet d’entretien"
        subtitle={
          <>
            {vehicleLabel(vehicle)} {vehicle.isDemo && <DemoBadge className="ml-1" />}
          </>
        }
        actions={
          <ButtonLink href={`/entretiens/nouveau?v=${vehicle.id}`}>
            <Plus size={16} aria-hidden /> Ajouter un entretien
          </ButtonLink>
        }
      />
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <SegmentedLinks
          label="Filtrer par catégorie"
          items={[
            { href: withParams("/entretiens", base, { categorie: null }), label: "Tous", active: !category },
            ...Object.entries(INTERVENTION_LABELS).map(([key, label]) => ({
              href: withParams("/entretiens", base, { categorie: key }),
              label,
              active: category === key,
            })),
          ]}
        />
        <form className="relative ml-auto w-full sm:w-64" role="search" action="/entretiens">
          <input type="hidden" name="v" value={vehicle.id} />
          {category && <input type="hidden" name="categorie" value={category} />}
          {view === "tableau" && <input type="hidden" name="vue" value="tableau" />}
          <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" aria-hidden />
          <Input name="q" defaultValue={q} placeholder="Rechercher…" aria-label="Rechercher une intervention" className="pl-9" />
        </form>
        <nav aria-label="Affichage" className="flex gap-1">
          <ButtonLink href={withParams("/entretiens", base, { vue: null })} variant={view === "chronologie" ? "secondary" : "ghost"} size="sm" aria-current={view === "chronologie" ? "page" : undefined}>
            <List size={15} aria-hidden /> Chronologie
          </ButtonLink>
          <ButtonLink href={withParams("/entretiens", base, { vue: "tableau" })} variant={view === "tableau" ? "secondary" : "ghost"} size="sm" aria-current={view === "tableau" ? "page" : undefined}>
            <Rows3 size={15} aria-hidden /> Tableau
          </ButtonLink>
        </nav>
      </div>

      {items.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={Wrench}
            title={category || q ? "Aucune intervention ne correspond" : "Aucune intervention enregistrée"}
            action={
              <ButtonLink href={`/entretiens/nouveau?v=${vehicle.id}`}>
                <Plus size={16} aria-hidden /> Ajouter un entretien
              </ButtonLink>
            }
          >
            {category || q ? "Modifiez les filtres ou la recherche." : "Enregistrez vos vidanges, révisions, réparations et leurs factures."}
          </EmptyState>
        </div>
      ) : view === "chronologie" ? (
        <ol className="relative flex flex-col gap-3 before:absolute before:bottom-4 before:left-[7px] before:top-4 before:w-px before:bg-line-strong">
          {items.map((i) => (
            <li key={i.id} className="relative pl-7">
              <span className="absolute left-0 top-5 size-[15px] rounded-full border-[3px] border-bg bg-accent" aria-hidden />
              <Link href={`/entretiens/${i.id}`} className="card flex flex-wrap items-center gap-4 p-4 hover:border-line-strong">
                <CategoryIcon category={i.category} />
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{i.description}</p>
                  <p className="text-sm text-muted">
                    {INTERVENTION_LABELS[i.category]}
                    {i.garage && ` · ${i.garage}`}
                  </p>
                </div>
                <div className="text-right text-sm">
                  <p>{formatDate(i.date)}</p>
                  <p className="text-muted">{formatKm(i.mileage)}</p>
                </div>
                <div className="w-24 text-right">
                  <p className="font-medium tabular-nums">{formatEuros(i.partsCostCents + i.laborCostCents)}</p>
                  {i.documentCount > 0 && (
                    <p className="inline-flex items-center gap-1 text-xs text-muted">
                      <FileText size={12} aria-hidden /> {i.documentCount}
                    </p>
                  )}
                </div>
              </Link>
            </li>
          ))}
        </ol>
      ) : (
        <div className="card relative overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <caption className="sr-only">Interventions de {vehicleLabel(vehicle)}</caption>
            <thead className="border-b border-line text-left text-xs text-muted">
              <tr>
                <th scope="col" className="px-4 py-3 font-medium">Date</th>
                <th scope="col" className="px-4 py-3 font-medium">Kilométrage</th>
                <th scope="col" className="px-4 py-3 font-medium">Type</th>
                <th scope="col" className="px-4 py-3 font-medium">Description</th>
                <th scope="col" className="px-4 py-3 font-medium">Intervenant</th>
                <th scope="col" className="px-4 py-3 text-right font-medium">Coût</th>
              </tr>
            </thead>
            <tbody>
              {items.map((i) => (
                <tr key={i.id} className="border-b border-line last:border-0 hover:bg-surface-2/60">
                  <td className="px-4 py-3 tabular-nums">{formatShortDate(i.date)}</td>
                  <td className="px-4 py-3 tabular-nums">{formatKm(i.mileage)}</td>
                  <td className="px-4 py-3">{INTERVENTION_LABELS[i.category]}</td>
                  <td className="px-4 py-3">
                    <Link href={`/entretiens/${i.id}`} className="hover:text-accent-ink">
                      {i.description}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted">{i.garage ?? "—"}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{formatEuros(i.partsCostCents + i.laborCostCents)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
