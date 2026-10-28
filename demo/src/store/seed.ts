import { DEMO_GARAGE, invoiceLines } from "../../../prisma/demo-data/garage";
import { makeDemoPdf } from "../../../prisma/demo-data/pdf";
import { DEMO_MODEL_ID } from "@/lib/demo-model";
import type { DemoStore } from "./store";

const d = (iso: string) => new Date(`${iso}T12:00:00Z`);

/** Installe le garage de démonstration fictif (identique à celui du seed serveur). */
export async function seedDemo(store: DemoStore) {
  for (const demo of DEMO_GARAGE) {
    const { acquiredAt, registration, ...fields } = demo.vehicle;
    const vehicle = await store.createVehicle(
      { ...fields, acquiredAt: acquiredAt ? d(acquiredAt) : null, registration: registration ?? null, vin: null },
      undefined,
      { isDemo: true, model3dId: demo.demoModel ? DEMO_MODEL_ID : null },
    );
    for (const it of demo.interventions) {
      const pdf = it.invoice ? makeDemoPdf(invoiceLines(demo.label, it)) : null;
      const created = await store.createIntervention(
        vehicle.id,
        {
          date: d(it.date),
          mileage: it.mileage,
          category: it.category,
          description: it.description,
          garage: it.garage,
          partsCost: it.parts * 100,
          laborCost: it.labor * 100,
          nextDueDate: it.nextDueDate ? d(it.nextDueDate) : null,
          nextDueMileage: it.nextDueMileage ?? null,
          notes: "Donnée de démonstration (fictive).",
          replacedParts: (it.replaced ?? []).map((p) => ({ name: p.name, reference: p.reference ?? null, quantity: p.quantity ?? 1 })),
          componentIds: it.components ?? [],
        },
        pdf ? [{ bytes: pdf, type: "application/pdf", fileName: `facture-demo-${it.date}.pdf`, size: pdf.byteLength }] : [],
      );
      // Libellé explicite pour les factures fictives.
      store.data.documents.filter((doc) => doc.interventionId === created.id).forEach((doc) => (doc.title = `Facture ${it.description.toLowerCase()} (démo)`));
    }
    // L'historique ne doit pas modifier le kilométrage de référence du véhicule.
    vehicle.mileage = demo.vehicle.mileage;
    for (const r of demo.reminders) {
      store.createReminder(vehicle.id, {
        title: r.title,
        category: r.category,
        dueDate: r.dueDate ? d(r.dueDate) : null,
        dueMileage: r.dueMileage ?? null,
        origin: "UTILISATEUR",
        sourceReference: null,
        notes: r.notes,
      });
    }
    for (const e of demo.expenses) {
      store.createExpense(vehicle.id, { date: d(e.date), category: e.category, amount: Math.round(e.amount * 100), label: e.label, notes: null });
    }
  }
  store.commit();
}
