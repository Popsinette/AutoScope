import Link from "next/link";
import { BadgeCheck, CircleHelp, Puzzle, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/field";
import { PageHeader } from "@/components/ui/page-header";
import { SegmentedLinks } from "@/components/ui/segmented";
import { FAMILY_LABELS } from "@/lib/labels";
import { isEnumValue, param, withParams, type SearchParams } from "@/lib/search-params";
import { compatibilityFor, listCatalog } from "@/server/catalog";
import { resolveSelectedVehicle } from "@/server/selection";
import { requireUser } from "@/server/session";
import { vehicleLabel } from "@/server/vehicles";

export const metadata = { title: "Catalogue de pièces" };

export default async function CatalogPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const user = await requireUser();
  const sp = await searchParams;
  const { selected: vehicle } = await resolveSelectedVehicle(user.id, param(sp, "v"));
  const raw = param(sp, "famille");
  const family = isEnumValue(FAMILY_LABELS, raw) ? raw : null;
  const q = param(sp, "q")?.slice(0, 100) ?? null;
  const parts = await listCatalog({ family, q });
  const base = { famille: family, q };

  return (
    <>
      <PageHeader
        title="Catalogue de pièces"
        subtitle={vehicle ? `Compatibilité affichée pour : ${vehicleLabel(vehicle)} (${vehicle.year})` : "Trouvez la bonne pièce, facilement."}
      />
      <p className="mb-4 rounded-xl border border-warn/30 bg-warn/10 px-4 py-3 text-sm text-warn">
        Catalogue de démonstration : références génériques. Une pièce n’est indiquée « compatible » que si une donnée de compatibilité explicite
        existe pour votre véhicule ; sinon, la compatibilité est à vérifier auprès d’un professionnel ou de la documentation constructeur.
      </p>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <SegmentedLinks
          label="Filtrer par famille"
          items={[
            { href: withParams("/catalogue", base, { famille: null }), label: "Toutes", active: !family },
            ...Object.entries(FAMILY_LABELS).map(([k, label]) => ({ href: withParams("/catalogue", base, { famille: k }), label, active: family === k })),
          ]}
        />
        <form role="search" action="/catalogue" className="relative w-full sm:ml-auto sm:w-72">
          {family && <input type="hidden" name="famille" value={family} />}
          <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" aria-hidden />
          <Input name="q" defaultValue={q ?? ""} placeholder="Rechercher une pièce, une référence…" aria-label="Rechercher une pièce" className="pl-9" />
        </form>
      </div>
      {parts.length === 0 ? (
        <Card>
          <EmptyState icon={Puzzle} title="Aucune pièce ne correspond">Modifiez la famille ou la recherche.</EmptyState>
        </Card>
      ) : (
        <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {parts.map((p) => {
            const match = compatibilityFor(p.compatibility, vehicle);
            return (
              <li key={p.id} className="card flex flex-col gap-2 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium">{p.name}</p>
                    <p className="text-xs text-muted">{FAMILY_LABELS[p.family]}</p>
                  </div>
                  {match ? (
                    <Badge tone="ok" title={`Source : ${match.source}`}>
                      <BadgeCheck size={12} aria-hidden /> Compatible
                    </Badge>
                  ) : (
                    <Badge tone="warn">
                      <CircleHelp size={12} aria-hidden /> Compatibilité à vérifier
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-ink-2">{p.description}</p>
                {match && <p className="text-xs text-muted">Source de compatibilité : {match.source}</p>}
                <div className="mt-auto flex items-center justify-between gap-2 pt-1 text-xs text-muted">
                  <span>{p.reference ? `Réf. ${p.reference}` : "Référence générique"}</span>
                  {p.componentSlug && (
                    <Link href={`/vue-3d?demo=1&composant=${p.componentSlug}`} className="text-ink-2 hover:text-accent-ink">
                      Fiche du composant
                    </Link>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
