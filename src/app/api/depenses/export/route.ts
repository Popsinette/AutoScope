import type { ExpenseCategory } from "@/generated/prisma/enums";
import { EXPENSE_LABELS } from "@/lib/labels";
import { expensesToCsv } from "@/lib/expenses";
import { isEnumValue } from "@/lib/search-params";
import { listExpenses } from "@/server/expenses";
import { getUserOrNull } from "@/server/session";
import { getVehicle, vehicleLabel } from "@/server/vehicles";

export async function GET(req: Request) {
  const user = await getUserOrNull();
  if (!user) return new Response("Non authentifié.", { status: 401 });
  const sp = new URL(req.url).searchParams;
  const v = sp.get("v");
  const vehicle = v && v !== "tous" ? await getVehicle(user.id, v) : null;
  if (v && v !== "tous" && !vehicle) return new Response("Véhicule introuvable.", { status: 404 });
  const year = Number(sp.get("annee")) || null;
  const rawCategory = sp.get("categorie") ?? undefined;
  const category: ExpenseCategory | null = isEnumValue(EXPENSE_LABELS, rawCategory) ? rawCategory : null;
  const rows = await listExpenses(user.id, { vehicleId: vehicle?.id ?? null, year, category });
  const csv = expensesToCsv(
    rows.map((r) => ({
      date: r.date,
      vehicle: vehicleLabel(r.vehicle),
      category: EXPENSE_LABELS[r.category],
      label: r.label,
      amountCents: r.amountCents,
      source: r.interventionId ? "Intervention" : "Saisie manuelle",
    })),
  );
  const name = `carview-depenses${year ? `-${year}` : ""}.csv`;
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${name}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
