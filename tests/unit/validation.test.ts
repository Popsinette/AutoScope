import { describe, expect, it } from "vitest";
import { interventionSchema, reminderSchema, vehicleSchema } from "@/lib/validation";

describe("validation des saisies", () => {
  it("véhicule : champs obligatoires et VIN", () => {
    const ok = vehicleSchema.safeParse({ make: "Peugeot", model: "308", year: "2019", energy: "DIESEL", transmission: "MANUELLE", mileage: "45000", vin: "vf3abcdefgh123456" });
    expect(ok.success).toBe(true);
    expect(ok.data?.vin).toBe("VF3ABCDEFGH123456");
    expect(vehicleSchema.safeParse({ make: "", model: "308", year: "2019", energy: "DIESEL", transmission: "MANUELLE", mileage: "1" }).success).toBe(false);
    expect(vehicleSchema.safeParse({ make: "A", model: "B", year: "2019", energy: "DIESEL", transmission: "MANUELLE", mileage: "1", vin: "IOQ" }).success).toBe(false);
  });

  it("intervention : montants et prochaine échéance cohérente", () => {
    const parsed = interventionSchema.safeParse({ date: "2026-03-12", mileage: "12000", category: "REVISION", description: "Révision", partsCost: "180,50", laborCost: "170" });
    expect(parsed.success).toBe(true);
    expect(parsed.data).toMatchObject({ partsCost: 18050, laborCost: 17000, nextDueDate: null, nextDueMileage: null });
    const bad = interventionSchema.safeParse({ date: "2026-03-12", mileage: "12000", category: "REVISION", description: "R", nextDueMileage: "11000" });
    expect(bad.success).toBe(false);
  });

  it("échéance : au moins un seuil, source obligatoire pour une préconisation constructeur", () => {
    expect(reminderSchema.safeParse({ title: "Vidange", category: "VIDANGE" }).success).toBe(false);
    expect(reminderSchema.safeParse({ title: "Vidange", category: "VIDANGE", dueMileage: "20000" }).success).toBe(true);
    expect(reminderSchema.safeParse({ title: "Vidange", category: "VIDANGE", dueMileage: "20000", origin: "CONSTRUCTEUR_DOCUMENTE" }).success).toBe(false);
    expect(
      reminderSchema.safeParse({ title: "Vidange", category: "VIDANGE", dueMileage: "20000", origin: "CONSTRUCTEUR_DOCUMENTE", sourceReference: "Carnet p. 12" }).success,
    ).toBe(true);
  });
});
