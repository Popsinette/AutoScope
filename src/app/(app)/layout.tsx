import { selectVehicle } from "@/app/actions/selection";
import { SignOutButton } from "@/components/shell/user-menu";
import { AppShell } from "@/components/views/app-shell";
import { VehiclePhoto } from "@/components/vehicles/vehicle-photo";
import { listReminders } from "@/server/reminders";
import { resolveSelectedVehicle } from "@/server/selection";
import { requireUser } from "@/server/session";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const [{ vehicles, selected }, reminders] = await Promise.all([resolveSelectedVehicle(user.id), listReminders(user.id)]);
  const alertCount = reminders.filter((r) => r.evaluation.status === "DEPASSE" || r.evaluation.status === "PROCHE").length;
  return (
    <AppShell
      userName={user.name}
      userTitle={user.email}
      vehicles={vehicles}
      selected={selected}
      alertCount={alertCount}
      select={selectVehicle}
      account={<SignOutButton compact />}
      photo={selected ? <VehiclePhoto vehicle={selected} /> : null}
    >
      {children}
    </AppShell>
  );
}
