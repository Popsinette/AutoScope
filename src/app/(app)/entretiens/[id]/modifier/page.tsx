import { notFound } from "next/navigation";
import { InterventionForm } from "@/components/interventions/intervention-form";
import { PageHeader } from "@/components/ui/page-header";
import { listComponents } from "@/server/components";
import { getIntervention } from "@/server/interventions";
import { requireUser } from "@/server/session";
import { vehicleLabel } from "@/server/vehicles";

export const metadata = { title: "Modifier l’intervention" };

export default async function EditInterventionPage({ params }: PageProps<"/entretiens/[id]/modifier">) {
  const user = await requireUser();
  const { id } = await params;
  const intervention = await getIntervention(user.id, id);
  if (!intervention) notFound();
  const components = await listComponents();
  return (
    <>
      <PageHeader title="Modifier l’intervention" subtitle={vehicleLabel(intervention.vehicle)} />
      <InterventionForm
        vehicleId={intervention.vehicleId}
        components={components}
        cancelHref={`/entretiens/${intervention.id}`}
        initial={{ ...intervention, componentIds: intervention.components.map((c) => c.componentId) }}
      />
    </>
  );
}
