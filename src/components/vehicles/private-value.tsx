"use client";

import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";

/** Valeur privée masquée par défaut à l'écran (VIN, immatriculation). */
export function PrivateValue({ value, label }: { value: string | null; label: string }) {
  const [shown, setShown] = useState(false);
  if (!value) return <span className="text-muted">Non renseigné</span>;
  return (
    <span className="inline-flex items-center gap-2">
      <span className="font-mono text-sm tracking-wide">{shown ? value : "•".repeat(Math.min(value.length, 12))}</span>
      <button type="button" onClick={() => setShown((s) => !s)} className="text-muted hover:text-ink" aria-label={`${shown ? "Masquer" : "Afficher"} ${label}`} aria-pressed={shown}>
        {shown ? <EyeOff size={15} /> : <Eye size={15} />}
      </button>
    </span>
  );
}
