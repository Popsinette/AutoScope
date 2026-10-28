import { PageHeader } from "@/components/ui/page-header";
import { VehicleForm } from "@/components/vehicles/vehicle-form";
import { requireUser } from "@/server/session";

export const metadata = { title: "Ajouter un véhicule" };

export default async function NewVehiclePage() {
  await requireUser();
  return (
    <>
      <PageHeader title="Ajouter un véhicule" subtitle="Les champs marqués d'un astérisque sont obligatoires." />
      <VehicleForm cancelHref="/garage" />
    </>
  );
}
