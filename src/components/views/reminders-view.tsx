import Link from "next/link";
import { BellOff, Bell, CalendarClock, CheckCircle2, Gauge, Pencil, Plus, RotateCcw, Trash2 } from "lucide-react";
import { ReminderForm } from "@/components/reminders/reminder-form";
import { ReminderStatusBadge } from "@/components/reminders/status-badge";
import { Badge, DemoBadge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { SubmitButton } from "@/components/ui/submit-button";
import { Card, CardHeader } from "@/components/ui/card";
import { ConfirmAction, type SimpleActionState } from "@/components/ui/confirm-action";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { SegmentedLinks } from "@/components/ui/segmented";
import { formatDate, formatKm } from "@/lib/format";
import { INTERVENTION_LABELS, ORIGIN_LABELS } from "@/lib/labels";
import { describeRemaining, SOON_DAYS, SOON_KM, STATUS_LABELS, type ReminderEvaluation, type ReminderStatus } from "@/lib/reminders";
import { withParams } from "@/lib/search-params";
import { vehicleLabel } from "@/lib/vehicle";
import type { FormState } from "@/components/ui/use-form-action";
import type { InterventionCategory, ReminderOrigin } from "@/generated/prisma/enums";

export const REMINDER_TABS: { key: ReminderStatus | "toutes"; label: string }[] = [
  { key: "toutes", label: "En cours" },
  { key: "DEPASSE", label: STATUS_LABELS.DEPASSE },
  { key: "PROCHE", label: "Prochainement" },
  { key: "A_VENIR", label: STATUS_LABELS.A_VENIR },
  { key: "REALISE", label: STATUS_LABELS.REALISE },
];

export interface ReminderListItem {
  id: string;
  title: string;
  category: InterventionCategory;
  dueDate: Date | null;
  dueMileage: number | null;
  origin: ReminderOrigin;
  sourceReference: string | null;
  notes: string | null;
  completedAt: Date | null;
  completedBy: { id: string; date: Date } | null;
  sourceIntervention: { id: string; date: Date } | null;
  evaluation: ReminderEvaluation;
}

export function RemindersView({
  vehicle,
  tab,
  reminders,
  emailReady,
  toggleAction,
  deleteAction,
  saveAction,
}: {
  vehicle: { id: string; make: string; model: string; trim: string | null; mileage: number; isDemo: boolean };
  tab: ReminderStatus | "toutes";
  reminders: ReminderListItem[];
  emailReady: boolean;
  toggleAction: (form: FormData) => Promise<void>;
  deleteAction: (state: SimpleActionState, form: FormData) => Promise<SimpleActionState>;
  saveAction: (form: FormData) => Promise<FormState>;
}) {
  const count = (s: ReminderStatus) => reminders.filter((r) => r.evaluation.status === s).length;
  const visible = reminders.filter((r) => (tab === "toutes" ? r.evaluation.status !== "REALISE" : r.evaluation.status === tab));

  return (
    <>
      <PageHeader
        title="Échéances"
        subtitle={
          <>
            {vehicleLabel(vehicle)} · {formatKm(vehicle.mileage)} au compteur {vehicle.isDemo && <DemoBadge className="ml-1" />}
          </>
        }
        actions={
          <ButtonLink href="#ajouter">
            <Plus size={15} aria-hidden /> Nouvelle échéance
          </ButtonLink>
        }
      />
      <div className="mb-4">
        <SegmentedLinks
          label="Filtrer par statut"
          items={REMINDER_TABS.map((t) => ({
            href: withParams("/echeances", { v: vehicle.id }, { statut: t.key === "toutes" ? null : t.key }),
            label: t.label,
            active: tab === t.key,
            count: t.key === "toutes" ? reminders.length - count("REALISE") : count(t.key),
          }))}
        />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_320px]">
        <Card>
          {visible.length === 0 ? (
            <EmptyState icon={CalendarClock} title="Aucune échéance ici">
              Créez une échéance par date, par kilométrage ou les deux. Elle sera signalée dès que l’un des seuils est atteint.
            </EmptyState>
          ) : (
            <ul>
              {visible.map((r) => (
                <li key={r.id} className="flex flex-wrap items-start gap-3 border-b border-line p-4 last:border-0 sm:px-5" data-testid="reminder-row">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium">{r.title}</p>
                      <ReminderStatusBadge status={r.evaluation.status} />
                      <Badge tone={r.origin === "CONSTRUCTEUR_DOCUMENTE" ? "info" : "neutral"}>{ORIGIN_LABELS[r.origin]}</Badge>
                    </div>
                    <p className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-ink-2">
                      <span>{INTERVENTION_LABELS[r.category]}</span>
                      {r.dueDate && (
                        <span className="inline-flex items-center gap-1">
                          <CalendarClock size={13} aria-hidden /> {formatDate(r.dueDate)}
                        </span>
                      )}
                      {r.dueMileage !== null && (
                        <span className="inline-flex items-center gap-1">
                          <Gauge size={13} aria-hidden /> {formatKm(r.dueMileage)}
                        </span>
                      )}
                    </p>
                    {r.evaluation.status !== "REALISE" ? (
                      <p className="mt-1 text-xs text-muted">{describeRemaining(r.evaluation)}</p>
                    ) : (
                      <p className="mt-1 text-xs text-muted">
                        Réalisée le {formatDate(r.completedAt!)}
                        {r.completedBy && (
                          <>
                            {" — "}
                            <Link href={`/entretiens/${r.completedBy.id}`} className="text-ink-2 hover:text-accent-ink">
                              voir l’intervention
                            </Link>
                          </>
                        )}
                      </p>
                    )}
                    {r.sourceReference && <p className="mt-1 text-xs text-muted">Source : {r.sourceReference}</p>}
                    {r.sourceIntervention && (
                      <p className="mt-1 text-xs text-muted">
                        Créée depuis{" "}
                        <Link href={`/entretiens/${r.sourceIntervention.id}`} className="text-ink-2 hover:text-accent-ink">
                          l’intervention du {formatDate(r.sourceIntervention.date)}
                        </Link>
                      </p>
                    )}
                    {r.notes && <p className="mt-1 text-xs text-muted">{r.notes}</p>}
                  </div>
                  <div className="flex flex-wrap items-center gap-1">
                    {r.evaluation.status !== "REALISE" ? (
                      <>
                        <ButtonLink href={`/entretiens/nouveau?echeance=${r.id}`} variant="secondary" size="sm">
                          <CheckCircle2 size={14} aria-hidden /> Saisir l’intervention
                        </ButtonLink>
                        <form action={toggleAction}>
                          <input type="hidden" name="id" value={r.id} />
                          <input type="hidden" name="completed" value="1" />
                          <SubmitButton variant="ghost" size="sm" pendingLabel="…">
                            Marquer réalisée
                          </SubmitButton>
                        </form>
                      </>
                    ) : (
                      <form action={toggleAction}>
                        <input type="hidden" name="id" value={r.id} />
                        <input type="hidden" name="completed" value="0" />
                        <SubmitButton variant="ghost" size="sm" pendingLabel="…">
                          <RotateCcw size={14} aria-hidden /> Rouvrir
                        </SubmitButton>
                      </form>
                    )}
                    <ButtonLink href={`/echeances/${r.id}/modifier`} variant="ghost" size="sm">
                      <Pencil size={14} aria-hidden />
                      <span className="sr-only">Modifier {r.title}</span>
                    </ButtonLink>
                    <ConfirmAction action={deleteAction} fields={{ id: r.id }} title={`Supprimer « ${r.title} » ?`} triggerVariant="ghost" trigger={<><Trash2 size={14} aria-hidden /><span className="sr-only">Supprimer {r.title}</span></>} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <CardHeader icon={Bell} title="Rappels" subtitle="Comment vous êtes prévenu" />
          <ul className="flex flex-col gap-3 px-5 pb-5 text-sm">
            <li className="flex items-start gap-2">
              <Bell size={16} className="mt-0.5 text-ok" aria-hidden />
              <span>
                <strong className="font-medium">Dans l’application : actif.</strong>
                <span className="block text-xs text-muted">
                  Tableau de bord et compteur du menu. « Prochainement » = moins de {SOON_DAYS} jours ou {formatKm(SOON_KM)}.
                </span>
              </span>
            </li>
            <li className="flex items-start gap-2">
              <BellOff size={16} className="mt-0.5 text-muted" aria-hidden />
              <span>
                <strong className="font-medium">Par e-mail : {emailReady ? "configuré" : "non disponible"}.</strong>
                <span className="block text-xs text-muted">Aucun service d’envoi n’est branché sur cette installation ; aucun e-mail n’est envoyé.</span>
              </span>
            </li>
            <li className="flex items-start gap-2">
              <BellOff size={16} className="mt-0.5 text-muted" aria-hidden />
              <span>
                <strong className="font-medium">Notifications push : non disponibles.</strong>
                <span className="block text-xs text-muted">Intégration prévue (voir la documentation).</span>
              </span>
            </li>
          </ul>
        </Card>
      </div>

      <Card className="mt-5">
        <div id="ajouter" className="scroll-mt-20" />
        <CardHeader icon={Plus} title="Nouvelle échéance" subtitle="Ne saisissez une préconisation constructeur qu’avec sa source (carnet, notice)." />
        <ReminderForm vehicleId={vehicle.id} currentMileage={vehicle.mileage} action={saveAction} />
      </Card>
    </>
  );
}
