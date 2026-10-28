import { getUserOrNull } from "@/server/session";
import { getStorage } from "@/server/storage";
import { getVehicle } from "@/server/vehicles";

export async function GET(_req: Request, ctx: RouteContext<"/api/vehicules/[id]/photo">) {
  const user = await getUserOrNull();
  if (!user) return new Response("Non authentifié.", { status: 401 });
  const { id } = await ctx.params;
  const vehicle = await getVehicle(user.id, id);
  if (!vehicle?.photoKey || !vehicle.photoMime) return new Response("Introuvable.", { status: 404 });
  const bytes = await getStorage().get(vehicle.photoKey);
  if (!bytes) return new Response("Introuvable.", { status: 404 });
  return new Response(Buffer.from(bytes), {
    headers: {
      "Content-Type": vehicle.photoMime,
      "Cache-Control": "private, max-age=86400",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
