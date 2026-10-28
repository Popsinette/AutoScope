import Link from "next/link";
import { Download, FileText, FolderOpen, Image as ImageIcon, Search, Trash2, Upload } from "lucide-react";
import { deleteDocumentAction } from "@/app/actions/documents";
import { UploadDocumentForm } from "@/components/documents/upload-form";
import { Badge, DemoBadge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { ConfirmAction } from "@/components/ui/confirm-action";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/field";
import { PageHeader } from "@/components/ui/page-header";
import { SegmentedLinks } from "@/components/ui/segmented";
import { NoVehicle } from "@/components/vehicles/no-vehicle";
import { formatDate, formatFileSize, formatShortDate } from "@/lib/format";
import { DOCUMENT_LABELS, INTERVENTION_LABELS } from "@/lib/labels";
import { isEnumValue, param, withParams, type SearchParams } from "@/lib/search-params";
import { prisma } from "@/server/db";
import { listDocuments } from "@/server/documents";
import { resolveSelectedVehicle } from "@/server/selection";
import { requireUser } from "@/server/session";
import { vehicleLabel } from "@/server/vehicles";

export const metadata = { title: "Documents" };

export default async function DocumentsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const user = await requireUser();
  const sp = await searchParams;
  const { selected: vehicle } = await resolveSelectedVehicle(user.id, param(sp, "v"));
  if (!vehicle) return <NoVehicle what="ses documents" />;
  const raw = param(sp, "categorie");
  const category = isEnumValue(DOCUMENT_LABELS, raw) ? raw : null;
  const q = param(sp, "q")?.slice(0, 100) ?? null;
  const [docs, interventions] = await Promise.all([
    listDocuments(user.id, { vehicleId: vehicle.id, category, q }),
    prisma.intervention.findMany({ where: { vehicleId: vehicle.id }, orderBy: { date: "desc" }, select: { id: true, date: true, category: true, description: true } }),
  ]);
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
                  <ButtonLink href={`/api/documents/${d.id}`} prefetch={false} variant="ghost" size="sm" aria-label={`Télécharger ${d.title}`}>
                    <Download size={15} />
                  </ButtonLink>
                  <ConfirmAction action={deleteDocumentAction} fields={{ id: d.id }} title={`Supprimer « ${d.title} » ?`} triggerVariant="ghost" trigger={<><Trash2 size={15} aria-hidden /><span className="sr-only">Supprimer {d.title}</span></>}>
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
          vehicleId={vehicle.id}
          interventions={interventions.map((i) => ({ id: i.id, label: `${formatShortDate(i.date)} — ${INTERVENTION_LABELS[i.category]} : ${i.description}`.slice(0, 90) }))}
        />
      </Card>
    </>
  );
}
