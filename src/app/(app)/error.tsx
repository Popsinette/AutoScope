"use client";

import { TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

export default function AppError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="card">
      <EmptyState icon={TriangleAlert} title="Une erreur est survenue" action={<Button onClick={reset}>Réessayer</Button>}>
        Le chargement de cette page a échoué. Vos données n’ont pas été modifiées.
      </EmptyState>
    </div>
  );
}
