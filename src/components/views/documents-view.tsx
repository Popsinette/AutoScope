import Link from "next/link";
import { Download, FileText, FolderOpen, Image as ImageIcon, Search, Trash2, Upload } from "lucide-react";
import { UploadDocumentForm } from "@/components/documents/upload-form";
import { Badge, DemoBadge } from "@/components/ui/badge";
import { buttonClass, ButtonLink } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { ConfirmAction, type SimpleActionState } from "@/components/ui/confirm-action";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/field";
import { PageHeader } from "@/components/ui/page-header";
import { SegmentedLinks } from "@/components/ui/segmented";
import type { FormState } from "@/components/ui/use-form-action";
import { serverFileHref } from "@/components/vehicles/vehicle-photo";
import { formatDate, formatFileSize, formatShortDate } from "@/lib/format";
import { DOCUMENT_LABELS, INTERVENTION_LABELS } from "@/lib/labels";
import { withParams } from "@/lib/search-params";
import { vehicleLabel } from "@/lib/vehicle";
import type { DocumentCategory, InterventionCategory } from "@/generated/prisma/enums";

export interface DocumentListItem {
  id: string;
  title: string;
  fileName: string;
  mimeType: string;
  size: number;
  category: DocumentCategory;
  createdAt: Date;
  intervention: { id: string; date: Date; category: InterventionCategory } | null;
}

export function DocumentsView({
  vehicle,
  docs,
  interventions,
  category,
  q,
  deleteAction,
  uploadAction,
  fileHref = serverFileHref,
}: {
  vehicle: { id: string; make: string; model: string; trim: string | null; isDemo: boolean };
  docs: DocumentListItem[];
  interventions: { id: string; date: Date; category: InterventionCategory; description: string }[];
  category: DocumentCategory | null;
  q: string | null;
  deleteAction: (state: SimpleActionState, form: FormData) => Promise<SimpleActionState>;
  uploadAction: (form: FormData) => Promise<FormState>;
  fileHref?: (documentId: string) => string;
}) {
  const base = { v: vehicle.id, categorie: category, q };

  return (
    <>
      <PageHeader
        title="Documents"
        subtitle={
          <>
            Factures, photos et documents importants — {vehicleLabel(vehicle)} {vehicle.isDemo && <DemoBadge className="ml-1" />}
          </>
        }
        actions={
          <ButtonLink href="#ajouter" variant="primary">
            <Upload size={15} aria-hidden /> Ajouter
          </ButtonLink>
        }
      />
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <SegmentedLinks
          label="Filtrer par catégorie"
          items={[
            { href: withParams("/documents", base, { categorie: null }), label: "Tous", active: !category },
            ...Object.entries(DOCUMENT_LABELS).map(([key, label]) => ({ href: withParams("/documents", base, { categorie: key }), label, active: category === key })),
          ]}
        />
        <form className="relative ml-auto w-full sm:w-64" role="search" action="/documents">
          <input type="hidden" name="v" value={vehicle.id} />
          {category && <input type="hidden" name="categorie" value={category} />}
          <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" aria-hidden />
          <Input name="q" defaultValue={q ?? ""} placeholder="Rechercher un document…" aria-label="Rechercher un document" className="pl-9" />
        </form>
      </div>

      <Card className="mb-5">
        {docs.length === 0 ? (
          <EmptyState icon={FolderOpen} title={category || q ? "Aucun document ne correspond" : "Aucun document pour ce véhicule"}>
            {category || q ? "Modifiez les filtres ou la recherche." : "Ajoutez vos factures, photos, notices et justificatifs. Ils restent privés."}
          </EmptyState>
        ) : (
          <ul>
            {docs.map((d) => (
              <li key={d.id} className="flex flex-wrap items-center gap-3 border-b border-line px-4 py-3 last:border-0 sm:px-5">
                <span className="grid size-10 place-items-center rounded-lg border border-line-strong bg-surface-2 text-ink-2" aria-hidden>
                  {d.mimeType.startsWith("image/") ? <ImageIcon size={18} /> : <FileText size={18} />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{d.title}</p>
                  <p className="text-xs text-muted">
                    {formatShortDate(d.createdAt)} · {formatFileSize(d.size)} · {d.fileName}
                  </p>
                  {d.intervention && (
                    <Link href={`/entretiens/${d.intervention.id}`} className="text-xs text-ink-2 hover:text-accent-ink">
                      Lié à : {INTERVENTION_LABELS[d.intervention.category]} du {formatDate(d.intervention.date)}
                    </Link>
                  )}
                </div>
                <Badge>{DOCUMENT_LABELS[d.category]}</Badge>
                <div className="flex gap-1">
                  <a href={fileHref(d.id)} download={d.fileName} className={buttonClass("ghost", "sm")} aria-label={`Télécharger ${d.title}`}>
                    <Download size={15} />
                  </a>
                  <ConfirmAction action={deleteAction} fields={{ id: d.id }} title={`Supprimer « ${d.title} » ?`} triggerVariant="ghost" trigger={<><Trash2 size={15} aria-hidden /><span className="sr-only">Supprimer {d.title}</span></>}>
                    Le fichier sera définitivement supprimé.
                  </ConfirmAction>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card aria-labelledby="ajouter-titre">
        <div id="ajouter" className="scroll-mt-20" />
        <CardHeader icon={Upload} title="Ajouter un document" id="ajouter-titre" subtitle="Stockage privé : seul votre compte peut le consulter." />
        <UploadDocumentForm
          action={uploadAction}
          vehicleId={vehicle.id}
          interventions={interventions.map((i) => ({ id: i.id, label: `${formatShortDate(i.date)} — ${INTERVENTION_LABELS[i.category]} : ${i.description}`.slice(0, 90) }))}
        />
      </Card>
    </>
  );
}
