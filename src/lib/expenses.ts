import type { ExpenseCategory, InterventionCategory } from "@/generated/prisma/enums";

/** Catégorie de la dépense dérivée d'une intervention. */
export function expenseCategoryFor(category: InterventionCategory): ExpenseCategory {
  switch (category) {
    case "REPARATION":
      return "REPARATION";
    case "PNEUS":
      return "PNEUMATIQUES";
    default:
      return "ENTRETIEN";
  }
}

export interface ExpenseRow {
  date: Date;
  category: ExpenseCategory;
  amountCents: number;
}

export const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  "ENTRETIEN",
  "REPARATION",
  "PIECES",
  "PNEUMATIQUES",
  "CARBURANT",
  "ASSURANCE",
  "AUTRE",
];

export function summarizeExpenses(rows: ExpenseRow[]) {
  const total = rows.reduce((sum, r) => sum + r.amountCents, 0);
  const byCategory = EXPENSE_CATEGORIES.map((category) => {
    const amount = rows.filter((r) => r.category === category).reduce((s, r) => s + r.amountCents, 0);
    return { category, amountCents: amount, share: total === 0 ? 0 : amount / total };
  })
    .filter((c) => c.amountCents > 0)
    .sort((a, b) => b.amountCents - a.amountCents);
  return { totalCents: total, byCategory };
}

/** Totaux mensuels (index 0 = janvier) pour une année donnée, en heure de Paris. */
export function monthlyTotals(rows: ExpenseRow[], year: number) {
  const months = Array.from({ length: 12 }, () => 0);
  for (const r of rows) {
    const [y, m] = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Paris", year: "numeric", month: "2-digit" })
      .format(r.date)
      .split("-")
      .map(Number);
    if (y === year) months[m - 1] += r.amountCents;
  }
  return months;
}

function csvCell(value: string) {
  return /[";\n\r]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

/** Export CSV (séparateur « ; » et virgule décimale, compatibles avec Excel en français). */
export function expensesToCsv(
  rows: { date: Date; vehicle: string; category: string; label: string; amountCents: number; source: string }[],
) {
  const header = ["Date", "Véhicule", "Catégorie", "Libellé", "Montant (EUR)", "Origine"];
  const lines = rows.map((r) =>
    [
      new Intl.DateTimeFormat("fr-FR", { timeZone: "Europe/Paris" }).format(r.date),
      r.vehicle,
      r.category,
      r.label,
      (r.amountCents / 100).toFixed(2).replace(".", ","),
      r.source,
    ]
      .map(csvCell)
      .join(";"),
  );
  // BOM pour qu'Excel détecte l'UTF-8.
  return "﻿" + [header.join(";"), ...lines].join("\r\n");
}
