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
  const source = "Catalogue de démonstration CarView — références génériques, non commerciales.";
  const parts: { name: string; family: string; description: string; componentSlug?: string; compat?: boolean }[] = [
    { name: "Filtre à huile (générique)", family: "MOTEUR", description: "Retient les particules en suspension dans l'huile moteur. Se remplace à chaque vidange.", componentSlug: "bloc-moteur", compat: true },
    { name: "Filtre à air (générique)", family: "MOTEUR", description: "Filtre l'air admis par le moteur.", componentSlug: "admission", compat: true },
    { name: "Bougies d'allumage (jeu)", family: "MOTEUR", description: "Produisent l'étincelle qui enflamme le mélange sur un moteur essence." },
    { name: "Kit d'embrayage", family: "TRANSMISSION", description: "Disque, mécanisme et butée d'embrayage pour boîte manuelle." },
    { name: "Huile de boîte de vitesses", family: "TRANSMISSION", description: "Lubrifiant spécifique à la boîte ; la norme exacte dépend du constructeur.", componentSlug: "boite-de-vitesses" },
    { name: "Plaquettes de frein avant", family: "FREINAGE", description: "Garnitures de friction pour étriers avant.", componentSlug: "etriers-frein", compat: true },
    { name: "Disques de frein avant (paire)", family: "FREINAGE", description: "Disques ventilés à remplacer par paire.", componentSlug: "disques-frein", compat: true },
    { name: "Liquide de frein DOT 4", family: "FREINAGE", description: "Liquide hygroscopique à renouveler périodiquement." },
    { name: "Amortisseurs avant (paire)", family: "SUSPENSION", description: "Amortisseurs hydrauliques à remplacer par essieu.", componentSlug: "amortisseurs" },
    { name: "Rotule de direction", family: "DIRECTION", description: "Articulation entre biellette et porte-moyeu.", componentSlug: "cremaillere" },
    { name: "Liquide de refroidissement", family: "REFROIDISSEMENT", description: "Mélange antigel ; respecter le type préconisé par le constructeur.", componentSlug: "radiateur" },
    { name: "Thermostat", family: "REFROIDISSEMENT", description: "Régule la température de fonctionnement du moteur." },
    { name: "Silencieux arrière", family: "ECHAPPEMENT", description: "Élément terminal de la ligne d'échappement.", componentSlug: "silencieux" },
    { name: "Batterie 12 V AGM", family: "ELECTRONIQUE", description: "Batterie adaptée aux véhicules équipés du Stop & Start.", componentSlug: "batterie", compat: true },
    { name: "Sonde lambda amont", family: "ELECTRONIQUE", description: "Capteur d'oxygène placé avant le catalyseur.", componentSlug: "sonde-lambda" },
    { name: "Ampoule de phare H7", family: "CARROSSERIE", description: "Ampoule halogène courante pour feux de croisement.", componentSlug: "optiques-avant" },
    { name: "Balais d'essuie-glace (paire)", family: "CARROSSERIE", description: "À remplacer en cas de traces ou de broutement." },
    { name: "Pneumatique été 225/45 R17", family: "ROUES", description: "Dimension courante sur les compactes et berlines.", componentSlug: "pneumatiques" },
    { name: "Filtre d'habitacle", family: "HABITACLE", description: "Filtre l'air entrant dans l'habitacle (pollens, particules)." },
  ];
  for (const p of parts) {
    await prisma.catalogPart.create({
      data: {
        name: p.name,
        family: p.family as never,
        description: p.description,
        componentSlug: p.componentSlug ?? null,
        source,
        isDemo: true,
        // Compatibilité explicite uniquement avec le véhicule générique de démonstration (fictif).
        compatibility: p.compat
          ? { create: { make: "CarView", model: "Berline générique", source: "Donnée fictive de démonstration" } }
          : undefined,
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

interface DemoIntervention {
  date: string;
  mileage: number;
  category: InterventionCategory;
  description: string;
  garage: string;
  parts: number;
  labor: number;
  replaced?: { name: string; reference?: string; quantity?: number }[];
  components?: string[];
  invoice?: boolean;
  nextDueDate?: string;
  nextDueMileage?: number;
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
      const pdf = makeDemoPdf([
        "FACTURE DE DEMONSTRATION - DOCUMENT FICTIF",
        `Vehicule : ${label}`,
        `Intervention : ${it.description}`,
        `Date : ${it.date} - Kilometrage : ${it.mileage} km`,
        `Intervenant : ${it.garage}`,
        `Pieces : ${it.parts} EUR - Main-d'oeuvre : ${it.labor} EUR`,
        "Genere automatiquement par le jeu de demonstration CarView.",
      ]);
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
  const gt3 = await prisma.vehicle.create({
    data: {
      userId,
      make: "Porsche",
      model: "911 GT3",
      trim: "(992)",
      year: 2023,
      engine: "6 cylindres à plat atmosphérique 4,0 L",
      energy: "ESSENCE",
      transmission: "DOUBLE_EMBRAYAGE",
      mileage: 12450,
      acquiredAt: d("2023-03-15"),
      registration: "AA-123-AA",
      notes: "Véhicule de démonstration : données fictives.",
      isDemo: true,
    },
  });
  await addInterventions(
    userId,
    gt3.id,
    "Porsche 911 GT3 (992)",
    [
      { date: "2024-03-12", mileage: 6450, category: "REVISION", description: "Révision annuelle", garage: "Garage partenaire (fictif)", parts: 180, labor: 170, invoice: true, components: ["bloc-moteur", "admission"], replaced: [{ name: "Filtre à huile" }, { name: "Huile moteur", quantity: 9 }] },
      { date: "2024-09-18", mileage: 8320, category: "FREINAGE", description: "Remplacement plaquettes avant", garage: "Garage partenaire (fictif)", parts: 460, labor: 160, invoice: true, components: ["etriers-frein"], replaced: [{ name: "Plaquettes de frein avant", quantity: 1 }] },
      { date: "2025-02-10", mileage: 9800, category: "PNEUS", description: "Changement pneus (×4)", garage: "Centre pneus (fictif)", parts: 1760, labor: 120, components: ["pneumatiques"] },
      { date: "2025-11-14", mileage: 11200, category: "VIDANGE", description: "Vidange moteur", garage: "Garage partenaire (fictif)", parts: 210, labor: 90, components: ["bloc-moteur"], invoice: true, nextDueDate: "2026-11-14", nextDueMileage: 16200 },
      { date: "2026-04-22", mileage: 12100, category: "REPARATION", description: "Remplacement capteur de vitesse de roue AR gauche", garage: "Garage partenaire (fictif)", parts: 140, labor: 95, components: ["capteurs-vitesse-roue"] },
    ],
    componentIds,
  );
  await prisma.reminder.createMany({
    data: [
      { vehicleId: gt3.id, title: "Remplacer les pneus avant", category: "PNEUS", dueMileage: 13000, notes: "Usure constatée lors de la dernière vidange (démo)." },
      { vehicleId: gt3.id, title: "Liquide de frein", category: "FREINAGE", dueDate: d("2026-10-01"), notes: "Échéance personnelle (démo)." },
    ],
  });
  await prisma.expense.createMany({
    data: [
      { vehicleId: gt3.id, date: d("2026-01-05"), category: "ASSURANCE", amountCents: 186000, label: "Assurance annuelle (démo)" },
      { vehicleId: gt3.id, date: d("2026-02-14"), category: "CARBURANT", amountCents: 14250, label: "Plein SP98 (démo)" },
      { vehicleId: gt3.id, date: d("2026-05-30"), category: "CARBURANT", amountCents: 13890, label: "Plein SP98 (démo)" },
      { vehicleId: gt3.id, date: d("2026-07-12"), category: "PIECES", amountCents: 8900, label: "Kit de nettoyage carrosserie (démo)" },
      { vehicleId: gt3.id, date: d("2026-08-03"), category: "CARBURANT", amountCents: 15120, label: "Plein SP98 (démo)" },
    ],
  });

  const m3 = await prisma.vehicle.create({
    data: {
      userId,
      make: "BMW",
      model: "M3",
      trim: "(E92)",
      year: 2008,
      engine: "V8 atmosphérique 4,0 L",
      energy: "ESSENCE",
      transmission: "MANUELLE",
      mileage: 85230,
      acquiredAt: d("2019-06-01"),
      isDemo: true,
      notes: "Véhicule de démonstration : données fictives.",
    },
  });
  await addInterventions(
    userId,
    m3.id,
    "BMW M3 (E92)",
    [
      { date: "2025-06-02", mileage: 82100, category: "CONTROLE_TECHNIQUE", description: "Contrôle technique périodique", garage: "Centre de contrôle (fictif)", parts: 0, labor: 78, invoice: true, nextDueDate: "2027-06-02" },
      { date: "2026-03-20", mileage: 84600, category: "BATTERIE", description: "Remplacement batterie", garage: "Atelier (fictif)", parts: 210, labor: 40, components: ["batterie"] },
    ],
    componentIds,
  );

  const rs4 = await prisma.vehicle.create({
    data: {
      userId,
      make: "Audi",
      model: "RS4 Avant",
      trim: "(B9)",
      year: 2018,
      engine: "V6 biturbo 2,9 L",
      energy: "ESSENCE",
      transmission: "AUTOMATIQUE",
      mileage: 62100,
      isDemo: true,
      notes: "Véhicule de démonstration : données fictives.",
    },
  });
  await prisma.reminder.create({
    data: { vehicleId: rs4.id, title: "Révision", category: "REVISION", dueDate: d("2026-12-15"), dueMileage: 65000, notes: "Échéance personnelle (démo)." },
  });

  await prisma.vehicle.create({
    data: {
      userId,
      make: "CarView",
      model: "Berline générique",
      trim: "démonstration 3D",
      year: 2024,
      engine: "4 cylindres essence (illustratif)",
      energy: "ESSENCE",
      transmission: "MANUELLE",
      mileage: 15000,
      isDemo: true,
      model3dId: DEMO_MODEL_ID,
      notes: "Véhicule fictif associé au modèle 3D de démonstration : toutes ses pièces sont illustratives.",
    },
  });
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
