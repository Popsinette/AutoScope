"use client";

import { useState, useTransition } from "react";
import type { FieldErrors } from "@/lib/validation";

export type FormState = { error?: string; fieldErrors?: FieldErrors } | undefined;

/**
 * Exécute une server action sans la réinitialisation automatique des formulaires
 * de React 19 : les saisies sont conservées quand la validation échoue.
 */
export function useFormAction(action: (form: FormData) => Promise<FormState>) {
  const [state, setState] = useState<FormState>();
  const [pending, start] = useTransition();
  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    start(async () => {
      const result = await action(form);
      setState(result);
      if (result?.error || result?.fieldErrors) {
        requestAnimationFrame(() => document.querySelector<HTMLElement>("[aria-invalid='true'], [role='alert']")?.focus?.());
      }
    });
  };
  return { state, pending, onSubmit, fe: state?.fieldErrors ?? {} };
}
