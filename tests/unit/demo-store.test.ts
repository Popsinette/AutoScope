import { describe, expect, it } from "vitest";
import { MemoryFiles, MemoryPersistence } from "../../demo/src/store/persistence";
import { seedDemo } from "../../demo/src/store/seed";
import { DemoError, DemoStore } from "../../demo/src/store/store";
import { DEMO_MODEL_ID } from "@/lib/demo-model";
import type { InterventionInput, VehicleInput } from "@/lib/validation";
import { makeTestGlb } from "../helpers/glb";

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
  registration: null,
  vin: null,
  notes: null,
};

const intervention = (over: Partial<InterventionInput> = {}): InterventionInput => ({
  date: new Date("2026-03-12T12:00:00Z"),
  mileage: 46000,
  category: "REVISION",
  description: "Révision",
  garage: null,
  partsCost: 18000,
  laborCost: 17000,
  nextDueDate: null,
  nextDueMileage: null,
  notes: null,
  replacedParts: [],
  componentIds: [],
  ...over,
});

const pdf = { bytes: new TextEncoder().encode("%PDF-1.4\n%%EOF"), type: "application/pdf", fileName: "f.pdf", size: 14 };

async function emptyStore() {
  const records = new MemoryPersistence();
  const files = new MemoryFiles();
  const store = new DemoStore(records, files);
  await store.init(async () => {});
  return { store, records, files };
}

describe("démo hors ligne : stockage local", () => {
  it("installe le jeu de démonstration fictif à la première visite", async () => {
    const store = new DemoStore(new MemoryPersistence(), new MemoryFiles());
    await store.init(seedDemo);
    expect(store.data.vehicles.map((v) => `${v.make} ${v.model}`)).toEqual(["Porsche 911 GT3", "BMW M3", "Audi RS4 Avant", "CarView Berline générique"]);
    expect(store.data.vehicles.every((v) => v.isDemo)).toBe(true);
    expect(store.data.vehicles.find((v) => v.make === "CarView")?.model3dId).toBe(DEMO_MODEL_ID);
    // Une dépense par intervention chiffrée, aucune en double.
    const linked = store.data.expenses.filter((e) => e.interventionId);
    expect(new Set(linked.map((e) => e.interventionId)).size).toBe(linked.length);
    expect(linked).toHaveLength(store.data.interventions.filter((i) => i.partsCostCents + i.laborCostCents > 0).length);
    // Kilométrage de référence conservé, factures fictives présentes.
    expect(store.data.vehicles[0].mileage).toBe(12450);
    expect(store.data.documents.filter((d) => d.title.includes("(démo)")).length).toBeGreaterThan(0);
  });

  it("une intervention produit une seule dépense, recalculée puis supprimée avec elle", async () => {
    const { store } = await emptyStore();
    const v = await store.createVehicle(vehicleInput);
    const i = await store.createIntervention(v.id, intervention(), [pdf]);
    expect(store.listExpenses({ vehicleId: v.id })).toMatchObject([{ amountCents: 35000, category: "ENTRETIEN", interventionId: i.id }]);
    expect(store.vehicle(v.id)?.mileage).toBe(46000);
    await store.updateIntervention(i.id, intervention({ partsCost: 20000, laborCost: 10000, category: "PNEUS" }));
    expect(store.listExpenses({ vehicleId: v.id })).toMatchObject([{ amountCents: 30000, category: "PNEUMATIQUES" }]);
    expect(() => store.updateExpense(store.listExpenses()[0].id, { date: new Date(), category: "AUTRE", amount: 1, label: "x", notes: null })).toThrow(DemoError);
    store.deleteIntervention(i.id);
    expect(store.listExpenses({ vehicleId: v.id })).toEqual([]);
    // Le justificatif reste rattaché au véhicule.
    expect(store.listDocuments({ vehicleId: v.id })).toMatchObject([{ fileName: "f.pdf", interventionId: null }]);
  });

  it("échéance de suivi et réalisation d'une échéance", async () => {
    const { store } = await emptyStore();
    const v = await store.createVehicle(vehicleInput);
    const r = store.createReminder(v.id, { title: "Vidange", category: "VIDANGE", dueDate: null, dueMileage: 45800, origin: "UTILISATEUR", sourceReference: null, notes: null });
    expect(store.listReminders(v.id)[0].evaluation.status).toBe("PROCHE");
    const i = await store.createIntervention(v.id, intervention({ nextDueMileage: 56000 }), [], r.id);
    const reminders = store.listReminders(v.id);
    expect(reminders.find((x) => x.id === r.id)).toMatchObject({ completedById: i.id, evaluation: { status: "REALISE" } });
    expect(reminders.find((x) => x.sourceInterventionId === i.id)).toMatchObject({ dueMileage: 56000 });
    expect(store.alertCount()).toBe(0);
  });

  it("persiste et relit les données (dates comprises) et supprime en cascade", async () => {
    const { store, records, files } = await emptyStore();
    const v = await store.createVehicle(vehicleInput, { ...pdf, type: "image/png" });
    await store.createIntervention(v.id, intervention(), [pdf]);
    const reloaded = new DemoStore(records, files);
    await reloaded.init(async () => {
      throw new Error("ne doit pas réinstaller la démo");
    });
    expect(reloaded.data.interventions[0].date).toBeInstanceOf(Date);
    expect(reloaded.fileUrl(reloaded.data.vehicles[0].photoKey)).toMatch(/^blob:/);
    await reloaded.deleteVehicle(v.id);
    expect(reloaded.data).toMatchObject({ vehicles: [], interventions: [], expenses: [], documents: [] });
    expect(files.files.size).toBe(0);
  });

  it("import GLB : correspondances limitées aux objets du fichier et aux fiches connues", async () => {
    const { store, files } = await emptyStore();
    const v = await store.createVehicle(vehicleInput);
    const glb = makeTestGlb([{ name: "Engine_Block", translation: [0, 0, 0] }]);
    const id = await store.importModel(v.id, { name: "Test", source: "tests", license: "test", isIllustrative: true, nodeNames: ["Engine_Block"], bytes: glb });
    expect(store.saveMappings(id, [{ nodeName: "Engine_Block", slug: "bloc-moteur" }, { nodeName: "Inconnu", slug: "bloc-moteur" }, { nodeName: "Engine_Block", slug: "inexistant" }])).toBe(1);
    await store.detachModel(v.id);
    expect(store.data.models).toEqual([]);
    expect(files.files.size).toBe(0);
  });
});
