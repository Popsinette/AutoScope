"use client";

import { CheckCircle2, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

const MESSAGES: Record<string, string> = {
  "vehicule-cree": "Véhicule ajouté à votre garage.",
  "vehicule-modifie": "Véhicule mis à jour.",
  "vehicule-supprime": "Véhicule supprimé.",
  "entretien-cree": "Intervention enregistrée. Les dépenses ont été mises à jour.",
  "entretien-modifie": "Intervention modifiée. La dépense liée a été recalculée.",
  "entretien-supprime": "Intervention supprimée ainsi que sa dépense liée.",
  "depense-creee": "Dépense enregistrée.",
  "depense-modifiee": "Dépense modifiée.",
  "depense-supprimee": "Dépense supprimée.",
  "echeance-creee": "Échéance créée.",
  "echeance-modifiee": "Échéance modifiée.",
  "echeance-supprimee": "Échéance supprimée.",
  "document-ajoute": "Document ajouté.",
  "document-supprime": "Document supprimé.",
  "modele-importe": "Modèle importé. Associez maintenant ses objets aux composants.",
  "correspondances-enregistrees": "Correspondances enregistrées.",
};

/** Message de confirmation affiché après une action (paramètre ?ok=…). */
export function Notice() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const key = params.get("ok");
  const [visible, setVisible] = useState<string | null>(null);

  useEffect(() => {
    if (!key || !MESSAGES[key]) return;
    setVisible(MESSAGES[key]);
    const next = new URLSearchParams(params);
    next.delete("ok");
    router.replace(next.size ? `${pathname}?${next}` : pathname, { scroll: false });
    const timer = setTimeout(() => setVisible(null), 6000);
    return () => clearTimeout(timer);
  }, [key, params, pathname, router]);

  if (!visible) return null;
  return (
    <div role="status" className="fixed inset-x-4 bottom-24 z-50 mx-auto flex max-w-md items-center gap-3 rounded-xl border border-ok/30 bg-surface-2 px-4 py-3 text-sm shadow-2xl lg:bottom-6">
      <CheckCircle2 className="shrink-0 text-ok" size={18} aria-hidden />
      <span className="flex-1">{visible}</span>
      <button type="button" onClick={() => setVisible(null)} className="text-muted hover:text-ink" aria-label="Fermer le message">
        <X size={16} />
      </button>
    </div>
  );
}
