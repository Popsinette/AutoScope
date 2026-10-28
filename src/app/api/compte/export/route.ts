import { exportUserData } from "@/server/account";
import { getUserOrNull } from "@/server/session";

export async function GET() {
  const user = await getUserOrNull();
  if (!user) return new Response("Non authentifié.", { status: 401 });
  const data = await exportUserData(user.id);
  return new Response(JSON.stringify(data, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="carview-export-${new Date().toISOString().slice(0, 10)}.json"`,
      "Cache-Control": "private, no-store",
    },
  });
}
