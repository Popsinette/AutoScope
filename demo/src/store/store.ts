/**
 * Données de la démo hors ligne. Mêmes règles métier que les services serveur
 * (src/server) : une seule dépense par intervention, recalculée ; échéance de
 * suivi ; mise à jour du kilométrage ; suppressions en cascade.
 */
import { COMPONENTS, COMPONENT_SOURCE } from "../../../prisma/demo-data/components";
import { expenseCategoryFor } from "@/lib/expenses";
import { formatShortDate } from "@/lib/format";
import { INTERVENTION_LABELS } from "@/lib/labels";
import { compareEvaluations, evaluateReminder } from "@/lib/reminders";
import type { ExpenseInput, InterventionInput, ReminderInput, VehicleInput } from "@/lib/validation";
import type { DocumentCategory, ExpenseCategory, InterventionCategory } from "@/generated/prisma/enums";
import type { DDocument, DemoData, DExpense, DIntervention, DModel, DReminder, DVehicle, FilePersistence, RecordPersistence } from "./types";

export class DemoError extends Error {}

export interface UploadInput {
  bytes: Uint8Array;
  type: string;
  fileName: string;
  size: number;
}

const COMPONENT_BY_SLUG = new Map(COMPONENTS.map((c) => [c.slug, c]));

export const emptyData = (): DemoData => ({
  version: 1,
  vehicles: [],
  interventions: [],
  expenses: [],
  reminders: [],
  documents: [],
  models: [],
  selectedVehicleId: null,
});

export function newId() {
  // randomUUID n'existe qu'en contexte sécurisé (HTTPS ou localhost).
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

const toBlob = (u: UploadInput) => new Blob([u.bytes as BlobPart], { type: u.type });

export class DemoStore {
  data: DemoData = emptyData();
  /** Numéro de version incrémenté à chaque modification (pour useSyncExternalStore). */
  revision = 0;
  private listeners = new Set<() => void>();
  private urls = new Map<string, string>();

  constructor(
    private readonly records: RecordPersistence,
    private readonly files: FilePersistence,
  ) {}

  /** Charge les données existantes, ou installe le jeu de démonstration à la première visite. */
  async init(seed: (store: DemoStore) => Promise<void>) {
    const saved = this.records.load();
    if (saved) {
      this.data = saved;
      for (const [id, blob] of await this.files.all()) this.urls.set(id, URL.createObjectURL(blob));
    } else {
      await seed(this);
    }
    this.commit();
  }

  async reset(seed: (store: DemoStore) => Promise<void>) {
    await this.wipe();
    await seed(this);
    this.commit();
  }

  async wipe() {
    this.urls.forEach((u) => URL.revokeObjectURL(u));
    this.urls.clear();
    await this.files.clear();
    this.data = emptyData();
    this.commit();
  }

  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  getRevision = () => this.revision;

  commit() {
    this.revision++;
    this.records.save(this.data);
    this.listeners.forEach((l) => l());
  }

  // ---------------------------------------------------------------- fichiers

  fileUrl(id: string | null | undefined) {
    return id ? (this.urls.get(id) ?? null) : null;
  }

  async putFile(blob: Blob) {
    const id = newId();
    await this.files.put(id, blob);
    this.urls.set(id, URL.createObjectURL(blob));
    return id;
  }

  private async dropFile(id: string | null) {
    if (!id) return;
    const url = this.urls.get(id);
    if (url) URL.revokeObjectURL(url);
    this.urls.delete(id);
    await this.files.delete(id);
  }

  // --------------------------------------------------------------- véhicules

  vehicle(id: string | null | undefined) {
    return this.data.vehicles.find((v) => v.id === id) ?? null;
  }

  requireVehicle(id: string) {
    const v = this.vehicle(id);
    if (!v) throw new DemoError("Véhicule introuvable.");
    return v;
  }

  /** Même logique que le serveur : paramètre, sinon véhicule mémorisé, sinon le premier. */
  resolveSelected(requested?: string | null) {
    const { vehicles, selectedVehicleId } = this.data;
    return vehicles.find((v) => v.id === requested) ?? vehicles.find((v) => v.id === selectedVehicleId) ?? vehicles[0] ?? null;
  }

  select(vehicleId: string) {
    this.requireVehicle(vehicleId);
    this.data.selectedVehicleId = vehicleId;
    this.commit();
  }

  async createVehicle(input: VehicleInput, photo?: UploadInput, extra: Partial<DVehicle> = {}) {
    const now = new Date();
    const vehicle: DVehicle = {
      id: newId(),
      ...input,
      photoKey: photo ? await this.putFile(toBlob(photo)) : null,
      isDemo: false,
      model3dId: null,
      createdAt: now,
      updatedAt: now,
      ...extra,
    };
    this.data.vehicles.push(vehicle);
    this.commit();
    return vehicle;
  }

  async updateVehicle(id: string, input: VehicleInput, photo?: UploadInput | "remove") {
    const v = this.requireVehicle(id);
    const previous = v.photoKey;
    if (photo === "remove") v.photoKey = null;
    else if (photo) v.photoKey = await this.putFile(toBlob(photo));
    Object.assign(v, input, { updatedAt: new Date() });
    if (previous && previous !== v.photoKey) await this.dropFile(previous);
    this.commit();
    return v;
  }

  async deleteVehicle(id: string) {
    const v = this.requireVehicle(id);
    const d = this.data;
    const docs = d.documents.filter((x) => x.vehicleId === id);
    d.vehicles = d.vehicles.filter((x) => x.id !== id);
    d.interventions = d.interventions.filter((x) => x.vehicleId !== id);
    d.expenses = d.expenses.filter((x) => x.vehicleId !== id);
    d.reminders = d.reminders.filter((x) => x.vehicleId !== id);
    d.documents = d.documents.filter((x) => x.vehicleId !== id);
    if (d.selectedVehicleId === id) d.selectedVehicleId = null;
    for (const doc of docs) await this.dropFile(doc.id);
    await this.dropFile(v.photoKey);
    if (v.model3dId) await this.deleteModelIfUnused(v.model3dId);
    this.commit();
  }

  // ------------------------------------------------------------ interventions

  intervention(id: string) {
    return this.data.interventions.find((i) => i.id === id) ?? null;
  }

  private requireIntervention(id: string) {
    const i = this.intervention(id);
    if (!i) throw new DemoError("Intervention introuvable.");
    return i;
  }

  listInterventions(vehicleId: string, filters: { category?: InterventionCategory; q?: string } = {}) {
    const q = filters.q?.toLowerCase();
    return this.data.interventions
      .filter((i) => i.vehicleId === vehicleId)
      .filter((i) => !filters.category || i.category === filters.category)
      .filter((i) => !q || [i.description, i.garage, i.notes].some((t) => t?.toLowerCase().includes(q)))
      .sort((a, b) => b.date.getTime() - a.date.getTime() || b.mileage - a.mileage)
      .map((i) => ({ ...i, documentCount: this.data.documents.filter((d) => d.interventionId === i.id).length }));
  }

  /** Unique point d'écriture des dépenses issues d'une intervention. */
  private syncExpense(i: DIntervention) {
    const amountCents = i.partsCostCents + i.laborCostCents;
    const existing = this.data.expenses.find((e) => e.interventionId === i.id);
    if (amountCents <= 0) {
      this.data.expenses = this.data.expenses.filter((e) => e.interventionId !== i.id);
      return;
    }
    const values = {
      vehicleId: i.vehicleId,
      date: i.date,
      category: expenseCategoryFor(i.category),
      amountCents,
      label: `${INTERVENTION_LABELS[i.category]} — ${i.description}`.slice(0, 160),
    };
    if (existing) Object.assign(existing, values);
    else this.data.expenses.push({ id: newId(), ...values, notes: null, interventionId: i.id, createdAt: new Date() });
  }

  private syncFollowUp(i: DIntervention) {
    const existing = this.data.reminders.find((r) => r.sourceInterventionId === i.id);
    if (!i.nextDueDate && i.nextDueMileage === null) {
      this.data.reminders = this.data.reminders.filter((r) => r.sourceInterventionId !== i.id);
      return;
    }
    const values = {
      vehicleId: i.vehicleId,
      title: `${INTERVENTION_LABELS[i.category]} (suite au ${formatShortDate(i.date)})`,
      category: i.category,
      dueDate: i.nextDueDate,
      dueMileage: i.nextDueMileage,
      origin: "UTILISATEUR" as const,
    };
    if (existing) Object.assign(existing, values);
    else
      this.data.reminders.push({
        id: newId(),
        ...values,
        sourceReference: null,
        notes: null,
        completedAt: null,
        completedById: null,
        sourceInterventionId: i.id,
        createdAt: new Date(),
      });
  }

  private columns(input: InterventionInput) {
    return {
      date: input.date,
      mileage: input.mileage,
      category: input.category,
      description: input.description,
      garage: input.garage,
      partsCostCents: input.partsCost,
      laborCostCents: input.laborCost,
      nextDueDate: input.nextDueDate,
      nextDueMileage: input.nextDueMileage,
      notes: input.notes,
      replacedParts: input.replacedParts.map((p) => ({ id: newId(), name: p.name, reference: p.reference, quantity: p.quantity })),
      // Les fiches de la démo sont identifiées par leur slug.
      componentSlugs: input.componentIds.filter((slug) => COMPONENT_BY_SLUG.has(slug)),
    };
  }

  private async attach(vehicleId: string, interventionId: string, files: UploadInput[]) {
    for (const f of files) {
      const id = await this.putFile(toBlob(f));
      this.data.documents.push({
        id,
        vehicleId,
        interventionId,
        category: f.type === "application/pdf" ? "FACTURE" : "PHOTO",
        title: f.fileName.replace(/\.[^.]+$/, "") || "Justificatif",
        fileName: f.fileName,
        mimeType: f.type,
        size: f.size,
        createdAt: new Date(),
      });
    }
  }

  async createIntervention(vehicleId: string, input: InterventionInput, files: UploadInput[] = [], completesReminderId?: string | null) {
    const vehicle = this.requireVehicle(vehicleId);
    const i: DIntervention = { id: newId(), vehicleId, ...this.columns(input), createdAt: new Date() };
    this.data.interventions.push(i);
    await this.attach(vehicleId, i.id, files);
    this.syncExpense(i);
    this.syncFollowUp(i);
    if (input.mileage > vehicle.mileage) vehicle.mileage = input.mileage;
    const reminder = this.data.reminders.find((r) => r.id === completesReminderId && r.vehicleId === vehicleId && !r.completedAt);
    if (reminder) {
      reminder.completedAt = input.date;
      reminder.completedById = i.id;
    }
    this.commit();
    return i;
  }

  async updateIntervention(id: string, input: InterventionInput, files: UploadInput[] = []) {
    const i = this.requireIntervention(id);
    Object.assign(i, this.columns(input));
    await this.attach(i.vehicleId, i.id, files);
    this.syncExpense(i);
    this.syncFollowUp(i);
    const vehicle = this.requireVehicle(i.vehicleId);
    if (input.mileage > vehicle.mileage) vehicle.mileage = input.mileage;
    this.commit();
    return i;
  }

  /** Supprime l'intervention et sa dépense ; les documents restent rattachés au véhicule. */
  deleteIntervention(id: string) {
    const i = this.requireIntervention(id);
    const d = this.data;
    d.interventions = d.interventions.filter((x) => x.id !== id);
    d.expenses = d.expenses.filter((e) => e.interventionId !== id);
    d.reminders = d.reminders.filter((r) => r.sourceInterventionId !== id);
    d.reminders.forEach((r) => {
      if (r.completedById === id) r.completedById = null;
    });
    d.documents.forEach((doc) => {
      if (doc.interventionId === id) doc.interventionId = null;
    });
    this.commit();
    return i;
  }

  interventionDetail(id: string) {
    const i = this.intervention(id);
    if (!i) return null;
    const vehicle = this.requireVehicle(i.vehicleId);
    const expense = this.data.expenses.find((e) => e.interventionId === i.id) ?? null;
    const followUp = this.data.reminders.find((r) => r.sourceInterventionId === i.id) ?? null;
    return {
      ...i,
      vehicle,
      components: i.componentSlugs.flatMap((slug) => {
        const c = COMPONENT_BY_SLUG.get(slug);
        return c ? [{ component: { id: c.slug, slug: c.slug, name: c.name, family: c.family } }] : [];
      }),
      documents: this.data.documents.filter((d) => d.interventionId === i.id).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()),
      expense,
      followUpReminder: followUp,
    };
  }

  // ----------------------------------------------------------------- dépenses

  listExpenses(filters: { vehicleId?: string | null; year?: number | null; category?: ExpenseCategory | null } = {}) {
    return this.data.expenses
      .filter((e) => !filters.vehicleId || e.vehicleId === filters.vehicleId)
      .filter((e) => !filters.year || e.date.getUTCFullYear() === filters.year)
      .filter((e) => !filters.category || e.category === filters.category)
      .filter((e) => this.vehicle(e.vehicleId))
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .map((e) => ({ ...e, vehicle: this.vehicle(e.vehicleId)! }));
  }

  expenseYears() {
    const years = new Set(this.data.expenses.map((e) => e.date.getUTCFullYear()));
    years.add(new Date().getFullYear());
    return [...years].sort((a, b) => b - a);
  }

  private requireManualExpense(id: string) {
    const e = this.data.expenses.find((x) => x.id === id);
    if (!e) throw new DemoError("Dépense introuvable.");
    if (e.interventionId) throw new DemoError("Cette dépense provient d'une intervention : modifiez l'intervention pour la mettre à jour.");
    return e;
  }

  expense(id: string) {
    return this.data.expenses.find((x) => x.id === id) ?? null;
  }

  createExpense(vehicleId: string, input: ExpenseInput) {
    this.requireVehicle(vehicleId);
    const e: DExpense = {
      id: newId(),
      vehicleId,
      date: input.date,
      category: input.category,
      amountCents: input.amount,
      label: input.label,
      notes: input.notes,
      interventionId: null,
      createdAt: new Date(),
    };
    this.data.expenses.push(e);
    this.commit();
    return e;
  }

  updateExpense(id: string, input: ExpenseInput) {
    const e = this.requireManualExpense(id);
    Object.assign(e, { date: input.date, category: input.category, amountCents: input.amount, label: input.label, notes: input.notes });
    this.commit();
    return e;
  }

  deleteExpense(id: string) {
    const e = this.requireManualExpense(id);
    this.data.expenses = this.data.expenses.filter((x) => x.id !== id);
    this.commit();
    return e;
  }

  // ---------------------------------------------------------------- échéances

  listReminders(vehicleId?: string | null) {
    const today = new Date();
    return this.data.reminders
      .filter((r) => !vehicleId || r.vehicleId === vehicleId)
      .flatMap((r) => {
        const vehicle = this.vehicle(r.vehicleId);
        if (!vehicle) return [];
        const completedBy = r.completedById ? this.intervention(r.completedById) : null;
        const source = r.sourceInterventionId ? this.intervention(r.sourceInterventionId) : null;
        return [
          {
            ...r,
            vehicle,
            completedBy: completedBy ? { id: completedBy.id, date: completedBy.date } : null,
            sourceIntervention: source ? { id: source.id, date: source.date } : null,
            evaluation: evaluateReminder(r, vehicle.mileage, today),
          },
        ];
      })
      .sort((a, b) => compareEvaluations(a.evaluation, b.evaluation));
  }

  alertCount() {
    return this.listReminders().filter((r) => r.evaluation.status === "DEPASSE" || r.evaluation.status === "PROCHE").length;
  }

  reminder(id: string) {
    return this.data.reminders.find((r) => r.id === id) ?? null;
  }

  private requireReminder(id: string) {
    const r = this.reminder(id);
    if (!r) throw new DemoError("Échéance introuvable.");
    return r;
  }

  private reminderColumns(input: ReminderInput) {
    return {
      title: input.title,
      category: input.category,
      dueDate: input.dueDate,
      dueMileage: input.dueMileage,
      origin: input.origin,
      sourceReference: input.sourceReference,
      notes: input.notes,
    };
  }

  createReminder(vehicleId: string, input: ReminderInput) {
    this.requireVehicle(vehicleId);
    const r: DReminder = {
      id: newId(),
      vehicleId,
      ...this.reminderColumns(input),
      completedAt: null,
      completedById: null,
      sourceInterventionId: null,
      createdAt: new Date(),
    };
    this.data.reminders.push(r);
    this.commit();
    return r;
  }

  updateReminder(id: string, input: ReminderInput) {
    const r = this.requireReminder(id);
    Object.assign(r, this.reminderColumns(input));
    this.commit();
    return r;
  }

  setReminderCompleted(id: string, completed: boolean) {
    const r = this.requireReminder(id);
    if (completed) r.completedAt = new Date();
    else Object.assign(r, { completedAt: null, completedById: null });
    this.commit();
  }

  deleteReminder(id: string) {
    const r = this.requireReminder(id);
    this.data.reminders = this.data.reminders.filter((x) => x.id !== id);
    this.commit();
    return r;
  }

  // ---------------------------------------------------------------- documents

  listDocuments(filters: { vehicleId?: string | null; category?: DocumentCategory | null; q?: string | null } = {}) {
    const q = filters.q?.toLowerCase();
    return this.data.documents
      .filter((d) => !filters.vehicleId || d.vehicleId === filters.vehicleId)
      .filter((d) => !filters.category || d.category === filters.category)
      .filter((d) => !q || d.title.toLowerCase().includes(q) || d.fileName.toLowerCase().includes(q))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .map((d) => {
        const i = d.interventionId ? this.intervention(d.interventionId) : null;
        return { ...d, intervention: i ? { id: i.id, date: i.date, category: i.category, description: i.description } : null };
      });
  }

  async createDocument(input: { vehicleId: string; interventionId: string | null; title: string; category: DocumentCategory; file: UploadInput }) {
    this.requireVehicle(input.vehicleId);
    if (input.interventionId && this.intervention(input.interventionId)?.vehicleId !== input.vehicleId) {
      throw new DemoError("Intervention introuvable pour ce véhicule.");
    }
    const id = await this.putFile(toBlob(input.file));
    const doc: DDocument = {
      id,
      vehicleId: input.vehicleId,
      interventionId: input.interventionId,
      category: input.category,
      title: input.title,
      fileName: input.file.fileName,
      mimeType: input.file.type,
      size: input.file.size,
      createdAt: new Date(),
    };
    this.data.documents.push(doc);
    this.commit();
    return doc;
  }

  async deleteDocument(id: string) {
    const doc = this.data.documents.find((d) => d.id === id);
    if (!doc) throw new DemoError("Document introuvable.");
    this.data.documents = this.data.documents.filter((d) => d.id !== id);
    await this.dropFile(id);
    this.commit();
    return doc;
  }

  // ------------------------------------------------------------- fiches et 3D

  componentSheet(slug: string, vehicleId: string | null) {
    const c = COMPONENT_BY_SLUG.get(slug);
    if (!c) throw new DemoError("Composant introuvable.");
    const interventions = this.data.interventions
      .filter((i) => i.componentSlugs.includes(slug) && (!vehicleId || i.vehicleId === vehicleId))
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .slice(0, 10);
    const ids = new Set(interventions.map((i) => i.id));
    return {
      component: {
        id: c.slug,
        slug: c.slug,
        name: c.name,
        family: c.family,
        electronicKind: c.electronicKind ?? null,
        function: c.function,
        description: c.description,
        specs: c.specs,
        reference: null,
        source: COMPONENT_SOURCE,
        reliability: c.reliability,
      },
      interventions: interventions.map((i) => ({ id: i.id, date: i.date, mileage: i.mileage, category: i.category, description: i.description })),
      documents: this.data.documents.filter((d) => d.interventionId && ids.has(d.interventionId)).map((d) => ({ id: d.id, title: d.title, mimeType: d.mimeType })),
    };
  }

  model(id: string | null | undefined) {
    return this.data.models.find((m) => m.id === id) ?? null;
  }

  async importModel(vehicleId: string, input: Omit<DModel, "id" | "mapping" | "updatedAt" | "fileSize"> & { bytes: Uint8Array }) {
    const vehicle = this.requireVehicle(vehicleId);
    const { bytes, ...meta } = input;
    const id = await this.putFile(new Blob([bytes as BlobPart], { type: "model/gltf-binary" }));
    this.data.models.push({ ...meta, id, mapping: {}, fileSize: bytes.byteLength, updatedAt: new Date() });
    const previous = vehicle.model3dId;
    vehicle.model3dId = id;
    if (previous) await this.deleteModelIfUnused(previous);
    this.commit();
    return id;
  }

  saveMappings(modelId: string, entries: { nodeName: string; slug: string }[]) {
    const m = this.model(modelId);
    if (!m) throw new DemoError("Modèle introuvable.");
    const nodes = new Set(m.nodeNames);
    m.mapping = Object.fromEntries(entries.filter((e) => nodes.has(e.nodeName) && COMPONENT_BY_SLUG.has(e.slug)).map((e) => [e.nodeName, e.slug]));
    m.updatedAt = new Date();
    this.commit();
    return Object.keys(m.mapping).length;
  }

  async detachModel(vehicleId: string) {
    const v = this.requireVehicle(vehicleId);
    const previous = v.model3dId;
    v.model3dId = null;
    if (previous) await this.deleteModelIfUnused(previous);
    this.commit();
  }

  private async deleteModelIfUnused(modelId: string) {
    if (!this.model(modelId) || this.data.vehicles.some((v) => v.model3dId === modelId)) return;
    this.data.models = this.data.models.filter((m) => m.id !== modelId);
    await this.dropFile(modelId);
  }
}
