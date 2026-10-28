import { DashboardView } from "@/components/views/dashboard-view";
import { param, type SearchParams } from "@/lib/search-params";
import { prisma } from "@/server/db";
import { listExpenses } from "@/server/expenses";
import { listReminders } from "@/server/reminders";
import { resolveSelectedVehicle } from "@/server/selection";
import { requireUser } from "@/server/session";

export const metadata = { title: "Tableau de bord" };

export default async function DashboardPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const user = await requireUser();
  const sp = await searchParams;
  const { selected: vehicle } = await resolveSelectedVehicle(user.id, param(sp, "v"));
  const year = new Date().getFullYear();
  const [reminders, interventions, expenses, prevYearExpenses] = vehicle
    ? await Promise.all([
        listReminders(user.id, vehicle.id),
        prisma.intervention.findMany({ where: { vehicleId: vehicle.id }, orderBy: [{ date: "desc" }, { mileage: "desc" }], take: 4 }),
        listExpenses(user.id, { vehicleId: vehicle.id, year }),
        listExpenses(user.id, { vehicleId: vehicle.id, year: year - 1 }),
      ])
    : [[], [], [], []];
  return (
    <DashboardView
      firstName={user.name.split(" ")[0]}
      vehicle={vehicle}
      reminders={reminders}
      interventions={interventions}
      expenses={expenses}
      prevYearExpenses={prevYearExpenses}
      year={year}
    />
  );
}
