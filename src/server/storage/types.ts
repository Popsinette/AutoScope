/**
 * Interface de stockage des fichiers privés (documents, photos, modèles 3D).
 * L'implémentation locale sert au développement ; en production, fournir une
 * implémentation équivalente (S3, GCS, Azure Blob…) et la sélectionner dans index.ts.
 */
export interface FileStorage {
  put(key: string, data: Uint8Array, contentType: string): Promise<void>;
  get(key: string): Promise<Uint8Array | null>;
  delete(key: string): Promise<void>;
  deletePrefix(prefix: string): Promise<void>;
}
