import { getUserOrNull } from "@/server/session";
import { getStorage } from "@/server/storage";
import { getAccessibleModel } from "@/server/models3d";

export async function GET(_req: Request, ctx: RouteContext<"/api/modeles/[id]">) {
  const user = await getUserOrNull();
  if (!user) return new Response("Non authentifié.", { status: 401 });
  const { id } = await ctx.params;
  const model = await getAccessibleModel(user.id, id);
  if (!model?.storageKey) return new Response("Modèle introuvable.", { status: 404 });
  const bytes = await getStorage().get(model.storageKey);
  if (!bytes) return new Response("Fichier manquant.", { status: 404 });
  return new Response(Buffer.from(bytes), {
    headers: {
      "Content-Type": "model/gltf-binary",
      "Cache-Control": "private, max-age=3600",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
