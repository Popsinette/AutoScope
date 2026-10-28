import { getComponentSheet } from "@/server/components";
import { getUserOrNull } from "@/server/session";
import { getVehicle } from "@/server/vehicles";

/** Fiche composant + interventions et documents de l'utilisateur liés à ce composant. */
export async function GET(req: Request, ctx: RouteContext<"/api/composants/[slug]">) {
  const user = await getUserOrNull();
  if (!user) return Response.json({ error: "Non authentifié." }, { status: 401 });
  const { slug } = await ctx.params;
  const v = new URL(req.url).searchParams.get("v");
  const vehicle = v ? await getVehicle(user.id, v) : null;
  const sheet = await getComponentSheet(user.id, slug, vehicle?.id ?? null);
  if (!sheet) return Response.json({ error: "Composant introuvable." }, { status: 404 });
  return Response.json(sheet, { headers: { "Cache-Control": "private, no-store" } });
}
