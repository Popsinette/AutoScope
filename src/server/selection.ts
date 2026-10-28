import "server-only";
import { cookies } from "next/headers";
import { listVehicles } from "./vehicles";

export const SELECTED_VEHICLE_COOKIE = "cv_vehicle";

/**
 * Véhicule courant : paramètre explicite, sinon cookie, sinon premier véhicule.
 * Toujours résolu parmi les véhicules de l'utilisateur (un identifiant étranger est ignoré).
 */
export async function resolveSelectedVehicle(userId: string, requestedId?: string | null) {
  const vehicles = await listVehicles(userId);
  const cookieId = (await cookies()).get(SELECTED_VEHICLE_COOKIE)?.value;
  const selected =
    vehicles.find((v) => v.id === requestedId) ?? vehicles.find((v) => v.id === cookieId) ?? vehicles[0] ?? null;
  return { vehicles, selected };
}
