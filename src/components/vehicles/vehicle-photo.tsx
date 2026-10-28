import { CarSilhouette } from "../brand/car-silhouette";
import { cn } from "../ui/cn";

export function VehiclePhoto({
  vehicle,
  className,
  alt,
}: {
  vehicle: { id: string; photoKey: string | null; updatedAt: Date; make: string; model: string };
  className?: string;
  alt?: string;
}) {
  if (vehicle.photoKey) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- image privée servie par une route authentifiée
      <img
        src={`/api/vehicules/${vehicle.id}/photo?v=${vehicle.updatedAt.getTime()}`}
        alt={alt ?? `${vehicle.make} ${vehicle.model}`}
        className={cn("h-full w-full object-cover", className)}
        loading="lazy"
      />
    );
  }
  return (
    <div className={cn("grid h-full w-full place-items-center bg-[radial-gradient(closest-side,rgb(255_255_255/0.05),transparent)] p-4", className)}>
      <CarSilhouette className="max-w-[90%] opacity-80" />
    </div>
  );
}
