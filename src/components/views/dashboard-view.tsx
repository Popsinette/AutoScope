import Link from "next/link";
import { Box, CalendarClock, Car, ChevronRight, FileText, History, Plus, Settings2, Wallet, Wrench } from "lucide-react";
import { MonthlyBars } from "@/components/charts/monthly-bars";
import { CategoryIcon } from "@/components/interventions/category-icon";
import { ReminderStatusBadge } from "@/components/reminders/status-badge";
import { DemoBadge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { serverPhotoSrc, VehiclePhoto, type PhotoVehicle } from "@/components/vehicles/vehicle-photo";
import type { ExplorerModel } from "@/components/viewer3d/types";
import { VehicleShowcase } from "@/components/viewer3d/vehicle-showcase";
import { monthlyTotals, type ExpenseRow } from "@/lib/expenses";
import { formatDate, formatEuros, formatKm, formatShortDate } from "@/lib/format";
import { INTERVENTION_LABELS } from "@/lib/labels";
import { describeRemaining, type ReminderEvaluation } from "@/lib/reminders";
import { vehicleLabel } from "@/lib/vehicle";
import type { InterventionCategory } from "@/generated/prisma/enums";

export interface DashboardVehicle extends PhotoVehicle {
  trim: string | null;
  year: number;
  engine: string | null;
  mileage: number;
  isDemo: boolean;
}

export interface DashboardReminder {
  id: string;
  title: string;
  dueDate: Date | null;
  dueMileage: number | null;
  evaluation: ReminderEvaluation;
  sourceIntervention: { id: string; date: Date } | null;
}

export interface DashboardIntervention {
  id: string;
  date: Date;
  mileage: number;
  category: InterventionCategory;
  description: string;
}

export function DashboardView({
  firstName,
  vehicle,
  reminders,
  interventions,
  expenses,
  prevYearExpenses,
  year,
  photoSrc = serverPhotoSrc,
  showcase = null,
}: {
  firstName: string;
  vehicle: DashboardVehicle | null;
  reminders: DashboardReminder[];
  interventions: DashboardIntervention[];
  expenses: ExpenseRow[];
  prevYearExpenses: ExpenseRow[];
  year: number;
  photoSrc?: (v: PhotoVehicle) => string | null;
  /** Modèle 3D de la vitrine (remplace la photo / l'illustration). */
  showcase?: { model: ExplorerModel; preferred: ExplorerModel | null } | null;
}) {
  if (!vehicle) {
    return (
      <>
        <h1 className="mb-1 text-2xl font-semibold tracking-tight">Bienvenue {firstName}</h1>
        <p className="mb-6 text-sm text-muted">Votre passion, notre moteur.</p>
        <div className="card">
          <EmptyState
            icon={Car}
            title="Commencez par ajouter votre voiture"
            action={
              <ButtonLink href="/garage/nouveau">
                <Plus size={16} aria-hidden /> Ajouter un véhicule
              </ButtonLink>
            }
          >
            Votre tableau de bord affichera ensuite le prochain entretien, les échéances, l’historique et vos dépenses, calculés à partir de vos saisies.
          </EmptyState>
        </div>
      </>
    );
  }

  const open = reminders.filter((r) => r.evaluation.status !== "REALISE");
  const overdue = open.filter((r) => r.evaluation.status === "DEPASSE").length;
  const soon = open.filter((r) => r.evaluation.status === "PROCHE").length;
  const urgent = overdue + soon;
  const next = open[0];
  const total = expenses.reduce((s, e) => s + e.amountCents, 0);
  // Comparaison à période égale (du 1er janvier à aujourd'hui l'an dernier).
  const today = new Date();
  const sameDayLastYear = new Date(Date.UTC(year - 1, today.getUTCMonth(), today.getUTCDate(), 23, 59));
  const prevSamePeriod = prevYearExpenses.filter((e) => e.date <= sameDayLastYear).reduce((s, e) => s + e.amountCents, 0);
  const delta = prevSamePeriod > 0 ? Math.round(((total - prevSamePeriod) / prevSamePeriod) * 100) : null;
  const q = `?v=${vehicle.id}`;

  let progress: number | null = null;
  if (next?.sourceIntervention && next.dueMileage !== null) {
    const start = interventions.find((i) => i.id === next.sourceIntervention!.id)?.mileage;
    if (start !== undefined && next.dueMileage > start) progress = (vehicle.mileage - start) / (next.dueMileage - start);
  } else if (next?.sourceIntervention && next.dueDate) {
    const start = next.sourceIntervention.date.getTime();
    progress = (Date.now() - start) / (next.dueDate.getTime() - start);
  }

  return (
    <>
      <div className="mb-5">
        <h1 className="text-2xl font-semibold tracking-tight">Bonjour {firstName}</h1>
        <p className="text-sm text-muted">Votre passion, notre moteur.</p>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        <Card className="relative overflow-hidden lg:col-span-8">
          {showcase ? (
            <VehicleShowcase model={showcase.model} preferredModel={showcase.preferred} vehicleId={vehicle.id} className="h-[400px] sm:h-[440px]" />
          ) : (
            <div className="relative h-[400px] sm:h-[440px]">
              <VehiclePhoto vehicle={vehicle} src={photoSrc(vehicle)} className="absolute inset-0" />
            </div>
          )}
          <div className="pointer-events-none absolute inset-x-0 top-0 bg-gradient-to-b from-[#0c0d10] via-[#0c0d10]/75 to-transparent p-5 pb-16">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-semibold tracking-tight">{vehicleLabel(vehicle)}</h2>
              {vehicle.isDemo && <DemoBadge />}
            </div>
            <p className="text-sm text-ink-2">
              {vehicle.year} · {vehicle.engine ?? "Motorisation non renseignée"}
            </p>
            {showcase?.model.notice && <p className="mt-1 max-w-sm text-[0.7rem] text-muted">Modèle 3D de présentation : ne représente pas ce véhicule.</p>}
          </div>
          <div className="pointer-events-none absolute bottom-4 left-5 flex flex-col gap-3">
            <div>
              <p className="text-xs text-muted">Kilométrage</p>
              <p className="text-3xl font-semibold tracking-tight tabular-nums">{formatKm(vehicle.mileage)}</p>
            </div>
            <div className="pointer-events-auto flex flex-wrap gap-2">
              <ButtonLink href={`/vue-3d${q}`}>
                <Box size={15} aria-hidden /> Explorer en 3D
              </ButtonLink>
              <ButtonLink href={`/garage/${vehicle.id}`} variant="secondary" className="bg-surface-2/80 backdrop-blur">
                Gérer le véhicule
              </ButtonLink>
            </div>
          </div>
        </Card>

        <Card className="lg:col-span-4">
          <CardHeader icon={Settings2} title="Prochain entretien" subtitle="L’échéance la plus urgente" />
          <div className="px-5 pb-5">
            {next ? (
              <>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-lg font-semibold">{next.title}</p>
                  <ReminderStatusBadge status={next.evaluation.status} />
                </div>
                <p className="mt-1 text-sm text-ink-2">
                  {[next.dueMileage !== null && formatKm(next.dueMileage), next.dueDate && formatDate(next.dueDate)].filter(Boolean).join(" ou ")}
                </p>
                <p className="text-sm text-muted">{describeRemaining(next.evaluation)}</p>
                {progress !== null && (
                  <div className="mt-4">
                    <div className="h-2 overflow-hidden rounded-full bg-surface-3" role="progressbar" aria-label="Avancement vers l’échéance" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(Math.min(1, Math.max(0, progress)) * 100)}>
                      <div className={`h-full rounded-full ${progress >= 1 ? "bg-danger" : progress >= 0.85 ? "bg-warn" : "bg-ok"}`} style={{ width: `${Math.min(100, Math.max(2, progress * 100))}%` }} />
                    </div>
                    <p className="mt-1 text-xs text-muted">Depuis l’intervention du {formatDate(next.sourceIntervention!.date)}</p>
                  </div>
                )}
                <ButtonLink href={`/echeances${q}`} variant="secondary" size="sm" className="mt-4">
                  Voir les détails
                </ButtonLink>
              </>
            ) : (
              <p className="text-sm text-muted">
                Aucune échéance enregistrée.{" "}
                <Link href={`/echeances${q}#ajouter`} className="text-accent-ink hover:underline">
                  Créer une échéance
                </Link>
              </p>
            )}
            <dl className="mt-5 grid grid-cols-3 gap-2 border-t border-line pt-4 text-center">
              <div className="rounded-lg bg-surface-2 px-2 py-2.5">
                <dt className="text-[0.68rem] text-muted">Dépassées</dt>
                <dd className={`text-xl font-semibold tabular-nums ${overdue > 0 ? "text-danger" : ""}`}>{overdue}</dd>
              </div>
              <div className="rounded-lg bg-surface-2 px-2 py-2.5">
                <dt className="text-[0.68rem] text-muted">À prévoir</dt>
                <dd className={`text-xl font-semibold tabular-nums ${soon > 0 ? "text-warn" : ""}`}>{soon}</dd>
              </div>
              <div className="rounded-lg bg-surface-2 px-2 py-2.5">
                <dt className="text-[0.68rem] text-muted">Dernier entretien</dt>
                <dd className="mt-1 text-xs font-medium">{interventions[0] ? formatShortDate(interventions[0].date) : "—"}</dd>
              </div>
            </dl>
          </div>
        </Card>

        <Card className="lg:col-span-4">
          <CardHeader icon={CalendarClock} title="Échéances à venir" action={urgent > 0 ? <span className="grid size-6 place-items-center rounded-full bg-accent text-xs font-semibold">{urgent}</span> : undefined} />
          <ul className="px-5 pb-3">
            {open.length === 0 && <li className="pb-2 text-sm text-muted">Rien à signaler.</li>}
            {open.slice(0, 4).map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-2 border-t border-line py-2.5 text-sm first:border-0">
                <div className="min-w-0">
                  <p className="truncate">{r.title}</p>
                  <p className="text-xs text-muted">{describeRemaining(r.evaluation)}</p>
                </div>
                <ReminderStatusBadge status={r.evaluation.status} />
              </li>
            ))}
          </ul>
          <div className="px-5 pb-5">
            <ButtonLink href={`/echeances${q}`} variant="secondary" size="sm" className="w-full">
              Voir toutes les échéances
            </ButtonLink>
          </div>
        </Card>

        <Card className="lg:col-span-4">
          <CardHeader icon={History} title="Dernières interventions" action={<Link href={`/entretiens${q}`} className="text-xs text-muted hover:text-ink">Voir tout</Link>} />
          <ul className="px-5 pb-5">
            {interventions.length === 0 && (
              <li className="text-sm text-muted">
                Aucune intervention.{" "}
                <Link href={`/entretiens/nouveau${q}`} className="text-accent-ink hover:underline">
                  Ajouter un entretien
                </Link>
              </li>
            )}
            {interventions.map((i) => (
              <li key={i.id} className="border-t border-line py-2.5 first:border-0">
                <Link href={`/entretiens/${i.id}`} className="flex items-center gap-3 hover:text-accent-ink">
                  <CategoryIcon category={i.category} />
                  <div className="min-w-0">
                    <p className="truncate text-sm">{i.description}</p>
                    <p className="text-xs text-muted">
                      {INTERVENTION_LABELS[i.category]} · {formatKm(i.mileage)} · {formatDate(i.date)}
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="lg:col-span-4">
          <CardHeader icon={Wallet} title={`Dépenses ${year}`} action={<Link href={`/depenses${q}`} className="text-xs text-muted hover:text-ink">Détail</Link>} />
          <div className="flex items-baseline gap-3 px-5">
            <p className="text-3xl font-semibold tracking-tight tabular-nums">{formatEuros(total)}</p>
            {delta !== null && (
              <p className="text-xs text-muted" title={`Par rapport au 1er janvier – ${formatDate(sameDayLastYear)}`}>
                <span className={delta > 0 ? "text-accent-ink" : "text-ok"}>
                  {delta > 0 ? "+" : ""}
                  {delta} %
                </span>{" "}
                vs {year - 1} à date
              </p>
            )}
          </div>
          <div className="px-3 pb-4 sm:px-4">
            <MonthlyBars cents={monthlyTotals(expenses, year)} year={year} height={170} width={380} />
          </div>
        </Card>

        <Card className="lg:col-span-12">
          <CardHeader title="Actions rapides" />
          <div className="grid grid-cols-2 gap-3 px-5 pb-5 md:grid-cols-4">
            {[
              { href: `/entretiens/nouveau${q}`, label: "Ajouter un entretien", icon: Wrench },
              { href: `/depenses${q}#ajouter`, label: "Ajouter une dépense", icon: Plus },
              { href: `/documents${q}#ajouter`, label: "Importer un document", icon: FileText },
              { href: `/vue-3d${q}`, label: "Explorer la vue 3D", icon: Box },
            ].map((a) => (
              <Link key={a.href} href={a.href} className="group flex items-center gap-3 rounded-xl border border-line bg-surface-2 p-3 text-sm hover:border-accent">
                <span className="grid size-9 place-items-center rounded-lg bg-accent-soft text-accent-ink" aria-hidden>
                  <a.icon size={17} />
                </span>
                <span className="flex-1">{a.label}</span>
                <ChevronRight size={15} className="text-muted group-hover:text-ink" aria-hidden />
              </Link>
            ))}
          </div>
        </Card>
      </div>
    </>
  );
}
