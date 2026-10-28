import { CatalogView } from "@/components/views/catalog-view";
import { FAMILY_LABELS } from "@/lib/labels";
import { isEnumValue, param, type SearchParams } from "@/lib/search-params";
import { listCatalog } from "@/server/catalog";
import { resolveSelectedVehicle } from "@/server/selection";
import { requireUser } from "@/server/session";

export const metadata = { title: "Catalogue de pièces" };

export default async function CatalogPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const user = await requireUser();
  const sp = await searchParams;
  const { selected: vehicle } = await resolveSelectedVehicle(user.id, param(sp, "v"));
  const raw = param(sp, "famille");
  const family = isEnumValue(FAMILY_LABELS, raw) ? raw : null;
  const q = param(sp, "q")?.slice(0, 100) ?? null;
  return <CatalogView vehicle={vehicle} parts={await listCatalog({ family, q })} family={family} q={q} />;
}
