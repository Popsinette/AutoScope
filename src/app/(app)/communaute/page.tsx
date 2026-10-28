import { Users } from "lucide-react";
import { ComingSoon } from "@/components/coming-soon";

export const metadata = { title: "Communauté" };

export default function Page() {
  return (
    <ComingSoon
      title="Communauté"
      icon={Users}
      intro="Échanger avec d’autres passionnés : sorties, préparations, tutoriels."
      planned={["Profil public distinct du garage privé.", "Publications avec photos choisies explicitement.", "Modération et signalement."]}
      safeguards={["Rien du garage (documents, VIN, immatriculation, kilométrage, dépenses) n’est publié automatiquement.", "Chaque partage sera une action volontaire et réversible."]}
    />
  );
}
