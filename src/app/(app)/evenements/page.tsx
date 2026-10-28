import { CalendarDays } from "lucide-react";
import { ComingSoon } from "@/components/coming-soon";

export const metadata = { title: "Événements" };

export default function Page() {
  return (
    <ComingSoon
      title="Événements"
      icon={CalendarDays}
      intro="Trackdays, rassemblements et sorties proposés par les membres ou les organisateurs."
      planned={["Agenda filtrable par région et type d’événement.", "Inscription et liste de participants avec consentement."]}
      safeguards={["Aucun événement fictif ne sera présenté comme réel.", "La participation ne révèle pas les données de votre garage."]}
    />
  );
}
