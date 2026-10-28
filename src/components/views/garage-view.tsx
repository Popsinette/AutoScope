import Link from "next/link";
import { Car, Plus } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { DemoBadge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { serverPhotoSrc, VehiclePhoto, type PhotoVehicle } from "@/components/vehicles/vehicle-photo";
import { formatKm } from "@/lib/format";
import { vehicleLabel } from "@/lib/vehicle";

export function GarageView({
  vehicles,
  photoSrc = serverPhotoSrc,
}: {
  vehicles: (PhotoVehicle & { trim: string | null; year: number; mileage: number; isDemo: boolean })[];
  photoSrc?: (v: PhotoVehicle) => string | null;
}) {
  return (
    <>
      <PageHeader
        title="Mon garage"
        subtitle="Toutes vos voitures au même endroit."
        actions={
          <ButtonLink href="/garage/nouveau">
            <Plus size={16} aria-hidden /> Ajouter une voiture
          </ButtonLink>
        }
      />
      {vehicles.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={Car}
            title="Votre garage est vide"
            action={
              <ButtonLink href="/garage/nouveau">
                <Plus size={16} aria-hidden /> Ajouter ma première voiture
              </ButtonLink>
            }
          >
            Ajoutez un véhicule pour suivre son entretien, ses dépenses, ses documents et ses échéances.
          </EmptyState>
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {vehicles.map((v) => (
            <li key={v.id}>
              <Link href={`/garage/${v.id}`} className="card group block overflow-hidden transition-colors hover:border-line-strong">
                <div className="relative aspect-[16/9] overflow-hidden bg-bg">
                  <VehiclePhoto vehicle={v} src={photoSrc(v)} className="transition-transform duration-500 group-hover:scale-[1.03]" />
                  {v.isDemo && <DemoBadge className="absolute left-3 top-3" />}
                </div>
                <div className="flex items-end justify-between gap-3 p-4">
                  <div className="min-w-0">
                    <h2 className="truncate font-semibold">{vehicleLabel(v)}</h2>
                    <p className="text-sm text-muted">
                      {v.year} · {formatKm(v.mileage)}
                    </p>
                  </div>
                  <span className="rounded-lg border border-line-strong px-3 py-1.5 text-xs text-ink-2 group-hover:border-accent group-hover:text-ink">Voir</span>
                </div>
              </Link>
            </li>
          ))}
          <li>
            <Link href="/garage/nouveau" className="flex h-full min-h-48 flex-col items-center justify-center gap-2 rounded-[14px] border border-dashed border-line-strong text-sm text-muted hover:border-accent hover:text-ink">
              <Plus size={20} aria-hidden /> Ajouter une voiture
            </Link>
          </li>
        </ul>
      )}
    </>
  );
}
