"use server";

import { cookies } from "next/headers";
import { requireUser } from "@/server/session";
import { SELECTED_VEHICLE_COOKIE } from "@/server/selection";
import { getVehicle } from "@/server/vehicles";

export async function selectVehicle(vehicleId: string) {
  const user = await requireUser();
  const vehicle = await getVehicle(user.id, vehicleId);
  if (!vehicle) return { error: "Véhicule introuvable." };
  (await cookies()).set(SELECTED_VEHICLE_COOKIE, vehicle.id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  return { ok: true };
}
