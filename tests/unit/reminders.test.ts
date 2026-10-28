import { describe, expect, it } from "vitest";
import { compareEvaluations, describeRemaining, evaluateReminder } from "@/lib/reminders";

const today = new Date("2026-10-28T09:00:00Z");
const d = (iso: string) => new Date(`${iso}T12:00:00Z`);
const base = { dueDate: null as Date | null, dueMileage: null as number | null, completedAt: null as Date | null };

describe("evaluateReminder", () => {
  it("échéance par date seule : à venir, proche, dépassée", () => {
    expect(evaluateReminder({ ...base, dueDate: d("2027-03-01") }, 10000, today).status).toBe("A_VENIR");
    expect(evaluateReminder({ ...base, dueDate: d("2026-11-20") }, 10000, today).status).toBe("PROCHE");
    expect(evaluateReminder({ ...base, dueDate: d("2026-10-01") }, 10000, today).status).toBe("DEPASSE");
  });

  it("le jour même compte comme dépassé", () => {
    const e = evaluateReminder({ ...base, dueDate: d("2026-10-28") }, 0, today);
    expect(e.status).toBe("DEPASSE");
    expect(e.daysLeft).toBe(0);
  });

  it("échéance par kilométrage seul", () => {
    expect(evaluateReminder({ ...base, dueMileage: 20000 }, 15000, today).status).toBe("A_VENIR");
    expect(evaluateReminder({ ...base, dueMileage: 15800 }, 15000, today).status).toBe("PROCHE");
    expect(evaluateReminder({ ...base, dueMileage: 15000 }, 15000, today).status).toBe("DEPASSE");
    expect(evaluateReminder({ ...base, dueMileage: 14000 }, 15000, today).kmLeft).toBe(-1000);
  });

  it("deux seuils : signalée dès que l'un est atteint", () => {
    // Date lointaine mais kilométrage dépassé.
    const km = evaluateReminder({ ...base, dueDate: d("2028-01-01"), dueMileage: 12000 }, 12450, today);
    expect(km.status).toBe("DEPASSE");
    expect(km.trigger).toBe("km");
    // Kilométrage lointain mais date dépassée.
    const date = evaluateReminder({ ...base, dueDate: d("2026-09-01"), dueMileage: 90000 }, 12450, today);
    expect(date.status).toBe("DEPASSE");
    expect(date.trigger).toBe("date");
    // Un seuil proche suffit pour « prochainement ».
    expect(evaluateReminder({ ...base, dueDate: d("2028-01-01"), dueMileage: 13000 }, 12450, today).status).toBe("PROCHE");
  });

  it("une échéance réalisée reste réalisée même si les seuils sont dépassés", () => {
    expect(evaluateReminder({ dueDate: d("2020-01-01"), dueMileage: 1, completedAt: d("2020-01-02") }, 99999, today).status).toBe("REALISE");
  });

  it("tri par urgence puis proximité", () => {
    const a = evaluateReminder({ ...base, dueDate: d("2027-06-01") }, 0, today);
    const b = evaluateReminder({ ...base, dueDate: d("2026-11-05") }, 0, today);
    const c = evaluateReminder({ ...base, dueMileage: 10 }, 20, today);
    expect([a, b, c].sort(compareEvaluations).map((e) => e.status)).toEqual(["DEPASSE", "PROCHE", "A_VENIR"]);
  });

  it("description lisible en français", () => {
    const e = evaluateReminder({ ...base, dueDate: d("2026-10-01"), dueMileage: 16200 }, 12450, today);
    expect(describeRemaining(e)).toBe("dépassée de 27 j · 3 750 km restants");
  });
});
