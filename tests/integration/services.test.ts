import { randomUUID } from "node:crypto";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/server/db";
import { ForbiddenActionError, NotFoundError } from "@/server/errors";
import { createIntervention, deleteIntervention, getIntervention, listInterventions, updateIntervention } from "@/server/interventions";
import { createExpense, deleteExpense, listExpenses, updateExpense } from "@/server/expenses";
import { createReminder, listReminders, setReminderCompleted, updateReminder } from "@/server/reminders";
import { createDocument, getDocument, listDocuments } from "@/server/documents";
import { createVehicle, deleteVehicle, getVehicle, listVehicles, updateVehicle } from "@/server/vehicles";
import { exportUserData } from "@/server/account";
import { getStorage } from "@/server/storage";
import type { InterventionInput, VehicleInput } from "@/lib/validation";

const created: string[] = [];

async function makeUser(name: string) {
  const id = randomUUID();
  await prisma.user.create({ data: { id, name, email: `${id}@test.local` } });
  created.push(id);
  return id;
}

const vehicleInput: VehicleInput = {
  make: "Peugeot",
  model: "308",
  trim: null,
  year: 2019,
  engine: null,
  energy: "DIESEL",
  transmission: "MANUELLE",
  mileage: 45000,
  acquiredAt: null,
  registration: "AB-123-CD",
  vin: null,
  notes: null,
};

const intervention = (over: Partial<InterventionInput> = {}): InterventionInput => ({
  date: new Date("2026-03-12T12:00:00Z"),
  mileage: 46000,
  category: "REVISION",
  description: "Révision annuelle",
  garage: "Garage test",
  partsCost: 18000,
  laborCost: 17000,
  nextDueDate: null,
  nextDueMileage: null,
  notes: null,
  replacedParts: [{ name: "Filtre à huile", reference: null, quantity: 1 }],
  componentIds: [],
  ...over,
});

let alice: string;
let bob: string;

beforeEach(async () => {
  alice = await makeUser("Alice");
  bob = await makeUser("Bob");
});

afterAll(async () => {
  for (const id of created) await getStorage().deletePrefix(id);
  await prisma.user.deleteMany({ where: { id: { in: created } } });
  await prisma.component.deleteMany({ where: { slug: { startsWith: "test-" } } });
  await prisma.$disconnect();
});

describe("garage", () => {
  it("crée, retrouve, modifie et supprime un véhicule", async () => {
    const v = await createVehicle(alice, vehicleInput);
    expect((await listVehicles(alice)).map((x) => x.id)).toEqual([v.id]);
    await updateVehicle(alice, v.id, { ...vehicleInput, mileage: 47000 });
    expect((await getVehicle(alice, v.id))?.mileage).toBe(47000);
    await deleteVehicle(alice, v.id);
    expect(await getVehicle(alice, v.id)).toBeNull();
  });
});

describe("dépenses liées aux interventions (pas de double comptage)", () => {
  it("une intervention crée une seule dépense, recalculée à chaque modification", async () => {
    const v = await createVehicle(alice, vehicleInput);
    const i = await createIntervention(alice, v.id, intervention());
    let expenses = await listExpenses(alice, { vehicleId: v.id });
    expect(expenses).toHaveLength(1);
    expect(expenses[0]).toMatchObject({ amountCents: 35000, category: "ENTRETIEN", interventionId: i.id });

    await updateIntervention(alice, i.id, intervention({ partsCost: 20000, laborCost: 10000, category: "REPARATION" }));
    expenses = await listExpenses(alice, { vehicleId: v.id });
    expect(expenses).toHaveLength(1);
    expect(expenses[0]).toMatchObject({ amountCents: 30000, category: "REPARATION" });

    // Une dépense manuelle s'ajoute sans interférer.
    await createExpense(alice, v.id, { date: new Date("2026-03-20T12:00:00Z"), category: "CARBURANT", amount: 8000, label: "Plein", notes: null });
    const total = (await listExpenses(alice, { vehicleId: v.id })).reduce((s, e) => s + e.amountCents, 0);
    expect(total).toBe(38000);

    // Coût ramené à zéro : la dépense liée disparaît.
    await updateIntervention(alice, i.id, intervention({ partsCost: 0, laborCost: 0 }));
    expect((await listExpenses(alice, { vehicleId: v.id })).filter((e) => e.interventionId)).toHaveLength(0);

    // Suppression de l'intervention : sa dépense est supprimée avec elle.
    await updateIntervention(alice, i.id, intervention());
    await deleteIntervention(alice, i.id);
    expect((await listExpenses(alice, { vehicleId: v.id })).map((e) => e.category)).toEqual(["CARBURANT"]);
  });

  it("une dépense issue d'une intervention ne se modifie pas directement", async () => {
    const v = await createVehicle(alice, vehicleInput);
    await createIntervention(alice, v.id, intervention());
    const [linked] = await listExpenses(alice, { vehicleId: v.id });
    await expect(updateExpense(alice, linked.id, { date: new Date(), category: "AUTRE", amount: 1, label: "x", notes: null })).rejects.toBeInstanceOf(ForbiddenActionError);
    await expect(deleteExpense(alice, linked.id)).rejects.toBeInstanceOf(ForbiddenActionError);
  });

  it("filtre par année", async () => {
    const v = await createVehicle(alice, vehicleInput);
    await createIntervention(alice, v.id, intervention({ date: new Date("2025-12-31T12:00:00Z") }));
    await createIntervention(alice, v.id, intervention({ date: new Date("2026-01-01T12:00:00Z") }));
    expect(await listExpenses(alice, { vehicleId: v.id, year: 2026 })).toHaveLength(1);
    expect(await listExpenses(alice, { vehicleId: v.id, year: 2025 })).toHaveLength(1);
  });
});

describe("interventions", () => {
  it("met à jour le kilométrage, crée l'échéance de suivi et relie les composants", async () => {
    const component = await prisma.component.create({
      data: { slug: `test-${randomUUID()}`, name: "Test", family: "FREINAGE", system: "MECANIQUE", function: "f", description: "d", source: "test", reliability: "GENERIQUE" },
    });
    const v = await createVehicle(alice, vehicleInput);
    const i = await createIntervention(alice, v.id, intervention({ mileage: 50000, nextDueMileage: 60000, componentIds: [component.id, "inexistant"] }));
    expect((await getVehicle(alice, v.id))?.mileage).toBe(50000);
    const detail = await getIntervention(alice, i.id);
    expect(detail?.components.map((c) => c.componentId)).toEqual([component.id]);
    expect(detail?.followUpReminder).toMatchObject({ dueMileage: 60000 });

    await updateIntervention(alice, i.id, intervention({ mileage: 50000 }));
    expect((await getIntervention(alice, i.id))?.followUpReminder).toBeNull();
  });

  it("réalise une échéance existante", async () => {
    const v = await createVehicle(alice, vehicleInput);
    const r = await createReminder(alice, v.id, { title: "Vidange", category: "VIDANGE", dueDate: null, dueMileage: 45800, origin: "UTILISATEUR", sourceReference: null, notes: null });
    expect((await listReminders(alice, v.id))[0].evaluation.status).toBe("PROCHE");
    const i = await createIntervention(alice, v.id, intervention({ category: "VIDANGE" }), [], { completesReminderId: r.id });
    const [after] = await listReminders(alice, v.id);
    expect(after.evaluation.status).toBe("REALISE");
    expect(after.completedById).toBe(i.id);
    // Rouverte : le compteur (46 000 km après l'intervention) a dépassé le seuil.
    await setReminderCompleted(alice, r.id, false);
    expect((await listReminders(alice, v.id))[0].evaluation.status).toBe("DEPASSE");
  });
});

describe("isolation entre utilisateurs", () => {
  it("un utilisateur ne peut ni lire ni modifier les données d'un autre", async () => {
    const v = await createVehicle(alice, vehicleInput);
    const i = await createIntervention(alice, v.id, intervention());
    const r = await createReminder(alice, v.id, { title: "CT", category: "CONTROLE_TECHNIQUE", dueDate: new Date("2027-01-01T12:00:00Z"), dueMileage: null, origin: "UTILISATEUR", sourceReference: null, notes: null });
    const doc = await createDocument(alice, {
      vehicleId: v.id,
      interventionId: i.id,
      title: "Facture",
      category: "FACTURE",
      file: { bytes: new TextEncoder().encode("%PDF-1.4\n%%EOF"), type: "application/pdf", fileName: "f.pdf", size: 14 },
    });

    expect(await getVehicle(bob, v.id)).toBeNull();
    expect(await listVehicles(bob)).toEqual([]);
    expect(await getIntervention(bob, i.id)).toBeNull();
    expect(await listInterventions(bob, v.id)).toEqual([]);
    expect(await listExpenses(bob, { vehicleId: v.id })).toEqual([]);
    expect(await listReminders(bob, v.id)).toEqual([]);
    expect(await getDocument(bob, doc.id)).toBeNull();
    expect(await listDocuments(bob, { vehicleId: v.id })).toEqual([]);

    await expect(updateVehicle(bob, v.id, vehicleInput)).rejects.toBeInstanceOf(NotFoundError);
    await expect(deleteVehicle(bob, v.id)).rejects.toBeInstanceOf(NotFoundError);
    await expect(updateIntervention(bob, i.id, intervention())).rejects.toBeInstanceOf(NotFoundError);
    await expect(deleteIntervention(bob, i.id)).rejects.toBeInstanceOf(NotFoundError);
    await expect(createIntervention(bob, v.id, intervention())).rejects.toBeInstanceOf(NotFoundError);
    await expect(createExpense(bob, v.id, { date: new Date(), category: "AUTRE", amount: 100, label: "x", notes: null })).rejects.toBeInstanceOf(NotFoundError);
    await expect(updateReminder(bob, r.id, { title: "x", category: "AUTRE", dueDate: null, dueMileage: 1, origin: "UTILISATEUR", sourceReference: null, notes: null })).rejects.toBeInstanceOf(NotFoundError);
    await expect(
      createDocument(bob, { vehicleId: v.id, interventionId: null, title: "x", category: "AUTRE", file: { bytes: new Uint8Array([1]), type: "application/pdf", fileName: "x", size: 1 } }),
    ).rejects.toBeInstanceOf(NotFoundError);

    // L'export de Bob ne contient rien d'Alice.
    const exported = await exportUserData(bob);
    expect(exported.vehicles).toEqual([]);
    expect(JSON.stringify(exported)).not.toContain("AB-123-CD");
  });

  it("un document ne peut pas être rattaché à l'intervention d'un autre véhicule", async () => {
    const v1 = await createVehicle(alice, vehicleInput);
    const v2 = await createVehicle(alice, vehicleInput);
    const i = await createIntervention(alice, v1.id, intervention());
    await expect(
      createDocument(alice, { vehicleId: v2.id, interventionId: i.id, title: "x", category: "AUTRE", file: { bytes: new Uint8Array([1]), type: "application/pdf", fileName: "x", size: 1 } }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});
