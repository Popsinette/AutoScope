import { notFound } from "next/navigation";
import { deleteInterventionAction } from "@/app/actions/interventions";
import { InterventionDetailView } from "@/components/views/intervention-detail-view";
import { getIntervention } from "@/server/interventions";
import { requireUser } from "@/server/session";

export const metadata = { title: "Intervention" };

export default async function InterventionPage({ params }: PageProps<"/entretiens/[id]">) {
  const user = await requireUser();
  const { id } = await params;
  const intervention = await getIntervention(user.id, id);
  if (!intervention) notFound();
  return <InterventionDetailView intervention={intervention} deleteAction={deleteInterventionAction} />;
}
