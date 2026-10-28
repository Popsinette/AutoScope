import Link from "next/link";
import { Box, CalendarClock, Car, ChevronRight, FileText, History, Plus, Settings2, Wallet, Wrench } from "lucide-react";
import { MonthlyBars } from "@/components/charts/monthly-bars";
import { CategoryIcon } from "@/components/interventions/category-icon";
import { ReminderStatusBadge } from "@/components/reminders/status-badge";
import { DemoBadge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { VehiclePhoto } from "@/components/vehicles/vehicle-photo";
import { monthlyTotals } from "@/lib/expenses";
import { formatDate, formatEuros, formatKm } from "@/lib/format";
import { INTERVENTION_LABELS } from "@/lib/labels";
import { describeRemaining } from "@/lib/reminders";
import { param, type SearchParams } from "@/lib/search-params";
import { prisma } from "@/server/db";
import { listExpenses } from "@/server/expenses";
import { listReminders } from "@/server/reminders";
import { resolveSelectedVehicle } from "@/server/selection";
import { requireUser } from "@/server/session";
import { vehicleLabel } from "@/server/vehicles";

export const metadata = { title: "Tableau de bord" };

export default async function DashboardPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const user = await requireUser();
  const sp = await searchParams;
  const { selected: vehicle } = await resolveSelectedVehicle(user.id, param(sp, "v"));
  const firstName = user.name.split(" ")[0];

  if (!vehicle) {
    return (
      <>
        <h1 className="mb-1 text-2xl font-semibold tracking-tight">Bienvenue {firstName}</h1>
        <p className="mb-6 text-sm text-muted">Votre passion, notre moteur.</p>
        <div className="card">
          <EmptyState icon={Car} title="Commencez par ajouter votre voiture" action={<ButtonLink href="/garage/nouveau"><Plus size={16} aria-hidden /> Ajouter un véhicule</ButtonLink>}>
            Votre tableau de bord affichera ensuite le prochain entretien, les échéances, l’historique et vos dépenses, calculés à partir de vos saisies.
          </EmptyState>
        </div>
      </>
    );
  }

  const year = new Date().getFullYear();
  const [reminders, interventions, expenses, prevYearExpenses] = await Promise.all([
    listReminders(user.id, vehicle.id),
    prisma.intervention.findMany({ where: { vehicleId: vehicle.id }, orderBy: [{ date: "desc" }, { mileage: "desc" }], take: 4 }),
    listExpenses(user.id, { vehicleId: vehicle.id, year }),
    listExpenses(user.id, { vehicleId: vehicle.id, year: year - 1 }),
  ]);
  const open = reminders.filter((r) => r.evaluation.status !== "REALISE");
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

      <div className="grid gap-5 lg:grid-cols-12">
        <Card className="overflow-hidden lg:col-span-7">
          <div className="grid sm:grid-cols-[1fr_1.15fr]">
            <div className="flex flex-col p-5">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold tracking-tight">{vehicleLabel(vehicle)}</h2>
                {vehicle.isDemo && <DemoBadge />}
              </div>
              <p className="text-sm text-muted">
                {vehicle.year} · {vehicle.engine ?? "Motorisation non renseignée"}
              </p>
              <p className="mt-4 text-xs text-muted">Kilométrage</p>
              <p className="text-3xl font-semibold tracking-tight tabular-nums">{formatKm(vehicle.mileage)}</p>
              <div className="mt-auto flex flex-wrap gap-2 pt-5">
                <ButtonLink href={`/vue-3d${q}`}>
                  <Box size={15} aria-hidden /> Voir en 3D
                </ButtonLink>
                <ButtonLink href={`/garage/${vehicle.id}`} variant="secondary">
                  Gérer le véhicule
                </ButtonLink>
              </div>
            </div>
            <div className="relative min-h-48 bg-[radial-gradient(closest-side,rgb(217_38_28/0.12),transparent)]">
              <VehiclePhoto vehicle={vehicle} className="absolute inset-0" />
            </div>
          </div>
        </Card>

        <Card className="lg:col-span-5">
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
          </div>
        </Card>

        <Card className="lg:col-span-4">
          <CardHeader
            icon={CalendarClock}
            title="Échéances à venir"
            action={open.filter((r) => r.evaluation.status === "DEPASSE" || r.evaluation.status === "PROCHE").length > 0 ? <span className="grid size-6 place-items-center rounded-full bg-accent text-xs font-semibold">{open.filter((r) => r.evaluation.status === "DEPASSE" || r.evaluation.status === "PROCHE").length}</span> : undefined}
          />
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
