import { notFound } from "next/navigation";
import { deleteVehicleAction } from "@/app/actions/vehicles";
import { VehicleDetailView } from "@/components/views/vehicle-detail-view";
import { prisma } from "@/server/db";
import { listReminders } from "@/server/reminders";
import { requireUser } from "@/server/session";
import { getVehicle } from "@/server/vehicles";

export const metadata = { title: "Fiche véhicule" };

export default async function VehiclePage({ params }: PageProps<"/garage/[id]">) {
  const user = await requireUser();
  const { id } = await params;
  const vehicle = await getVehicle(user.id, id);
  if (!vehicle) notFound();
  const [interventions, expenseAgg, documentCount, reminders] = await Promise.all([
    prisma.intervention.findMany({ where: { vehicleId: vehicle.id }, orderBy: { date: "desc" }, take: 4 }),
    prisma.expense.aggregate({ where: { vehicleId: vehicle.id }, _sum: { amountCents: true }, _count: true }),
    prisma.document.count({ where: { vehicleId: vehicle.id } }),
    listReminders(user.id, vehicle.id),
  ]);
  return (
    <VehicleDetailView
      vehicle={vehicle}
      interventions={interventions}
      openReminders={reminders.filter((r) => r.evaluation.status !== "REALISE").slice(0, 3)}
      expenseCount={expenseAgg._count}
      expenseTotalCents={expenseAgg._sum.amountCents ?? 0}
      documentCount={documentCount}
      deleteAction={deleteVehicleAction}
    />
  );
}
