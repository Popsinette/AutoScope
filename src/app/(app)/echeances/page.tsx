import { deleteReminderAction, saveReminder, toggleReminderAction } from "@/app/actions/reminders";
import { REMINDER_TABS, RemindersView } from "@/components/views/reminders-view";
import { NoVehicle } from "@/components/vehicles/no-vehicle";
import type { ReminderStatus } from "@/lib/reminders";
import { param, type SearchParams } from "@/lib/search-params";
import { emailNotificationsAvailable } from "@/server/notifications";
import { listReminders } from "@/server/reminders";
import { resolveSelectedVehicle } from "@/server/selection";
import { requireUser } from "@/server/session";

export const metadata = { title: "Échéances" };

export default async function RemindersPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const user = await requireUser();
  const sp = await searchParams;
  const { selected: vehicle } = await resolveSelectedVehicle(user.id, param(sp, "v"));
  if (!vehicle) return <NoVehicle what="ses échéances" />;
  const tab = (REMINDER_TABS.find((t) => t.key === param(sp, "statut"))?.key ?? "toutes") as ReminderStatus | "toutes";
  return (
    <RemindersView
      vehicle={vehicle}
      tab={tab}
      reminders={await listReminders(user.id, vehicle.id)}
      emailReady={emailNotificationsAvailable()}
      toggleAction={toggleReminderAction}
      deleteAction={deleteReminderAction}
      saveAction={saveReminder}
    />
  );
}
