/**
 * Jeu de démonstration CarView — EXPLICITEMENT FICTIF.
 *
 * - Fiches de composants pédagogiques (génériques) et modèle 3D procédural.
 * - Catalogue de pièces génériques (aucune compatibilité inventée).
 * - Compte de démonstration demo@example.com avec véhicules, entretiens,
 *   dépenses, échéances et factures fictives, tous marqués « démonstration ».
 *
 * Idempotent : relancer le seed réinitialise uniquement le compte de démonstration.
 */
import "dotenv/config";
import { randomUUID } from "node:crypto";
import { hashPassword } from "better-auth/crypto";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import type { InterventionCategory } from "../src/generated/prisma/enums";
import { LocalFileStorage } from "../src/server/storage/local";
import { DEMO_MODEL_ID, DEMO_NODE_MAPPING } from "../src/lib/demo-model";
import { expenseCategoryFor } from "../src/lib/expenses";
import { INTERVENTION_LABELS } from "../src/lib/labels";
import { COMPONENTS, COMPONENT_SOURCE } from "./demo-data/components";
import { makeDemoPdf } from "./demo-data/pdf";
import { CATALOG, CATALOG_COMPAT_SOURCE, CATALOG_SOURCE } from "./demo-data/catalog";
import { DEMO_GARAGE, invoiceLines, type DemoIntervention } from "./demo-data/garage";

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });
const storage = new LocalFileStorage(process.env.STORAGE_DIR || "./storage");

export const DEMO_EMAIL = "demo@example.com";
export const DEMO_PASSWORD = "demo-carview-2026";

const d = (iso: string) => new Date(`${iso}T12:00:00Z`);

async function seedComponents() {
  for (const c of COMPONENTS) {
    const data = {
      name: c.name,
      family: c.family,
      system: c.system,
      electronicKind: c.electronicKind ?? null,
      function: c.function,
      description: c.description,
      specs: c.specs,
      source: COMPONENT_SOURCE,
      reliability: c.reliability,
    };
    await prisma.component.upsert({ where: { slug: c.slug }, create: { slug: c.slug, ...data }, update: data });
  }
  const components = await prisma.component.findMany({ select: { id: true, slug: true } });
  return new Map(components.map((c) => [c.slug, c.id]));
}

async function seedDemoModel(componentIds: Map<string, string>) {
  const data = {
    name: "Véhicule générique de démonstration",
    kind: "PROCEDURAL_DEMO" as const,
    source: "Géométrie générée en code par CarView (src/components/viewer3d/demo-car.tsx).",
    license: "Code source du projet CarView — aucune ressource tierce.",
    isIllustrative: true,
    nodeNames: Object.keys(DEMO_NODE_MAPPING),
  };
  await prisma.model3D.upsert({ where: { id: DEMO_MODEL_ID }, create: { id: DEMO_MODEL_ID, ...data }, update: data });
  await prisma.componentMapping.deleteMany({ where: { model3dId: DEMO_MODEL_ID } });
  await prisma.componentMapping.createMany({
    data: Object.entries(DEMO_NODE_MAPPING).map(([nodeName, slug]) => {
      const componentId = componentIds.get(slug);
      if (!componentId) throw new Error(`Composant inconnu : ${slug}`);
      return { model3dId: DEMO_MODEL_ID, nodeName, componentId };
    }),
  });
}

async function seedCatalog() {
  await prisma.catalogPart.deleteMany({ where: { isDemo: true } });
  for (const p of CATALOG) {
    await prisma.catalogPart.create({
      data: {
        name: p.name,
        family: p.family,
        description: p.description,
        componentSlug: p.componentSlug ?? null,
        source: CATALOG_SOURCE,
        isDemo: true,
        compatibility: p.compat ? { create: { make: "CarView", model: "Berline générique", source: CATALOG_COMPAT_SOURCE } } : undefined,
      },
    });
  }
}

async function resetDemoUser() {
  const existing = await prisma.user.findUnique({ where: { email: DEMO_EMAIL } });
  if (existing) {
    await storage.deletePrefix(existing.id);
    await prisma.user.delete({ where: { id: existing.id } });
  }
  const userId = randomUUID();
  await prisma.user.create({
    data: {
      id: userId,
      name: "Thomas (démo)",
      email: DEMO_EMAIL,
      emailVerified: true,
      accounts: {
        create: { id: randomUUID(), accountId: userId, providerId: "credential", password: await hashPassword(DEMO_PASSWORD) },
      },
    },
  });
  return userId;
}

async function addInterventions(userId: string, vehicleId: string, label: string, items: DemoIntervention[], componentIds: Map<string, string>) {
  for (const it of items) {
    const created = await prisma.intervention.create({
      data: {
        vehicleId,
        date: d(it.date),
        mileage: it.mileage,
        category: it.category,
        description: it.description,
        garage: it.garage,
        partsCostCents: it.parts * 100,
        laborCostCents: it.labor * 100,
        nextDueDate: it.nextDueDate ? d(it.nextDueDate) : null,
        nextDueMileage: it.nextDueMileage ?? null,
        notes: "Donnée de démonstration (fictive).",
        replacedParts: { create: it.replaced ?? [] },
        components: { create: (it.components ?? []).map((slug) => ({ componentId: componentIds.get(slug)! })) },
      },
    });
    const total = (it.parts + it.labor) * 100;
    if (total > 0) {
      await prisma.expense.create({
        data: {
          vehicleId,
          date: created.date,
          category: expenseCategoryFor(it.category),
          amountCents: total,
          label: `${INTERVENTION_LABELS[it.category]} — ${it.description}`,
          interventionId: created.id,
        },
      });
    }
    if (it.nextDueDate || it.nextDueMileage) {
      await prisma.reminder.create({
        data: {
          vehicleId,
          title: `${INTERVENTION_LABELS[it.category]} (suite au ${new Intl.DateTimeFormat("fr-FR").format(created.date)})`,
          category: it.category,
          dueDate: it.nextDueDate ? d(it.nextDueDate) : null,
          dueMileage: it.nextDueMileage ?? null,
          sourceInterventionId: created.id,
        },
      });
    }
    if (it.invoice) {
      const key = `${userId}/documents/${randomUUID()}`;
      const pdf = makeDemoPdf(invoiceLines(label, it));
      await storage.put(key, pdf, "application/pdf");
      await prisma.document.create({
        data: {
          userId,
          vehicleId,
          interventionId: created.id,
          category: "FACTURE",
          title: `Facture ${INTERVENTION_LABELS[it.category].toLowerCase()} (démo)`,
          fileName: `facture-demo-${it.date}.pdf`,
          mimeType: "application/pdf",
          size: pdf.byteLength,
          storageKey: key,
        },
      });
    }
  }
}

async function seedDemoGarage(userId: string, componentIds: Map<string, string>) {
  for (const demo of DEMO_GARAGE) {
    const { acquiredAt, registration, ...fields } = demo.vehicle;
    const vehicle = await prisma.vehicle.create({
      data: {
        ...fields,
        userId,
        acquiredAt: acquiredAt ? d(acquiredAt) : null,
        registration: registration ?? null,
        isDemo: true,
        model3dId: demo.demoModel ? DEMO_MODEL_ID : null,
      },
    });
    await addInterventions(userId, vehicle.id, demo.label, demo.interventions, componentIds);
    for (const r of demo.reminders) {
      await prisma.reminder.create({
        data: { vehicleId: vehicle.id, title: r.title, category: r.category, dueDate: r.dueDate ? d(r.dueDate) : null, dueMileage: r.dueMileage ?? null, notes: r.notes },
      });
    }
    await prisma.expense.createMany({
      data: demo.expenses.map((e) => ({ vehicleId: vehicle.id, date: d(e.date), category: e.category, amountCents: Math.round(e.amount * 100), label: e.label })),
    });
  }
}

async function main() {
  const componentIds = await seedComponents();
  await seedDemoModel(componentIds);
  await seedCatalog();
  const userId = await resetDemoUser();
  await seedDemoGarage(userId, componentIds);
  console.log(`Jeu de démonstration prêt : ${DEMO_EMAIL} / ${DEMO_PASSWORD}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
