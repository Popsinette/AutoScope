import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { VehicleForm } from "@/components/vehicles/vehicle-form";
import { requireUser } from "@/server/session";
import { getVehicle, vehicleLabel } from "@/server/vehicles";

export const metadata = { title: "Modifier le véhicule" };

export default async function EditVehiclePage({ params }: PageProps<"/garage/[id]/modifier">) {
  const user = await requireUser();
  const { id } = await params;
  const vehicle = await getVehicle(user.id, id);
  if (!vehicle) notFound();
  return (
    <>
      <PageHeader title={`Modifier — ${vehicleLabel(vehicle)}`} />
      <VehicleForm initial={{ ...vehicle, hasPhoto: !!vehicle.photoKey }} cancelHref={`/garage/${vehicle.id}`} />
    </>
  );
}
