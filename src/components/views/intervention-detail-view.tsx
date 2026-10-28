import Link from "next/link";
import { ArrowLeft, Box, CalendarClock, Download, FileText, Image as ImageIcon, Pencil, Trash2, Wallet } from "lucide-react";
import { CategoryIcon } from "@/components/interventions/category-icon";
import { DemoBadge } from "@/components/ui/badge";
import { buttonClass, ButtonLink } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { ConfirmAction, type SimpleActionState } from "@/components/ui/confirm-action";
import { serverFileHref } from "@/components/vehicles/vehicle-photo";
import { formatDate, formatEuros, formatFileSize, formatKm } from "@/lib/format";
import { EXPENSE_LABELS, FAMILY_LABELS, INTERVENTION_LABELS } from "@/lib/labels";
import { vehicleLabel } from "@/lib/vehicle";
import type { ComponentFamily, ExpenseCategory, InterventionCategory } from "@/generated/prisma/enums";

export interface InterventionDetail {
  id: string;
  vehicleId: string;
  vehicle: { make: string; model: string; trim: string | null; isDemo: boolean };
  date: Date;
  mileage: number;
  category: InterventionCategory;
  description: string;
  garage: string | null;
  partsCostCents: number;
  laborCostCents: number;
  notes: string | null;
  replacedParts: { id: string; name: string; reference: string | null; quantity: number }[];
  components: { component: { id: string; slug: string; name: string; family: ComponentFamily } }[];
  documents: { id: string; title: string; fileName: string; mimeType: string; size: number }[];
  expense: { amountCents: number; category: ExpenseCategory } | null;
  followUpReminder: { dueDate: Date | null; dueMileage: number | null } | null;
}

export function InterventionDetailView({
  intervention: i,
  deleteAction,
  fileHref = serverFileHref,
}: {
  intervention: InterventionDetail;
  deleteAction: (state: SimpleActionState, form: FormData) => Promise<SimpleActionState>;
  fileHref?: (documentId: string) => string;
}) {
  const total = i.partsCostCents + i.laborCostCents;

  return (
    <>
      <Link href={`/entretiens?v=${i.vehicleId}`} className="mb-3 inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink">
        <ArrowLeft size={15} aria-hidden /> Carnet d’entretien
      </Link>
      <header className="mb-6 flex flex-wrap items-start gap-4">
        <CategoryIcon category={i.category} />
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-semibold tracking-tight">{i.description}</h1>
          <p className="mt-1 text-sm text-muted">
            {INTERVENTION_LABELS[i.category]} · {formatDate(i.date)} · {formatKm(i.mileage)} · {vehicleLabel(i.vehicle)}{" "}
            {i.vehicle.isDemo && <DemoBadge className="ml-1" />}
          </p>
        </div>
        <div className="flex gap-2">
          <ButtonLink href={`/entretiens/${i.id}/modifier`} variant="secondary" size="sm">
            <Pencil size={14} aria-hidden /> Modifier
          </ButtonLink>
          <ConfirmAction
            action={deleteAction}
            fields={{ id: i.id }}
            title="Supprimer cette intervention ?"
            trigger={
              <>
                <Trash2 size={14} aria-hidden /> Supprimer
              </>
            }
          >
            La dépense liée et l’échéance de suivi seront supprimées. Les documents joints restent disponibles dans les documents du véhicule.
          </ConfirmAction>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Détails" />
          <dl className="grid gap-x-6 gap-y-4 px-5 pb-5 text-sm sm:grid-cols-3">
            <div>
              <dt className="text-xs text-muted">Garage / intervenant</dt>
              <dd className="mt-0.5">{i.garage ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted">Pièces</dt>
              <dd className="mt-0.5 tabular-nums">{formatEuros(i.partsCostCents)}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted">Main-d’œuvre</dt>
              <dd className="mt-0.5 tabular-nums">{formatEuros(i.laborCostCents)}</dd>
            </div>
            <div className="sm:col-span-3">
              <dt className="text-xs text-muted">Pièces remplacées</dt>
              <dd className="mt-1">
                {i.replacedParts.length === 0 ? (
                  <span className="text-muted">Aucune pièce renseignée.</span>
                ) : (
                  <ul className="flex flex-col gap-1">
                    {i.replacedParts.map((p) => (
                      <li key={p.id}>
                        {p.quantity > 1 && <span className="tabular-nums text-muted">{p.quantity} × </span>}
                        {p.name}
                        {p.reference && <span className="ml-2 font-mono text-xs text-muted">réf. {p.reference}</span>}
                      </li>
                    ))}
                  </ul>
                )}
              </dd>
            </div>
            {i.notes && (
              <div className="sm:col-span-3">
                <dt className="text-xs text-muted">Notes</dt>
                <dd className="mt-1 whitespace-pre-line text-ink-2">{i.notes}</dd>
              </div>
            )}
          </dl>
        </Card>

        <div className="flex flex-col gap-5">
          <Card>
            <CardHeader icon={Wallet} title="Dépense liée" />
            <div className="px-5 pb-5 text-sm">
              {i.expense ? (
                <>
                  <p className="text-2xl font-semibold tabular-nums">{formatEuros(i.expense.amountCents)}</p>
                  <p className="text-muted">
                    Catégorie « {EXPENSE_LABELS[i.expense.category]} » — calculée automatiquement à partir des coûts (comptée une seule fois).
                  </p>
                </>
              ) : (
                <p className="text-muted">{total === 0 ? "Aucun coût saisi : aucune dépense n’est créée." : "—"}</p>
              )}
            </div>
          </Card>
          <Card>
            <CardHeader icon={CalendarClock} title="Échéance de suivi" />
            <div className="px-5 pb-5 text-sm">
              {i.followUpReminder ? (
                <Link href={`/echeances?v=${i.vehicleId}`} className="hover:text-accent-ink">
                  {i.followUpReminder.dueDate && `Le ${formatDate(i.followUpReminder.dueDate)}`}
                  {i.followUpReminder.dueDate && i.followUpReminder.dueMileage !== null && " ou "}
                  {i.followUpReminder.dueMileage !== null && `à ${formatKm(i.followUpReminder.dueMileage)}`}
                </Link>
              ) : (
                <p className="text-muted">Aucune prochaine échéance définie.</p>
              )}
            </div>
          </Card>
        </div>

        <Card className="lg:col-span-2">
          <CardHeader icon={FileText} title="Documents" subtitle="Factures, photos et justificatifs" />
          <ul className="px-5 pb-5">
            {i.documents.length === 0 && <li className="text-sm text-muted">Aucun document joint. Ajoutez-en en modifiant l’intervention.</li>}
            {i.documents.map((d) => (
              <li key={d.id} className="flex items-center gap-3 border-t border-line py-2.5 first:border-0">
                {d.mimeType.startsWith("image/") ? <ImageIcon size={18} className="text-muted" aria-hidden /> : <FileText size={18} className="text-muted" aria-hidden />}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm">{d.title}</p>
                  <p className="text-xs text-muted">
                    {d.fileName} · {formatFileSize(d.size)}
                  </p>
                </div>
                <a href={fileHref(d.id)} download={d.fileName} className={buttonClass("ghost", "sm")} aria-label={`Télécharger ${d.title}`}>
                  <Download size={15} />
                </a>
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <CardHeader icon={Box} title="Composants concernés" />
          <ul className="flex flex-wrap gap-2 px-5 pb-5">
            {i.components.length === 0 && <li className="text-sm text-muted">Aucun composant relié.</li>}
            {i.components.map(({ component }) => (
              <li key={component.id}>
                <Link href={`/vue-3d?v=${i.vehicleId}&composant=${component.slug}`} className="inline-flex items-center gap-1.5 rounded-full border border-line-strong px-3 py-1 text-xs hover:border-accent">
                  {component.name} <span className="text-muted">· {FAMILY_LABELS[component.family]}</span>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </>
  );
}
