import { Gauge } from "lucide-react";
import { ComingSoon } from "@/components/coming-soon";

export const metadata = { title: "Performances" };

export default function Page() {
  return (
    <ComingSoon
      title="Performances"
      icon={Gauge}
      intro="Journal de trajets et de sessions circuit saisis manuellement : temps au tour, conditions, réglages, remarques."
      planned={["Saisie manuelle des trajets et sessions circuit, rattachés à un véhicule.", "Comparaison de vos propres temps entre sessions.", "Import de fichiers de chronométrage exportés par vos outils (formats ouverts)."]}
      safeguards={["Aucune télémétrie ni connexion OBD simulée : seules vos saisies seront affichées.", "Les données de démonstration seront signalées comme telles."]}
    />
  );
}
