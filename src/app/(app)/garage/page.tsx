import { GarageView } from "@/components/views/garage-view";
import { requireUser } from "@/server/session";
import { listVehicles } from "@/server/vehicles";

export const metadata = { title: "Mon garage" };

export default async function GaragePage() {
  const user = await requireUser();
  return <GarageView vehicles={await listVehicles(user.id)} />;
}
