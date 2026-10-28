import "server-only";
import { cache } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "./auth";

export const getSession = cache(async () => {
  return auth.api.getSession({ headers: await headers() });
});

/** Retourne l'utilisateur connecté ou redirige vers la connexion. */
export async function requireUser() {
  const session = await getSession();
  if (!session) redirect("/connexion");
  return session.user;
}

/** Variante pour les route handlers : null si non connecté. */
export async function getUserOrNull() {
  const session = await getSession();
  return session?.user ?? null;
}
