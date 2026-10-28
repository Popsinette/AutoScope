import "server-only";
import { ForbiddenActionError, NotFoundError } from "@/server/errors";

/** Traduit les erreurs connues en message utilisateur ; journalise les autres sans fuite de détails. */
export function actionError(error: unknown): { error: string } {
  if (error instanceof NotFoundError || error instanceof ForbiddenActionError) return { error: error.message };
  console.error(error);
  return { error: "Une erreur inattendue est survenue. Réessayez." };
}

export function isRedirect(error: unknown) {
  return typeof error === "object" && error !== null && "digest" in error && String((error as { digest: unknown }).digest).startsWith("NEXT_REDIRECT");
}
