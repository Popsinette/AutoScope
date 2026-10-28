import Link from "next/link";
import { Box, CalendarClock, FileText, Pencil, Trash2, Wallet, Wrench } from "lucide-react";
import { ReminderStatusBadge } from "@/components/reminders/status-badge";
import { DemoBadge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { ConfirmAction, type SimpleActionState } from "@/components/ui/confirm-action";
import { PrivateValue } from "@/components/vehicles/private-value";
import { serverPhotoSrc, VehiclePhoto, type PhotoVehicle } from "@/components/vehicles/vehicle-photo";
import { formatDate, formatEuros, formatKm, pluralize } from "@/lib/format";
import { ENERGY_LABELS, INTERVENTION_LABELS, TRANSMISSION_LABELS } from "@/lib/labels";
import { describeRemaining, type ReminderEvaluation } from "@/lib/reminders";
import { vehicleLabel } from "@/lib/vehicle";
import type { Energy, InterventionCategory, Transmission } from "@/generated/prisma/enums";

export interface VehicleDetail extends PhotoVehicle {
  trim: string | null;
  year: number;
  mileage: number;
  engine: string | null;
  energy: Energy;
  transmission: Transmission;
  acquiredAt: Date | null;
  registration: string | null;
  vin: string | null;
  notes: string | null;
  isDemo: boolean;
  model3d: { name: string; isIllustrative: boolean } | null;
}

export function VehicleDetailView({
  vehicle,
  interventions,
  openReminders,
  expenseCount,
  expenseTotalCents,
  documentCount,
  deleteAction,
  photoSrc = serverPhotoSrc,
}: {
  vehicle: VehicleDetail;
  interventions: { id: string; date: Date; mileage: number; category: InterventionCategory; description: string }[];
  openReminders: { id: string; title: string; evaluation: ReminderEvaluation }[];
  expenseCount: number;
  expenseTotalCents: number;
  documentCount: number;
  deleteAction: (state: SimpleActionState, form: FormData) => Promise<SimpleActionState>;
  photoSrc?: (v: PhotoVehicle) => string | null;
}) {
  const q = `?v=${vehicle.id}`;
  const specs: [string, React.ReactNode][] = [
    ["Année", vehicle.year],
    ["Kilométrage", formatKm(vehicle.mileage)],
    ["Motorisation", vehicle.engine ?? "—"],
    ["Énergie", ENERGY_LABELS[vehicle.energy]],
    ["Transmission", TRANSMISSION_LABELS[vehicle.transmission]],
    ["Acquisition", vehicle.acquiredAt ? formatDate(vehicle.acquiredAt) : "—"],
  ];

  return (
    <>
      <div className="mb-5 grid grid-cols-1 gap-5 lg:grid-cols-[1.2fr_1fr]">
        <div className="card relative overflow-hidden">
          <div className="aspect-[16/9] bg-bg">
            <VehiclePhoto vehicle={vehicle} src={photoSrc(vehicle)} />
          </div>
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent p-5 pt-16">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-tight">{vehicleLabel(vehicle)}</h1>
              {vehicle.isDemo && <DemoBadge />}
            </div>
            <p className="text-sm text-ink-2">
              {vehicle.year} · {formatKm(vehicle.mileage)}
            </p>
          </div>
        </div>
        <Card className="flex flex-col">
          <CardHeader
            title="Caractéristiques"
            action={
              <div className="flex gap-2">
                <ButtonLink href={`/garage/${vehicle.id}/modifier`} variant="secondary" size="sm">
                  <Pencil size={14} aria-hidden /> Modifier
                </ButtonLink>
                <ConfirmAction
                  action={deleteAction}
                  fields={{ id: vehicle.id }}
                  title={`Supprimer ${vehicleLabel(vehicle)} ?`}
                  trigger={
                    <>
                      <Trash2 size={14} aria-hidden /> <span className="sr-only sm:not-sr-only">Supprimer</span>
                    </>
                  }
                >
                  Son historique d’entretien, ses dépenses, échéances et documents seront définitivement supprimés.
                </ConfirmAction>
              </div>
            }
          />
          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 px-5 pb-4 text-sm">
            {specs.map(([k, v]) => (
              <div key={k}>
                <dt className="text-xs text-muted">{k}</dt>
                <dd className="mt-0.5">{v}</dd>
              </div>
            ))}
            <div>
              <dt className="text-xs text-muted">Immatriculation (privée)</dt>
              <dd className="mt-0.5">
                <PrivateValue value={vehicle.registration} label="l'immatriculation" />
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted">VIN (privé)</dt>
              <dd className="mt-0.5">
                <PrivateValue value={vehicle.vin} label="le VIN" />
              </dd>
            </div>
          </dl>
          {vehicle.notes && <p className="mx-5 mb-5 whitespace-pre-line rounded-lg border border-line bg-bg/50 p-3 text-sm text-ink-2">{vehicle.notes}</p>}
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader icon={Wrench} title="Entretien" subtitle="Dernières interventions" />
          <ul className="px-5 pb-4 text-sm">
            {interventions.length === 0 && <li className="text-muted">Aucune intervention.</li>}
            {interventions.map((i) => (
              <li key={i.id} className="border-t border-line py-2 first:border-0">
                <Link href={`/entretiens/${i.id}`} className="hover:text-accent-ink">
                  {INTERVENTION_LABELS[i.category]} — {i.description}
                </Link>
                <p className="text-xs text-muted">
                  {formatDate(i.date)} · {formatKm(i.mileage)}
                </p>
              </li>
            ))}
          </ul>
          <div className="px-5 pb-5">
            <ButtonLink href={`/entretiens${q}`} variant="secondary" size="sm">
              Carnet d’entretien
            </ButtonLink>
          </div>
        </Card>
        <Card>
          <CardHeader icon={CalendarClock} title="Échéances" subtitle={`${openReminders.length} à suivre`} />
          <ul className="px-5 pb-4 text-sm">
            {openReminders.length === 0 && <li className="text-muted">Aucune échéance en cours.</li>}
            {openReminders.map((r) => (
              <li key={r.id} className="flex items-start justify-between gap-2 border-t border-line py-2 first:border-0">
                <div>
                  <p>{r.title}</p>
                  <p className="text-xs text-muted">{describeRemaining(r.evaluation)}</p>
                </div>
                <ReminderStatusBadge status={r.evaluation.status} />
              </li>
            ))}
          </ul>
          <div className="px-5 pb-5">
            <ButtonLink href={`/echeances${q}`} variant="secondary" size="sm">
              Toutes les échéances
            </ButtonLink>
          </div>
        </Card>
        <Card>
          <CardHeader icon={Wallet} title="Dépenses" subtitle={pluralize(expenseCount, "dépense")} />
          <p className="px-5 text-3xl font-semibold tabular-nums">{formatEuros(expenseTotalCents)}</p>
          <p className="px-5 pb-4 text-xs text-muted">Total cumulé depuis l’ajout du véhicule</p>
          <div className="px-5 pb-5">
            <ButtonLink href={`/depenses${q}`} variant="secondary" size="sm">
              Détail des dépenses
            </ButtonLink>
          </div>
        </Card>
        <Card>
          <CardHeader icon={Box} title="Documents & 3D" />
          <p className="flex items-center gap-2 px-5 text-sm">
            <FileText size={15} className="text-muted" aria-hidden /> {pluralize(documentCount, "document")}
          </p>
          <p className="px-5 pb-4 pt-2 text-sm text-muted">
            {vehicle.model3d
              ? `Modèle 3D : ${vehicle.model3d.name}${vehicle.model3d.isIllustrative ? " (illustratif)" : ""}`
              : "Aucun modèle 3D associé à ce véhicule."}
          </p>
          <div className="flex flex-wrap gap-2 px-5 pb-5">
            <ButtonLink href={`/documents${q}`} variant="secondary" size="sm">
              Documents
            </ButtonLink>
            <ButtonLink href={`/vue-3d${q}`} variant="secondary" size="sm">
              Vue 3D
            </ButtonLink>
          </div>
        </Card>
      </div>
    </>
  );
}
