import { useSyncExternalStore } from "react";
import { useSearchParams } from "react-router";
import { demoStore } from "./store";

/** Store de la démo ; le composant est re-rendu à chaque modification. */
export function useDemo() {
  useSyncExternalStore(demoStore.subscribe, demoStore.getRevision);
  return demoStore;
}

export function useParam(key: string) {
  const [params] = useSearchParams();
  return params.get(key) ?? undefined;
}

export const photoSrc = (v: { photoKey: string | null }) => demoStore.fileUrl(v.photoKey);
export const fileHref = (id: string) => demoStore.fileUrl(id) ?? "#";
