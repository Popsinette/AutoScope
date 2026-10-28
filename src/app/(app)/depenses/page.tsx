import Link from "next/link";
import { Download, Link2, Pencil, Plus, Trash2, Wallet } from "lucide-react";
import { deleteExpenseAction } from "@/app/actions/expenses";
import { CategoryBars } from "@/components/charts/category-bars";
import { MonthlyBars } from "@/components/charts/monthly-bars";
import { ExpenseForm } from "@/components/expenses/expense-form";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { ConfirmAction } from "@/components/ui/confirm-action";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { SegmentedLinks } from "@/components/ui/segmented";
import { NoVehicle } from "@/components/vehicles/no-vehicle";
import { monthlyTotals, summarizeExpenses } from "@/lib/expenses";
import { formatEuros, formatShortDate } from "@/lib/format";
import { EXPENSE_LABELS } from "@/lib/labels";
import { isEnumValue, param, withParams, type SearchParams } from "@/lib/search-params";
import { expenseYears, listExpenses } from "@/server/expenses";
import { resolveSelectedVehicle } from "@/server/selection";
import { requireUser } from "@/server/session";
import { vehicleLabel } from "@/server/vehicles";

export const metadata = { title: "Dépenses" };

export default async function ExpensesPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const user = await requireUser();
  const sp = await searchParams;
  const all = param(sp, "v") === "tous";
  const { vehicles, selected } = await resolveSelectedVehicle(user.id, all ? null : param(sp, "v"));
  if (!selected) return <NoVehicle what="ses dépenses" />;
  const vehicle = all ? null : selected;

  const years = await expenseYears(user.id);
  const yearParam = param(sp, "annee");
  const year = yearParam === "toutes" ? null : Number(yearParam) || new Date().getFullYear();
  const rawCategory = param(sp, "categorie");
  const category = isEnumValue(EXPENSE_LABELS, rawCategory) ? rawCategory : null;

  const [rows, yearRows] = await Promise.all([
    listExpenses(user.id, { vehicleId: vehicle?.id, year, category }),
    year ? listExpenses(user.id, { vehicleId: vehicle?.id, year, category: null }) : Promise.resolve([]),
  ]);
  const summary = summarizeExpenses(rows);
  const months = year ? monthlyTotals(category ? rows : yearRows, year) : null;
  const base = { v: all ? "tous" : vehicle!.id, annee: year ? String(year) : "toutes", categorie: category };
  const exportHref = withParams("/api/depenses/export", base);

  return (
    <>
      <PageHeader
        title="Dépenses"
        subtitle="Gardez le contrôle de votre budget. Les coûts d’entretien sont repris automatiquement, sans double saisie."
        actions={
          <>
            <ButtonLink href={exportHref} prefetch={false} variant="secondary">
              <Download size={15} aria-hidden /> Export CSV
            </ButtonLink>
            {vehicle && (
              <ButtonLink href="#ajouter">
                <Plus size={15} aria-hidden /> Ajouter une dépense
              </ButtonLink>
            )}
          </>
        }
      />

      <div className="mb-4 flex flex-col gap-3">
        <SegmentedLinks
          label="Véhicule"
          items={[
            ...vehicles.map((v) => ({ href: withParams("/depenses", base, { v: v.id }), label: vehicleLabel(v), active: vehicle?.id === v.id })),
            { href: withParams("/depenses", base, { v: "tous" }), label: "Tous les véhicules", active: all },
          ]}
        />
        <div className="flex flex-wrap gap-3">
          <SegmentedLinks
            label="Période"
            items={[
              ...years.map((y) => ({ href: withParams("/depenses", base, { annee: String(y) }), label: String(y), active: year === y })),
              { href: withParams("/depenses", base, { annee: "toutes" }), label: "Toutes", active: year === null },
            ]}
          />
          <SegmentedLinks
            label="Catégorie"
            items={[
              { href: withParams("/depenses", base, { categorie: null }), label: "Toutes catégories", active: !category },
              ...Object.entries(EXPENSE_LABELS).map(([k, label]) => ({ href: withParams("/depenses", base, { categorie: k }), label, active: category === k })),
            ]}
          />
        </div>
      </div>

      <div className="mb-5 grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <Card>
          <CardHeader icon={Wallet} title={`Total ${year ? year : "toutes périodes"}`} subtitle={all ? "Tous les véhicules" : vehicleLabel(vehicle!)} />
          <p className="px-5 text-4xl font-semibold tracking-tight tabular-nums" data-testid="expense-total">
            {formatEuros(summary.totalCents)}
          </p>
          <div className="px-3 pb-4 pt-3 sm:px-5">
            {months ? (
              <MonthlyBars cents={months} year={year!} />
            ) : (
              <p className="py-6 text-sm text-muted">Choisissez une année pour afficher la répartition mensuelle.</p>
            )}
          </div>
        </Card>
        <Card>
          <CardHeader title="Répartition par catégorie" subtitle="Calculée sur les dépenses filtrées" />
          <div className="px-5 pb-5">
            {summary.byCategory.length === 0 ? (
              <p className="text-sm text-muted">Aucune dépense sur cette période.</p>
            ) : (
              <CategoryBars rows={summary.byCategory.map((c) => ({ label: EXPENSE_LABELS[c.category], amountCents: c.amountCents, share: c.share }))} />
            )}
          </div>
        </Card>
      </div>

      <Card className="mb-5">
        <CardHeader title="Détail" subtitle={`${rows.length} ligne${rows.length > 1 ? "s" : ""}`} />
        {rows.length === 0 ? (
          <EmptyState icon={Wallet} title="Aucune dépense">
            Aucune dépense ne correspond à ces filtres.
          </EmptyState>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-sm">
              <caption className="sr-only">Liste des dépenses</caption>
              <thead className="border-y border-line text-left text-xs text-muted">
                <tr>
                  <th scope="col" className="px-5 py-2.5 font-medium">Date</th>
                  {all && <th scope="col" className="px-3 py-2.5 font-medium">Véhicule</th>}
                  <th scope="col" className="px-3 py-2.5 font-medium">Catégorie</th>
                  <th scope="col" className="px-3 py-2.5 font-medium">Libellé</th>
                  <th scope="col" className="px-3 py-2.5 text-right font-medium">Montant</th>
                  <th scope="col" className="px-5 py-2.5 text-right font-medium"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-b border-line last:border-0">
                    <td className="px-5 py-2.5 tabular-nums">{formatShortDate(r.date)}</td>
                    {all && <td className="px-3 py-2.5 text-ink-2">{vehicleLabel(r.vehicle)}</td>}
                    <td className="px-3 py-2.5">{EXPENSE_LABELS[r.category]}</td>
                    <td className="px-3 py-2.5">
                      {r.label}
                      {r.interventionId && (
                        <Badge className="ml-2" tone="neutral" title="Montant issu d’une intervention">
                          <Link2 size={11} aria-hidden /> Entretien
                        </Badge>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-right font-medium tabular-nums">{formatEuros(r.amountCents)}</td>
                    <td className="px-5 py-2.5">
                      <div className="flex justify-end gap-1">
                        {r.interventionId ? (
                          <Link href={`/entretiens/${r.interventionId}`} className="text-xs text-ink-2 hover:text-accent-ink">
                            Voir l’intervention
                          </Link>
                        ) : (
                          <>
                            <ButtonLink href={`/depenses/${r.id}/modifier`} variant="ghost" size="sm">
                              <Pencil size={14} aria-hidden />
                              <span className="sr-only">Modifier {r.label}</span>
                            </ButtonLink>
                            <ConfirmAction action={deleteExpenseAction} fields={{ id: r.id }} title="Supprimer cette dépense ?" triggerVariant="ghost" trigger={<><Trash2 size={14} aria-hidden /><span className="sr-only">Supprimer {r.label}</span></>}>
                              {r.label} — {formatEuros(r.amountCents)}
                            </ConfirmAction>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {vehicle && (
        <Card>
          <div id="ajouter" className="scroll-mt-20" />
          <CardHeader icon={Plus} title="Ajouter une dépense" subtitle={`Carburant, assurance, pièces… pour ${vehicleLabel(vehicle)}. Les entretiens se saisissent dans le carnet.`} />
          <ExpenseForm vehicleId={vehicle.id} />
        </Card>
      )}
    </>
  );
}
