import { useParams } from "react-router";
import { CatalogView } from "@/components/views/catalog-view";
import { DashboardView } from "@/components/views/dashboard-view";
import { GarageView } from "@/components/views/garage-view";
import { VehicleDetailView } from "@/components/views/vehicle-detail-view";
import { PageHeader } from "@/components/ui/page-header";
import { VehicleForm } from "@/components/vehicles/vehicle-form";
import { CATALOG, CATALOG_COMPAT_SOURCE } from "../../../prisma/demo-data/catalog";
import { DEMO_MODEL_ID } from "@/lib/demo-model";
import { GENERIC_MODEL, resolveVehicleModel } from "@/lib/vehicle-models";
import { FAMILY_LABELS } from "@/lib/labels";
import { isEnumValue } from "@/lib/search-params";
import { vehicleLabel } from "@/lib/vehicle";
import { useDemoActions } from "../actions";
import { photoSrc, useDemo, useParam } from "../hooks";
import { NotFound } from "./not-found";
import { glbModel } from "./viewer";

const MODEL_NAMES: Record<string, { name: string; isIllustrative: boolean }> = { [DEMO_MODEL_ID]: { name: GENERIC_MODEL.name, isIllustrative: true } };

export function DashboardPage() {
  const store = useDemo();
  const vehicle = store.resolveSelected(useParam("v"));
  const year = new Date().getFullYear();
  const owned = vehicle ? store.model(vehicle.model3dId) : null;
  return (
    <DashboardView
      firstName="Visiteur"
      vehicle={vehicle}
      reminders={vehicle ? store.listReminders(vehicle.id) : []}
      interventions={vehicle ? store.listInterventions(vehicle.id).slice(0, 4) : []}
      expenses={vehicle ? store.listExpenses({ vehicleId: vehicle.id, year }) : []}
      prevYearExpenses={vehicle ? store.listExpenses({ vehicleId: vehicle.id, year: year - 1 }) : []}
      year={year}
      photoSrc={photoSrc}
      showcase={vehicle ? resolveVehicleModel(vehicle, owned ? glbModel(owned) : null) : null}
    />
  );
}

export function GaragePage() {
  const store = useDemo();
  return <GarageView vehicles={store.data.vehicles} photoSrc={photoSrc} />;
}

export function VehiclePage() {
  const store = useDemo();
  const actions = useDemoActions();
  const vehicle = store.vehicle(useParams().id);
  if (!vehicle) return <NotFound />;
  const expenses = store.listExpenses({ vehicleId: vehicle.id });
  const model = store.model(vehicle.model3dId);
  return (
    <VehicleDetailView
      vehicle={{
        ...vehicle,
        model3d: vehicle.model3dId ? (model ? { name: model.name, isIllustrative: model.isIllustrative } : (MODEL_NAMES[vehicle.model3dId] ?? null)) : null,
      }}
      interventions={store.listInterventions(vehicle.id).slice(0, 4)}
      openReminders={store.listReminders(vehicle.id).filter((r) => r.evaluation.status !== "REALISE").slice(0, 3)}
      expenseCount={expenses.length}
      expenseTotalCents={expenses.reduce((s, e) => s + e.amountCents, 0)}
      documentCount={store.listDocuments({ vehicleId: vehicle.id }).length}
      deleteAction={actions.deleteVehicle}
      photoSrc={photoSrc}
    />
  );
}

export function NewVehiclePage() {
  const actions = useDemoActions();
  return (
    <>
      <PageHeader title="Ajouter un véhicule" subtitle="Les champs marqués d'un astérisque sont obligatoires." />
      <VehicleForm cancelHref="/garage" action={actions.saveVehicle} photoHint="JPEG, PNG ou WebP, 8 Mo maximum. Stockée uniquement dans ce navigateur." />
    </>
  );
}

export function EditVehiclePage() {
  const store = useDemo();
  const actions = useDemoActions();
  const vehicle = store.vehicle(useParams().id);
  if (!vehicle) return <NotFound />;
  return (
    <>
      <PageHeader title={`Modifier — ${vehicleLabel(vehicle)}`} />
      <VehicleForm initial={{ ...vehicle, hasPhoto: !!vehicle.photoKey }} cancelHref={`/garage/${vehicle.id}`} action={actions.saveVehicle} />
    </>
  );
}

const CATALOG_ITEMS = CATALOG.map((p, i) => ({
  id: String(i),
  name: p.name,
  family: p.family,
  description: p.description,
  reference: null,
  componentSlug: p.componentSlug ?? null,
  compatibility: p.compat ? [{ make: "CarView", model: "Berline générique", yearFrom: null, yearTo: null, source: CATALOG_COMPAT_SOURCE }] : [],
}));

export function CatalogPage() {
  const store = useDemo();
  const vehicle = store.resolveSelected(useParam("v"));
  const raw = useParam("famille");
  const family = isEnumValue(FAMILY_LABELS, raw) ? raw : null;
  const q = useParam("q")?.slice(0, 100) ?? null;
  const ql = q?.toLowerCase();
  const parts = CATALOG_ITEMS.filter((p) => (!family || p.family === family) && (!ql || p.name.toLowerCase().includes(ql) || p.description.toLowerCase().includes(ql)));
  return <CatalogView vehicle={vehicle} parts={parts} family={family} q={q} />;
}
