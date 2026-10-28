import { Box, Info, Upload } from "lucide-react";
import { DemoBadge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { Explorer } from "@/components/viewer3d/explorer";
import { param, type SearchParams } from "@/lib/search-params";
import { listComponents } from "@/server/components";
import { getDemoExplorerModel, getExplorerModel } from "@/server/models3d";
import { resolveSelectedVehicle } from "@/server/selection";
import { requireUser } from "@/server/session";
import { vehicleLabel } from "@/server/vehicles";

export const metadata = { title: "Vue 3D" };

export default async function ViewerPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const user = await requireUser();
  const sp = await searchParams;
  const { selected: vehicle } = await resolveSelectedVehicle(user.id, param(sp, "v"));
  const forceDemo = param(sp, "demo") === "1";
  const vehicleModel = vehicle?.model3dId && !forceDemo ? await getExplorerModel(user.id, vehicle.model3dId) : null;
  const model = vehicleModel ?? (forceDemo || !vehicle ? await getDemoExplorerModel(user.id) : null);
  const usingDemoForOtherVehicle = !vehicleModel && !!model && model.kind === "PROCEDURAL_DEMO";

  if (!model) {
    // Véhicule sans modèle compatible : état explicite, aucune fausse mécanique.
    return (
      <>
        <PageHeader title="Vue 3D" subtitle={vehicle ? vehicleLabel(vehicle) : undefined} />
        <Card className="mx-auto max-w-2xl p-6 sm:p-8">
          <span className="grid size-12 place-items-center rounded-full border border-line-strong bg-surface-2 text-muted" aria-hidden>
            <Box size={22} />
          </span>
          <h2 className="mt-4 text-lg font-semibold">Aucun modèle 3D pour ce véhicule</h2>
          <p className="mt-2 text-sm text-muted">
            CarView ne dispose pas automatiquement d’un modèle détaillé de chaque voiture. Nous n’affichons pas de représentation inventée de la
            mécanique de votre {vehicle ? vehicleLabel(vehicle) : "véhicule"}.
          </p>
          <ul className="mt-4 list-disc pl-5 text-sm text-ink-2">
            <li>Importez un modèle GLB dont vous avez le droit d’usage, puis associez ses objets aux fiches de composants.</li>
            <li>Ou explorez le véhicule générique de démonstration : simplifié, mais réellement interactif.</li>
          </ul>
          <div className="mt-6 flex flex-wrap gap-2">
            {vehicle && (
              <ButtonLink href={`/vue-3d/import?v=${vehicle.id}`}>
                <Upload size={15} aria-hidden /> Importer un modèle GLB
              </ButtonLink>
            )}
            <ButtonLink href={`/vue-3d?${vehicle ? `v=${vehicle.id}&` : ""}demo=1`} variant="secondary">
              Explorer le véhicule de démonstration
            </ButtonLink>
          </div>
        </Card>
      </>
    );
  }

  const components = await listComponents();
  return (
    <>
      <PageHeader
        title="Vue 3D"
        subtitle={
          <>
            {model.name} {model.isIllustrative && <DemoBadge className="ml-1" />}
          </>
        }
        actions={
          vehicle && (
            <ButtonLink href={`/vue-3d/import?v=${vehicle.id}`} variant="secondary" size="sm">
              <Upload size={14} aria-hidden /> {vehicleModel?.kind === "GLB" ? "Gérer le modèle" : "Importer un modèle"}
            </ButtonLink>
          )
        }
      />
      {model.isIllustrative && (
        <p className="mb-4 flex items-start gap-2 rounded-xl border border-info/30 bg-info/10 px-4 py-3 text-sm text-info">
          <Info size={16} className="mt-0.5 shrink-0" aria-hidden />
          <span>
            {usingDemoForOtherVehicle && vehicle
              ? `Véhicule générique de démonstration : il ne représente pas votre ${vehicleLabel(vehicle)}. `
              : "Modèle illustratif : formes et emplacements simplifiés. "}
            Les fiches décrivent des principes généraux. Source : {model.source}
          </span>
        </p>
      )}
      <Explorer
        model={model}
        components={components.map((c) => ({ id: c.id, slug: c.slug, name: c.name, family: c.family, system: c.system, electronicKind: c.electronicKind }))}
        vehicleId={vehicle?.id ?? null}
        initialSlug={param(sp, "composant") ?? null}
      />
    </>
  );
}
