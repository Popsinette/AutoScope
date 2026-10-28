import { safeFileName } from "@/lib/files";
import { getDocument } from "@/server/documents";
import { getUserOrNull } from "@/server/session";
import { getStorage } from "@/server/storage";

/** Téléchargement d'un document privé : vérification du propriétaire à chaque requête. */
export async function GET(req: Request, ctx: RouteContext<"/api/documents/[id]">) {
  const user = await getUserOrNull();
  if (!user) return new Response("Non authentifié.", { status: 401 });
  const { id } = await ctx.params;
  const doc = await getDocument(user.id, id);
  if (!doc) return new Response("Document introuvable.", { status: 404 });
  const bytes = await getStorage().get(doc.storageKey);
  if (!bytes) return new Response("Fichier manquant.", { status: 404 });
  const inline = new URL(req.url).searchParams.get("apercu") === "1" && doc.mimeType.startsWith("image/");
  const name = safeFileName(doc.fileName);
  return new Response(Buffer.from(bytes), {
    headers: {
      "Content-Type": doc.mimeType,
      "Content-Length": String(bytes.byteLength),
      "Content-Disposition": `${inline ? "inline" : "attachment"}; filename="${name}"; filename*=UTF-8''${encodeURIComponent(doc.fileName)}`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'; img-src 'self'; style-src 'unsafe-inline'; sandbox",
    },
  });
}
