import "server-only";
import { randomUUID } from "node:crypto";
import { LocalFileStorage } from "./local";
import type { FileStorage } from "./types";

let instance: FileStorage | undefined;

export function getStorage(): FileStorage {
  instance ??= new LocalFileStorage(process.env.STORAGE_DIR || "./storage");
  return instance;
}

export function newStorageKey(userId: string, kind: "documents" | "photos" | "models") {
  return `${userId}/${kind}/${randomUUID()}`;
}
