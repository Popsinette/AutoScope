import { Car, Plus } from "lucide-react";
import { ButtonLink } from "../ui/button";
import { EmptyState } from "../ui/empty-state";

export function NoVehicle({ what }: { what: string }) {
  return (
    <div className="card">
      <EmptyState
        icon={Car}
        title="Aucun véhicule dans votre garage"
        action={
          <ButtonLink href="/garage/nouveau">
            <Plus size={16} aria-hidden /> Ajouter un véhicule
          </ButtonLink>
        }
      >
        Ajoutez d’abord un véhicule pour gérer {what}.
      </EmptyState>
    </div>
  );
}
