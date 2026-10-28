"use client";

import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { FormError } from "@/components/ui/form-error";

export function DeleteAccount({ email }: { email: string }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const router = useRouter();
  const [error, setError] = useState<string>();
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    if (String(form.get("confirm")).trim().toLowerCase() !== email.toLowerCase()) {
      setError("Saisissez exactement votre adresse e-mail pour confirmer.");
      return;
    }
    setPending(true);
    setError(undefined);
    const result = await authClient.deleteUser({ password: String(form.get("password") ?? "") });
    setPending(false);
    if (result.error) {
      setError(result.error.code === "INVALID_PASSWORD" ? "Mot de passe incorrect." : "La suppression a échoué. Reconnectez-vous puis réessayez.");
      return;
    }
    router.replace("/connexion");
    router.refresh();
  }

  return (
    <>
      <Button variant="danger" onClick={() => dialog.current?.showModal()}>
        <Trash2 size={15} aria-hidden /> Supprimer mon compte
      </Button>
      <dialog ref={dialog} aria-labelledby="delete-account-title" className="card m-auto w-[min(92vw,460px)] p-0 text-ink">
        <form onSubmit={onSubmit} className="flex flex-col gap-4 p-5">
          <h2 id="delete-account-title" className="font-semibold">
            Supprimer définitivement le compte ?
          </h2>
          <p className="text-sm text-muted">Véhicules, entretiens, dépenses, échéances, documents et modèles 3D seront effacés. Cette action est irréversible.</p>
          <FormError message={error} />
          <Field label={`Saisissez « ${email} »`} htmlFor="confirm" required>
            <Input id="confirm" name="confirm" autoComplete="off" required />
          </Field>
          <Field label="Mot de passe" htmlFor="delete-password" required>
            <Input id="delete-password" name="password" type="password" autoComplete="current-password" required />
          </Field>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => dialog.current?.close()}>
              Annuler
            </Button>
            <Button type="submit" disabled={pending} className="bg-danger! hover:bg-danger/85!">
              {pending ? "Suppression…" : "Supprimer définitivement"}
            </Button>
          </div>
        </form>
      </dialog>
    </>
  );
}
