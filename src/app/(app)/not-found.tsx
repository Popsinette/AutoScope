import { SearchX } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

export default function NotFound() {
  return (
    <div className="card">
      <EmptyState icon={SearchX} title="Élément introuvable" action={<ButtonLink href="/tableau-de-bord">Retour à l’accueil</ButtonLink>}>
        Cette page n’existe pas ou vous n’avez pas accès à cette ressource.
      </EmptyState>
    </div>
  );
}
