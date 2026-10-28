import { Upload } from "lucide-react";
import { DemoBadge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { Explorer } from "@/components/viewer3d/explorer";
import { DEMO_MODEL_ID } from "@/lib/demo-model";
import { param, type SearchParams } from "@/lib/search-params";
import { resolveVehicleModel } from "@/lib/vehicle-models";
import { vehicleLabel } from "@/lib/vehicle";
import { listComponents } from "@/server/components";
import { getExplorerModel } from "@/server/models3d";
import { resolveSelectedVehicle } from "@/server/selection";
import { requireUser } from "@/server/session";

export const metadata = { title: "Vue 3D" };

export default async function ViewerPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const user = await requireUser();
  const sp = await searchParams;
  const { selected: vehicle } = await resolveSelectedVehicle(user.id, param(sp, "v"));
  const forceGeneric = param(sp, "demo") === "1";
  const own = vehicle?.model3dId && vehicle.model3dId !== DEMO_MODEL_ID ? await getExplorerModel(user.id, vehicle.model3dId) : null;
  const { model, preferred } = resolveVehicleModel(vehicle, own, { forceGeneric, demoModelId: DEMO_MODEL_ID });
  const components = await listComponents();

  return (
    <>
      <PageHeader
        title="Vue 3D"
        subtitle={
          <>
            {vehicle ? vehicleLabel(vehicle) : "Véhicule de présentation"} {model.isIllustrative && <DemoBadge className="ml-1" />}
          </>
        }
        actions={
          vehicle && (
            <ButtonLink href={`/vue-3d/import?v=${vehicle.id}`} variant="secondary" size="sm">
              <Upload size={14} aria-hidden /> {own?.kind === "GLB" ? "Gérer le modèle" : "Importer le modèle de ce véhicule"}
            </ButtonLink>
          )
        }
      />
      <Explorer
        model={model}
        preferredModel={preferred}
        components={components.map((c) => ({ id: c.id, slug: c.slug, name: c.name, family: c.family, system: c.system, electronicKind: c.electronicKind }))}
        vehicleId={vehicle?.id ?? null}
        initialSlug={param(sp, "composant") ?? null}
      />
    </>
  );
}
