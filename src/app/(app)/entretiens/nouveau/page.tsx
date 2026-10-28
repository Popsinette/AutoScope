import { saveIntervention } from "@/app/actions/interventions";
import { InterventionForm } from "@/components/interventions/intervention-form";
import { PageHeader } from "@/components/ui/page-header";
import { NoVehicle } from "@/components/vehicles/no-vehicle";
import { param, type SearchParams } from "@/lib/search-params";
import { listComponents } from "@/server/components";
import { getReminder } from "@/server/reminders";
import { resolveSelectedVehicle } from "@/server/selection";
import { requireUser } from "@/server/session";
import { vehicleLabel } from "@/server/vehicles";

export const metadata = { title: "Nouvel entretien" };

export default async function NewInterventionPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const user = await requireUser();
  const sp = await searchParams;
  const reminderId = param(sp, "echeance");
  const reminder = reminderId ? await getReminder(user.id, reminderId) : null;
  const { selected: vehicle } = await resolveSelectedVehicle(user.id, reminder?.vehicleId ?? param(sp, "v"));
  if (!vehicle) return <NoVehicle what="son carnet d’entretien" />;
  const components = await listComponents();
  const composant = param(sp, "composant");
  const preselected = components.filter((c) => c.slug === composant).map((c) => c.id);

  return (
    <>
      <PageHeader
        title="Nouvel entretien"
        subtitle={reminder ? `${vehicleLabel(vehicle)} — réalisation de l’échéance « ${reminder.title} »` : vehicleLabel(vehicle)}
      />
      <InterventionForm
        vehicleId={vehicle.id}
        components={components}
        cancelHref={`/entretiens?v=${vehicle.id}`}
        action={saveIntervention}
        completesReminderId={reminder && !reminder.completedAt ? reminder.id : undefined}
        initial={{ mileage: vehicle.mileage, category: reminder?.category, description: reminder?.title, componentIds: preselected }}
      />
    </>
  );
}
