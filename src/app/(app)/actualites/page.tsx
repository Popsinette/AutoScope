import { Newspaper } from "lucide-react";
import { ComingSoon } from "@/components/coming-soon";

export const metadata = { title: "Actualités" };

export default function Page() {
  return (
    <ComingSoon
      title="Actualités"
      icon={Newspaper}
      intro="Sélection d’articles et de nouveautés liés à vos véhicules."
      planned={["Agrégation de sources identifiées (flux RSS d’éditeurs autorisés).", "Filtrage selon les marques de votre garage."]}
      safeguards={["Chaque article citera sa source et renverra vers l’original.", "Aucun contenu inventé."]}
    />
  );
}
