import { ArrowLeft, Box, FileBox, Info, Unlink, Upload } from "lucide-react";
import { Link, useParams } from "react-router";
import { COMPONENTS } from "../../../prisma/demo-data/components";
import { ImportModelForm } from "@/components/models/import-form";
import { MappingForm } from "@/components/models/mapping-form";
import { DemoBadge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { ConfirmAction } from "@/components/ui/confirm-action";
import { PageHeader } from "@/components/ui/page-header";
import { NoVehicle } from "@/components/vehicles/no-vehicle";
import type { SheetLoader } from "@/components/viewer3d/component-sheet";
import { Explorer } from "@/components/viewer3d/explorer";
import type { ExplorerModel } from "@/components/viewer3d/types";
import { DEMO_MODEL_ID, DEMO_NODE_MAPPING } from "@/lib/demo-model";
import { formatFileSize } from "@/lib/format";
import { sanitizeNodeName } from "@/lib/gltf";
import { vehicleLabel } from "@/lib/vehicle";
import { useDemoActions } from "../actions";
import { fileHref, useDemo, useParam } from "../hooks";
import { demoStore } from "../store";
import type { DModel } from "../store/types";
import { NotFound } from "./not-found";

const DEMO_MODEL: ExplorerModel = {
  id: DEMO_MODEL_ID,
  kind: "PROCEDURAL_DEMO",
  name: "Véhicule générique de démonstration",
  url: null,
  isIllustrative: true,
  source: "Géométrie générée en code par CarView (src/components/viewer3d/demo-car.tsx).",
  license: "Code source du projet CarView — aucune ressource tierce.",
  mapping: DEMO_NODE_MAPPING,
};

const EXPLORER_COMPONENTS = COMPONENTS.map((c) => ({ id: c.slug, slug: c.slug, name: c.name, family: c.family, system: c.system, electronicKind: c.electronicKind ?? null }));

const glbModel = (m: DModel): ExplorerModel => ({
  id: m.id,
  kind: "GLB",
  name: m.name,
  url: demoStore.fileUrl(m.id),
  isIllustrative: m.isIllustrative,
  source: m.source,
  license: m.license,
  mapping: Object.fromEntries(Object.entries(m.mapping).map(([node, slug]) => [sanitizeNodeName(node), slug])),
});

const loadSheet: SheetLoader = async (slug, vehicleId) => demoStore.componentSheet(slug, vehicleId);

export function ViewerPage() {
  const store = useDemo();
  const vehicle = store.resolveSelected(useParam("v"));
  const forceDemo = useParam("demo") === "1";
  const composant = useParam("composant") ?? null;
  const owned = vehicle ? store.model(vehicle.model3dId) : null;
  const vehicleModel = forceDemo ? null : owned ? glbModel(owned) : vehicle?.model3dId === DEMO_MODEL_ID ? DEMO_MODEL : null;
  const model = vehicleModel ?? (forceDemo || !vehicle ? DEMO_MODEL : null);
  const usingDemoForOtherVehicle = !vehicleModel && !!model && vehicle?.model3dId !== DEMO_MODEL_ID;

  if (!model) {
    return (
      <>
        <PageHeader title="Vue 3D" subtitle={vehicle ? vehicleLabel(vehicle) : undefined} />
        <Card className="mx-auto max-w-2xl p-6 sm:p-8">
          <span className="grid size-12 place-items-center rounded-full border border-line-strong bg-surface-2 text-muted" aria-hidden>
            <Box size={22} />
          </span>
          <h2 className="mt-4 text-lg font-semibold">Aucun modèle 3D pour ce véhicule</h2>
          <p className="mt-2 text-sm text-muted">
            CarView ne dispose pas automatiquement d’un modèle détaillé de chaque voiture. Nous n’affichons pas de représentation inventée de la mécanique de votre{" "}
            {vehicle ? vehicleLabel(vehicle) : "véhicule"}.
          </p>
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
              <Upload size={14} aria-hidden /> {owned ? "Gérer le modèle" : "Importer un modèle"}
            </ButtonLink>
          )
        }
      />
      {model.isIllustrative && (
        <p className="mb-4 flex items-start gap-2 rounded-xl border border-info/30 bg-info/10 px-4 py-3 text-sm text-info">
          <Info size={16} className="mt-0.5 shrink-0" aria-hidden />
          <span>
            {usingDemoForOtherVehicle && vehicle ? `Véhicule générique de démonstration : il ne représente pas votre ${vehicleLabel(vehicle)}. ` : "Modèle illustratif : formes et emplacements simplifiés. "}
            Les fiches décrivent des principes généraux.
          </span>
        </p>
      )}
      <Explorer key={model.id} model={model} components={EXPLORER_COMPONENTS} vehicleId={vehicle?.id ?? null} initialSlug={composant} loadSheet={loadSheet} fileHref={fileHref} />
    </>
  );
}

export function ImportModelPage() {
  const store = useDemo();
  const actions = useDemoActions();
  const vehicle = store.resolveSelected(useParam("v"));
  if (!vehicle) return <NoVehicle what="son modèle 3D" />;
  const model = store.model(vehicle.model3dId);
  return (
    <>
      <Link to={`/vue-3d?v=${vehicle.id}`} className="mb-3 inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink">
        <ArrowLeft size={15} aria-hidden /> Vue 3D
      </Link>
      <PageHeader title="Modèle 3D du véhicule" subtitle={vehicleLabel(vehicle)} />
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.3fr_1fr]">
        <div className="flex flex-col gap-5">
          {model && (
            <Card>
              <CardHeader icon={FileBox} title={model.name} subtitle={`${formatFileSize(model.fileSize)} · ${model.nodeNames.length} objets nommés`} />
              <dl className="grid gap-2 px-5 pb-4 text-sm">
                <div>
                  <dt className="text-xs text-muted">Provenance</dt>
                  <dd>{model.source}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted">Licence</dt>
                  <dd>{model.license}</dd>
                </div>
              </dl>
              <div className="flex flex-wrap gap-2 px-5 pb-5">
                <ButtonLink href={`/vue-3d/correspondances/${model.id}`} variant="secondary" size="sm">
                  Modifier les correspondances
                </ButtonLink>
                <ConfirmAction
                  action={actions.detachModel}
                  fields={{ vehicleId: vehicle.id }}
                  title="Retirer ce modèle du véhicule ?"
                  confirmLabel="Retirer"
                  trigger={
                    <>
                      <Unlink size={14} aria-hidden /> Retirer le modèle
                    </>
                  }
                >
                  Le fichier et ses correspondances seront supprimés de ce navigateur.
                </ConfirmAction>
              </div>
            </Card>
          )}
          <Card>
            <CardHeader icon={Upload} title={model ? "Remplacer par un autre fichier" : "Importer un fichier GLB"} subtitle="Le fichier reste dans ce navigateur." />
            <ImportModelForm action={actions.importModel} vehicleId={vehicle.id} defaultName={`${vehicleLabel(vehicle)} — modèle 3D`} />
          </Card>
        </div>
        <Card>
          <CardHeader title="Préparer son modèle" />
          <ol className="flex list-decimal flex-col gap-2 px-5 pb-5 pl-10 text-sm text-ink-2">
            <li>Utilisez uniquement un modèle dont la licence autorise votre usage.</li>
            <li>Exportez au format glTF 2.0 binaire (.glb), Y vers le haut, avant du véhicule vers +Z, en mètres.</li>
            <li>Séparez les sous-ensembles en objets distincts et nommez-les (ex. « Brake_Disc_FL », « Engine_Block »).</li>
            <li>Associez ensuite chaque objet à une fiche composant.</li>
          </ol>
        </Card>
      </div>
    </>
  );
}

export function MappingPage() {
  const store = useDemo();
  const actions = useDemoActions();
  const model = store.model(useParams().id);
  if (!model) return <NotFound />;
  const vehicle = store.data.vehicles.find((v) => v.model3dId === model.id);
  return (
    <>
      <Link to={vehicle ? `/vue-3d/import?v=${vehicle.id}` : "/vue-3d"} className="mb-3 inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink">
        <ArrowLeft size={15} aria-hidden /> Modèle 3D
      </Link>
      <PageHeader title="Correspondances" subtitle={`${model.name} — associez chaque objet du fichier à une fiche composant.`} />
      <Card>
        <MappingForm
          action={actions.saveMappings}
          modelId={model.id}
          nodeNames={model.nodeNames}
          current={model.mapping}
          components={COMPONENTS.map((c) => ({ slug: c.slug, name: c.name, family: c.family }))}
          viewHref={vehicle ? `/vue-3d?v=${vehicle.id}` : "/vue-3d"}
        />
      </Card>
    </>
  );
}
