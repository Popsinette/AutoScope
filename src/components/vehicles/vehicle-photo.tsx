import { CarSilhouette } from "../brand/car-silhouette";
import { cn } from "../ui/cn";

export interface PhotoVehicle {
  id: string;
  photoKey: string | null;
  updatedAt: Date;
  make: string;
  model: string;
}

/** URL de la photo servie par l'application serveur (route authentifiée). */
export const serverPhotoSrc = (v: PhotoVehicle) => (v.photoKey ? `/api/vehicules/${v.id}/photo?v=${v.updatedAt.getTime()}` : null);

/** URL de téléchargement d'un document dans l'application serveur. */
export const serverFileHref = (documentId: string) => `/api/documents/${documentId}`;

export function VehiclePhoto({
  vehicle,
  className,
  alt,
  src = serverPhotoSrc(vehicle),
}: {
  vehicle: PhotoVehicle;
  className?: string;
  alt?: string;
  src?: string | null;
}) {
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- image privée servie par une route authentifiée ou un blob local
      <img src={src} alt={alt ?? `${vehicle.make} ${vehicle.model}`} className={cn("h-full w-full object-cover", className)} loading="lazy" />
    );
  }
  return (
    <div className={cn("grid h-full w-full place-items-center bg-[radial-gradient(closest-side,rgb(255_255_255/0.05),transparent)] p-4", className)}>
      <CarSilhouette className="max-w-[90%] opacity-80" />
    </div>
  );
}
