import { describe, expect, it } from "vitest";
import { expenseCategoryFor, expensesToCsv, monthlyTotals, summarizeExpenses } from "@/lib/expenses";
import { parseEurosToCents } from "@/lib/format";

describe("dépenses", () => {
  it("catégorie dérivée d'une intervention", () => {
    expect(expenseCategoryFor("VIDANGE")).toBe("ENTRETIEN");
    expect(expenseCategoryFor("PNEUS")).toBe("PNEUMATIQUES");
    expect(expenseCategoryFor("REPARATION")).toBe("REPARATION");
  });

  it("totaux et répartition", () => {
    const rows = [
      { date: new Date("2026-01-05T12:00:00Z"), category: "ASSURANCE" as const, amountCents: 60000 },
      { date: new Date("2026-02-05T12:00:00Z"), category: "CARBURANT" as const, amountCents: 20000 },
      { date: new Date("2026-02-20T12:00:00Z"), category: "CARBURANT" as const, amountCents: 20000 },
    ];
    const s = summarizeExpenses(rows);
    expect(s.totalCents).toBe(100000);
    expect(s.byCategory).toEqual([
      { category: "ASSURANCE", amountCents: 60000, share: 0.6 },
      { category: "CARBURANT", amountCents: 40000, share: 0.4 },
    ]);
    expect(monthlyTotals(rows, 2026).slice(0, 3)).toEqual([60000, 40000, 0]);
    expect(monthlyTotals(rows, 2025).every((m) => m === 0)).toBe(true);
  });

  it("export CSV compatible Excel français", () => {
    const csv = expensesToCsv([
      { date: new Date("2026-03-12T12:00:00Z"), vehicle: "Peugeot 308", category: "Entretien", label: 'Révision "annuelle"; filtre', amountCents: 35050, source: "Intervention" },
    ]);
    expect(csv.startsWith("﻿Date;Véhicule;")).toBe(true);
    expect(csv).toContain('12/03/2026;Peugeot 308;Entretien;"Révision ""annuelle""; filtre";350,50;Intervention');
  });

  it("saisie des montants en euros", () => {
    expect(parseEurosToCents("1 234,50")).toBe(123450);
    expect(parseEurosToCents("12.5")).toBe(1250);
    expect(parseEurosToCents("")).toBe(0);
    expect(parseEurosToCents("12,345")).toBeNull();
    expect(parseEurosToCents("-4")).toBeNull();
  });
});
