/**
 * Contrôle des fichiers envoyés : le type est déterminé par la signature binaire
 * (magic bytes), jamais par l'extension ou le type annoncé par le navigateur.
 */
export type DetectedType = "application/pdf" | "image/jpeg" | "image/png" | "image/webp" | "model/gltf-binary";

export const MAX_DOCUMENT_BYTES = 10 * 1024 * 1024;
export const MAX_PHOTO_BYTES = 8 * 1024 * 1024;
export const MAX_MODEL_BYTES = 60 * 1024 * 1024;

export const DOCUMENT_TYPES: DetectedType[] = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
export const PHOTO_TYPES: DetectedType[] = ["image/jpeg", "image/png", "image/webp"];

const startsWith = (bytes: Uint8Array, sig: number[], offset = 0) =>
  sig.every((b, i) => bytes[offset + i] === b);

export function detectFileType(bytes: Uint8Array): DetectedType | null {
  if (startsWith(bytes, [0x25, 0x50, 0x44, 0x46, 0x2d])) return "application/pdf"; // %PDF-
  if (startsWith(bytes, [0xff, 0xd8, 0xff])) return "image/jpeg";
  if (startsWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return "image/png";
  if (startsWith(bytes, [0x52, 0x49, 0x46, 0x46]) && startsWith(bytes, [0x57, 0x45, 0x42, 0x50], 8)) return "image/webp";
  if (startsWith(bytes, [0x67, 0x6c, 0x54, 0x46])) return "model/gltf-binary"; // glTF
  return null;
}

export type FileCheck =
  | { ok: true; type: DetectedType; bytes: Uint8Array }
  | { ok: false; error: string };

export async function checkUpload(
  file: File,
  allowed: DetectedType[],
  maxBytes: number,
): Promise<FileCheck> {
  if (file.size === 0) return { ok: false, error: "Le fichier est vide." };
  if (file.size > maxBytes) {
    return { ok: false, error: `Fichier trop volumineux (maximum ${Math.round(maxBytes / 1024 / 1024)} Mo).` };
  }
  const bytes = new Uint8Array(await file.arrayBuffer());
  const type = detectFileType(bytes);
  if (!type || !allowed.includes(type)) {
    return { ok: false, error: "Type de fichier non accepté." };
  }
  return { ok: true, type, bytes };
}

/** Nettoie un nom de fichier pour l'en-tête Content-Disposition. */
export function safeFileName(name: string) {
  const cleaned = name.normalize("NFKD").replace(/[^\w.\- ]+/g, "").trim().slice(0, 120);
  return cleaned || "document";
}
