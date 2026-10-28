import { notFound } from "next/navigation";
import { ReminderForm } from "@/components/reminders/reminder-form";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { getReminder } from "@/server/reminders";
import { requireUser } from "@/server/session";
import { vehicleLabel } from "@/server/vehicles";

export const metadata = { title: "Modifier l’échéance" };

export default async function EditReminderPage({ params }: PageProps<"/echeances/[id]/modifier">) {
  const user = await requireUser();
  const { id } = await params;
  const reminder = await getReminder(user.id, id);
  if (!reminder) notFound();
  return (
    <>
      <PageHeader title="Modifier l’échéance" subtitle={vehicleLabel(reminder.vehicle)} />
      <Card className="pt-5">
        <ReminderForm vehicleId={reminder.vehicleId} currentMileage={reminder.vehicle.mileage} initial={reminder} cancelHref={`/echeances?v=${reminder.vehicleId}`} />
      </Card>
    </>
  );
}
