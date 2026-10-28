import { useMemo } from "react";
import { useNavigate } from "react-router";
import type { SimpleActionState } from "@/components/ui/confirm-action";
import type { FormState } from "@/components/ui/use-form-action";
import { checkUpload, MAX_DOCUMENT_BYTES, MAX_MODEL_BYTES, MAX_PHOTO_BYTES, DOCUMENT_TYPES, PHOTO_TYPES, safeFileName } from "@/lib/files";
import { parseInterventionForm, readDocumentUploads } from "@/lib/form-parsing";
import { inspectGlb } from "@/lib/gltf";
import { documentSchema, expenseSchema, fieldErrors, formToObject, reminderSchema, vehicleSchema } from "@/lib/validation";
import { demoStore, DemoError } from "./store/exports";

function fail(error: unknown): { error: string } {
  if (error instanceof DemoError) return { error: error.message };
  console.error(error);
  return { error: "Une erreur inattendue est survenue. Réessayez." };
}

/** Équivalents locaux des server actions : mêmes validations, navigation côté client. */
export function useDemoActions() {
  const navigate = useNavigate();
  return useMemo(() => {
    const go = (href: string) => navigate(href);
    const store = demoStore;
    return {
      select: async (vehicleId: string) => store.select(vehicleId),

      saveVehicle: async (form: FormData): Promise<FormState> => {
        const id = form.get("id")?.toString() || null;
        const parsed = vehicleSchema.safeParse(formToObject(form, ["photo", "id", "removePhoto"]));
        if (!parsed.success) return { error: "Certains champs sont à corriger.", fieldErrors: fieldErrors(parsed.error) };
        let photo: { bytes: Uint8Array; type: string; fileName: string; size: number } | "remove" | undefined;
        const file = form.get("photo");
        if (file instanceof File && file.size > 0) {
          const check = await checkUpload(file, PHOTO_TYPES, MAX_PHOTO_BYTES);
          if (!check.ok) return { fieldErrors: { photo: [check.error] } };
          photo = { bytes: check.bytes, type: check.type, fileName: file.name, size: file.size };
        } else if (form.get("removePhoto") === "on") photo = "remove";
        try {
          const v = id ? await store.updateVehicle(id, parsed.data, photo) : await store.createVehicle(parsed.data, photo === "remove" ? undefined : photo);
          go(`/garage/${v.id}?ok=${id ? "vehicule-modifie" : "vehicule-cree"}`);
        } catch (error) {
          return fail(error);
        }
      },

      deleteVehicle: async (_s: SimpleActionState, form: FormData): Promise<SimpleActionState> => {
        try {
          await store.deleteVehicle(String(form.get("id")));
          go("/garage?ok=vehicule-supprime");
        } catch (error) {
          return fail(error);
        }
      },

      saveIntervention: async (form: FormData): Promise<FormState> => {
        const id = form.get("id")?.toString() || null;
        const parsed = parseInterventionForm(form);
        if (!parsed.ok) return { error: "Certains champs sont à corriger.", fieldErrors: parsed.fieldErrors };
        const uploads = await readDocumentUploads(form);
        if ("error" in uploads) return { fieldErrors: { files: [uploads.error] } };
        try {
          const i = id
            ? await store.updateIntervention(id, parsed.data, uploads.files)
            : await store.createIntervention(String(form.get("vehicleId") ?? ""), parsed.data, uploads.files, form.get("completesReminderId")?.toString() || null);
          go(`/entretiens/${i.id}?ok=${id ? "entretien-modifie" : "entretien-cree"}`);
        } catch (error) {
          return fail(error);
        }
      },

      deleteIntervention: async (_s: SimpleActionState, form: FormData): Promise<SimpleActionState> => {
        try {
          const i = store.deleteIntervention(String(form.get("id")));
          go(`/entretiens?v=${i.vehicleId}&ok=entretien-supprime`);
        } catch (error) {
          return fail(error);
        }
      },

      saveExpense: async (form: FormData): Promise<FormState> => {
        const id = form.get("id")?.toString() || null;
        const parsed = expenseSchema.safeParse(formToObject(form, ["id", "vehicleId"]));
        if (!parsed.success) return { error: "Certains champs sont à corriger.", fieldErrors: fieldErrors(parsed.error) };
        try {
          const e = id ? store.updateExpense(id, parsed.data) : store.createExpense(String(form.get("vehicleId") ?? ""), parsed.data);
          go(`/depenses?v=${e.vehicleId}&annee=${parsed.data.date.getUTCFullYear()}&ok=${id ? "depense-modifiee" : "depense-creee"}`);
        } catch (error) {
          return fail(error);
        }
      },

      deleteExpense: async (_s: SimpleActionState, form: FormData): Promise<SimpleActionState> => {
        try {
          const e = store.deleteExpense(String(form.get("id")));
          go(`/depenses?v=${e.vehicleId}&ok=depense-supprimee`);
        } catch (error) {
          return fail(error);
        }
      },

      saveReminder: async (form: FormData): Promise<FormState> => {
        const id = form.get("id")?.toString() || null;
        const parsed = reminderSchema.safeParse(formToObject(form, ["id", "vehicleId"]));
        if (!parsed.success) return { error: "Certains champs sont à corriger.", fieldErrors: fieldErrors(parsed.error) };
        try {
          const r = id ? store.updateReminder(id, parsed.data) : store.createReminder(String(form.get("vehicleId") ?? ""), parsed.data);
          go(`/echeances?v=${r.vehicleId}&ok=${id ? "echeance-modifiee" : "echeance-creee"}`);
        } catch (error) {
          return fail(error);
        }
      },

      toggleReminder: async (form: FormData) => {
        store.setReminderCompleted(String(form.get("id")), form.get("completed") === "1");
      },

      deleteReminder: async (_s: SimpleActionState, form: FormData): Promise<SimpleActionState> => {
        try {
          const r = store.deleteReminder(String(form.get("id")));
          go(`/echeances?v=${r.vehicleId}&ok=echeance-supprimee`);
        } catch (error) {
          return fail(error);
        }
      },

      uploadDocument: async (form: FormData): Promise<FormState> => {
        const vehicleId = String(form.get("vehicleId") ?? "");
        const parsed = documentSchema.safeParse(formToObject(form, ["file", "vehicleId"]));
        if (!parsed.success) return { error: "Certains champs sont à corriger.", fieldErrors: fieldErrors(parsed.error) };
        const file = form.get("file");
        if (!(file instanceof File) || file.size === 0) return { fieldErrors: { file: ["Choisissez un fichier."] } };
        const check = await checkUpload(file, DOCUMENT_TYPES, MAX_DOCUMENT_BYTES);
        if (!check.ok) return { fieldErrors: { file: [check.error] } };
        try {
          await store.createDocument({
            vehicleId,
            interventionId: parsed.data.interventionId,
            title: parsed.data.title,
            category: parsed.data.category,
            file: { bytes: check.bytes, type: check.type, fileName: safeFileName(file.name), size: file.size },
          });
          go(`/documents?v=${vehicleId}&ok=document-ajoute`);
        } catch (error) {
          return fail(error);
        }
      },

      deleteDocument: async (_s: SimpleActionState, form: FormData): Promise<SimpleActionState> => {
        try {
          const doc = await store.deleteDocument(String(form.get("id")));
          go(`/documents?v=${doc.vehicleId}&ok=document-supprime`);
        } catch (error) {
          return fail(error);
        }
      },

      importModel: async (form: FormData): Promise<FormState> => {
        const name = String(form.get("name") ?? "").trim();
        const source = String(form.get("source") ?? "").trim();
        const license = String(form.get("license") ?? "").trim();
        const errors: Record<string, string[]> = {};
        if (!name) errors.name = ["Nom obligatoire."];
        if (source.length < 3) errors.source = ["Indiquez la provenance du fichier."];
        if (license.length < 2) errors.license = ["Indiquez la licence ou le droit d’usage."];
        if (form.get("rights") !== "on") errors.rights = ["Vous devez confirmer disposer du droit d’utiliser ce modèle."];
        if (Object.keys(errors).length) return { error: "Certains champs sont à corriger.", fieldErrors: errors };
        const file = form.get("file");
        if (!(file instanceof File) || file.size === 0) return { fieldErrors: { file: ["Choisissez un fichier .glb."] } };
        const check = await checkUpload(file, ["model/gltf-binary"], MAX_MODEL_BYTES);
        if (!check.ok) return { fieldErrors: { file: [check.error === "Type de fichier non accepté." ? "Seuls les fichiers GLB (glTF binaire) sont acceptés." : check.error] } };
        const inspection = inspectGlb(check.bytes);
        if (!inspection.ok) return { fieldErrors: { file: [inspection.error] } };
        if (inspection.nodeNames.length === 0) return { fieldErrors: { file: ["Le modèle ne contient aucun objet nommé : impossible d’associer des composants."] } };
        try {
          const id = await store.importModel(String(form.get("vehicleId") ?? ""), {
            name,
            source,
            license,
            isIllustrative: form.get("illustrative") === "on",
            nodeNames: inspection.nodeNames,
            bytes: check.bytes,
          });
          go(`/vue-3d/correspondances/${id}?ok=modele-importe`);
        } catch (error) {
          return fail(error);
        }
      },

      saveMappings: async (form: FormData): Promise<FormState> => {
        const modelId = String(form.get("modelId") ?? "");
        const entries: { nodeName: string; slug: string }[] = [];
        for (const [key, value] of form.entries()) {
          if (key.startsWith("node:") && typeof value === "string" && value) entries.push({ nodeName: key.slice(5), slug: value });
        }
        try {
          store.saveMappings(modelId, entries);
          go(`/vue-3d/correspondances/${modelId}?ok=correspondances-enregistrees`);
        } catch (error) {
          return fail(error);
        }
      },

      detachModel: async (_s: SimpleActionState, form: FormData): Promise<SimpleActionState> => {
        const vehicleId = String(form.get("vehicleId") ?? "");
        try {
          await store.detachModel(vehicleId);
          go(`/vue-3d?v=${vehicleId}`);
        } catch (error) {
          return fail(error);
        }
      },
    };
  }, [navigate]);
}
