import { deleteDocumentAction, uploadDocument } from "@/app/actions/documents";
import { DocumentsView } from "@/components/views/documents-view";
import { NoVehicle } from "@/components/vehicles/no-vehicle";
import { DOCUMENT_LABELS } from "@/lib/labels";
import { isEnumValue, param, type SearchParams } from "@/lib/search-params";
import { prisma } from "@/server/db";
import { listDocuments } from "@/server/documents";
import { resolveSelectedVehicle } from "@/server/selection";
import { requireUser } from "@/server/session";

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
  return (
    <DocumentsView
      vehicle={vehicle}
      docs={docs}
      interventions={interventions}
      category={category}
      q={q}
      deleteAction={deleteDocumentAction}
      uploadAction={uploadDocument}
    />
  );
}
