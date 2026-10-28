import { InterventionsView } from "@/components/views/interventions-view";
import { NoVehicle } from "@/components/vehicles/no-vehicle";
import { INTERVENTION_LABELS } from "@/lib/labels";
import { isEnumValue, param, type SearchParams } from "@/lib/search-params";
import { listInterventions } from "@/server/interventions";
import { resolveSelectedVehicle } from "@/server/selection";
import { requireUser } from "@/server/session";

export const metadata = { title: "Carnet d’entretien" };

export default async function InterventionsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const user = await requireUser();
  const sp = await searchParams;
  const { selected: vehicle } = await resolveSelectedVehicle(user.id, param(sp, "v"));
  if (!vehicle) return <NoVehicle what="son carnet d’entretien" />;
  const rawCategory = param(sp, "categorie");
  const category = isEnumValue(INTERVENTION_LABELS, rawCategory) ? rawCategory : undefined;
  const q = param(sp, "q")?.slice(0, 100);
  const items = await listInterventions(user.id, vehicle.id, { category, q });
  return (
    <InterventionsView
      vehicle={vehicle}
      items={items.map(({ _count, ...i }) => ({ ...i, documentCount: _count.documents }))}
      category={category}
      q={q}
      view={param(sp, "vue") === "tableau" ? "tableau" : "chronologie"}
    />
  );
}
