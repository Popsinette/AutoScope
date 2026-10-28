"use client";

import { AlertTriangle } from "lucide-react";
import { useActionState, useRef, type ReactNode } from "react";
import { Button } from "./button";
import { SubmitButton } from "./submit-button";

export type SimpleActionState = { error?: string } | undefined;

/**
 * Bouton ouvrant une boîte de confirmation (dialog natif, accessible au clavier)
 * avant d'exécuter une server action destructive.
 */
export function ConfirmAction({
  action,
  fields = {},
  trigger,
  title,
  children,
  confirmLabel = "Supprimer",
  triggerVariant = "danger",
  triggerSize = "sm",
}: {
  action: (state: SimpleActionState, form: FormData) => Promise<SimpleActionState>;
  fields?: Record<string, string>;
  trigger: ReactNode;
  title: string;
  children?: ReactNode;
  confirmLabel?: string;
  triggerVariant?: "danger" | "secondary" | "ghost";
  triggerSize?: "sm" | "md";
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [state, formAction] = useActionState(action, undefined);
  return (
    <>
      <Button variant={triggerVariant} size={triggerSize} onClick={() => dialog.current?.showModal()}>
        {trigger}
      </Button>
      <dialog
        ref={dialog}
        aria-labelledby="confirm-title"
        className="card m-auto w-[min(92vw,440px)] p-0 text-ink backdrop:bg-black/60"
      >
        <form action={formAction} className="p-5">
          {Object.entries(fields).map(([name, value]) => (
            <input key={name} type="hidden" name={name} value={value} />
          ))}
          <div className="flex gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-danger/10 text-danger" aria-hidden>
              <AlertTriangle size={20} />
            </span>
            <div>
              <h2 id="confirm-title" className="font-semibold">
                {title}
              </h2>
              {children && <div className="mt-1 text-sm text-muted">{children}</div>}
              {state?.error && (
                <p role="alert" className="mt-2 text-sm text-danger">
                  {state.error}
                </p>
              )}
            </div>
          </div>
          <div className="mt-5 flex justify-end gap-2">
            <Button variant="secondary" onClick={() => dialog.current?.close()}>
              Annuler
            </Button>
            <SubmitButton className="bg-danger! hover:bg-danger/85!" pendingLabel="Suppression…">
              {confirmLabel}
            </SubmitButton>
          </div>
        </form>
      </dialog>
    </>
  );
}
