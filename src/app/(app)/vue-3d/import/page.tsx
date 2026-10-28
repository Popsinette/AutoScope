import Link from "next/link";
import { ArrowLeft, FileBox, Unlink, Upload } from "lucide-react";
import { detachModelAction, importModel } from "@/app/actions/models";
import { ImportModelForm } from "@/components/models/import-form";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { ConfirmAction } from "@/components/ui/confirm-action";
import { PageHeader } from "@/components/ui/page-header";
import { NoVehicle } from "@/components/vehicles/no-vehicle";
import { formatFileSize } from "@/lib/format";
import { param, type SearchParams } from "@/lib/search-params";
import { resolveSelectedVehicle } from "@/server/selection";
import { requireUser } from "@/server/session";
import { getVehicle, vehicleLabel } from "@/server/vehicles";

export const metadata = { title: "Importer un modèle 3D" };

export default async function ImportModelPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const user = await requireUser();
  const sp = await searchParams;
  const { selected: vehicle } = await resolveSelectedVehicle(user.id, param(sp, "v"));
  if (!vehicle) return <NoVehicle what="son modèle 3D" />;
  const full = await getVehicle(user.id, vehicle.id);
  const model = full?.model3d;
  const ownModel = model?.userId === user.id ? model : null;

  return (
    <>
      <Link href={`/vue-3d?v=${vehicle.id}`} className="mb-3 inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink">
        <ArrowLeft size={15} aria-hidden /> Vue 3D
      </Link>
      <PageHeader title="Modèle 3D du véhicule" subtitle={vehicleLabel(vehicle)} />
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.3fr_1fr]">
        <div className="flex flex-col gap-5">
          {ownModel && (
            <Card>
              <CardHeader icon={FileBox} title={ownModel.name} subtitle={`${ownModel.fileSize ? formatFileSize(ownModel.fileSize) : ""} · ${ownModel.nodeNames.length} objets nommés`} />
              <dl className="grid gap-2 px-5 pb-4 text-sm">
                <div>
                  <dt className="text-xs text-muted">Provenance</dt>
                  <dd>{ownModel.source}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted">Licence</dt>
                  <dd>{ownModel.license}</dd>
                </div>
              </dl>
              <div className="flex flex-wrap gap-2 px-5 pb-5">
                <ButtonLink href={`/vue-3d/correspondances/${ownModel.id}`} variant="secondary" size="sm">
                  Modifier les correspondances
                </ButtonLink>
                <ConfirmAction
                  action={detachModelAction}
                  fields={{ vehicleId: vehicle.id }}
                  title="Retirer ce modèle du véhicule ?"
                  confirmLabel="Retirer"
                  trigger={
                    <>
                      <Unlink size={14} aria-hidden /> Retirer le modèle
                    </>
                  }
                >
                  Le fichier et ses correspondances seront supprimés.
                </ConfirmAction>
              </div>
            </Card>
          )}
          <Card>
            <CardHeader icon={Upload} title={ownModel ? "Remplacer par un autre fichier" : "Importer un fichier GLB"} subtitle="Le fichier reste privé et n’est servi qu’à votre compte." />
            <ImportModelForm action={importModel} vehicleId={vehicle.id} defaultName={`${vehicleLabel(vehicle)} — modèle 3D`} />
          </Card>
        </div>
        <Card>
          <CardHeader title="Préparer son modèle" />
          <ol className="flex list-decimal flex-col gap-2 px-5 pb-5 pl-10 text-sm text-ink-2">
            <li>Utilisez uniquement un modèle dont la licence autorise votre usage.</li>
            <li>Exportez au format glTF 2.0 binaire (.glb), Y vers le haut, avant du véhicule vers +Z, en mètres.</li>
            <li>Séparez les sous-ensembles en objets distincts et nommez-les (ex. « Brake_Disc_FL », « Engine_Block »).</li>
            <li>Après l’import, associez chaque objet à une fiche composant. Les modes Mécanique, Électronique et Éclaté ne s’activent que si le modèle contient les objets correspondants.</li>
          </ol>
          <p className="px-5 pb-5 text-xs text-muted">Guide complet : docs/MODELES_3D.md dans le dépôt.</p>
        </Card>
      </div>
    </>
  );
}
