/**
 * Lecture des formulaires partagée entre les server actions et la démo hors
 * ligne : mêmes schémas, mêmes contrôles de fichiers.
 */
import { checkUpload, DOCUMENT_TYPES, MAX_DOCUMENT_BYTES, safeFileName } from "./files";
import { fieldErrors, formToObject, interventionSchema, type FieldErrors, type InterventionInput } from "./validation";

export const MAX_FILES_PER_UPLOAD = 5;

export interface ParsedUpload {
  bytes: Uint8Array;
  type: string;
  fileName: string;
  size: number;
}

function parseParts(raw: FormDataEntryValue | null) {
  try {
    const parsed = JSON.parse(String(raw ?? "[]"));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function parseInterventionForm(form: FormData): { ok: true; data: InterventionInput } | { ok: false; fieldErrors: FieldErrors } {
  const parsed = interventionSchema.safeParse({
    ...formToObject(form, ["id", "vehicleId", "files", "replacedParts", "componentIds", "completesReminderId"]),
    replacedParts: parseParts(form.get("replacedParts")).filter((p) => p && typeof p.name === "string" && p.name.trim() !== ""),
    componentIds: form.getAll("componentIds").map(String),
  });
  return parsed.success ? { ok: true, data: parsed.data } : { ok: false, fieldErrors: fieldErrors(parsed.error) };
}

/** Fichiers joints (factures, photos) : nombre, taille et type contrôlés. */
export async function readDocumentUploads(form: FormData, field = "files"): Promise<{ files: ParsedUpload[] } | { error: string }> {
  const entries = form.getAll(field).filter((f): f is File => f instanceof File && f.size > 0);
  if (entries.length > MAX_FILES_PER_UPLOAD) return { error: `${MAX_FILES_PER_UPLOAD} fichiers maximum par envoi.` };
  const files: ParsedUpload[] = [];
  for (const file of entries) {
    const check = await checkUpload(file, DOCUMENT_TYPES, MAX_DOCUMENT_BYTES);
    if (!check.ok) return { error: `${file.name} : ${check.error}` };
    files.push({ bytes: check.bytes, type: check.type, fileName: safeFileName(file.name), size: file.size });
  }
  return { files };
}
