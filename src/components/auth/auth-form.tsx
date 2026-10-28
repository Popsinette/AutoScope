"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { FormError } from "@/components/ui/form-error";

const ERRORS: Record<string, string> = {
  INVALID_EMAIL_OR_PASSWORD: "E-mail ou mot de passe incorrect.",
  USER_ALREADY_EXISTS: "Un compte existe déjà avec cet e-mail.",
  USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL: "Un compte existe déjà avec cet e-mail.",
  PASSWORD_TOO_SHORT: "Le mot de passe doit contenir au moins 10 caractères.",
  INVALID_EMAIL: "Adresse e-mail invalide.",
};

export function AuthForm({ mode }: { mode: "signin" | "signup" }) {
  const router = useRouter();
  const [error, setError] = useState<string>();
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(undefined);
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");
    setPending(true);
    try {
      const result =
        mode === "signup"
          ? await authClient.signUp.email({ email, password, name: String(form.get("name") ?? "").trim() || email.split("@")[0] })
          : await authClient.signIn.email({ email, password });
      if (result.error) {
        setError(
          ERRORS[result.error.code ?? ""] ??
            (result.error.status === 429 ? "Trop de tentatives, réessayez dans une minute." : "Une erreur est survenue. Réessayez."),
        );
        return;
      }
      router.replace("/tableau-de-bord");
      router.refresh();
    } catch {
      setError("Impossible de joindre le serveur. Vérifiez votre connexion.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{mode === "signup" ? "Créer un compte" : "Se connecter"}</h1>
        <p className="mt-1 text-sm text-muted">
          {mode === "signup" ? "Rejoignez CarView et centralisez vos véhicules." : "Heureux de vous revoir."}
        </p>
      </div>
      <FormError message={error} />
      {mode === "signup" && (
        <Field label="Prénom ou pseudo" htmlFor="name">
          <Input id="name" name="name" autoComplete="nickname" maxLength={60} />
        </Field>
      )}
      <Field label="E-mail" htmlFor="email" required>
        <Input id="email" name="email" type="email" autoComplete="email" required />
      </Field>
      <Field label="Mot de passe" htmlFor="password" required hint={mode === "signup" ? "10 caractères minimum." : undefined}>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete={mode === "signup" ? "new-password" : "current-password"}
          minLength={mode === "signup" ? 10 : undefined}
          required
        />
      </Field>
      <Button type="submit" disabled={pending} className="mt-1 h-11">
        {pending ? "Patientez…" : mode === "signup" ? "Créer mon compte" : "Se connecter"}
      </Button>
      <p className="text-center text-sm text-muted">
        {mode === "signup" ? (
          <>
            Déjà inscrit ?{" "}
            <Link href="/connexion" className="text-accent-ink hover:underline">
              Se connecter
            </Link>
          </>
        ) : (
          <>
            Pas encore de compte ?{" "}
            <Link href="/inscription" className="text-accent-ink hover:underline">
              Créer un compte
            </Link>
          </>
        )}
      </p>
      {mode === "signin" && (
        <p className="rounded-lg border border-line bg-surface px-3 py-2 text-xs text-muted">
          Compte de démonstration (données fictives) : <span className="text-ink-2">demo@example.com</span> /{" "}
          <span className="text-ink-2">demo-carview-2026</span>
        </p>
      )}
      <p className="text-center text-xs text-muted">Connexion via Google ou Apple : pas encore disponible.</p>
    </form>
  );
}
