import { saveMappingsAction } from "@/app/actions/models";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { MappingForm } from "@/components/models/mapping-form";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { listComponents } from "@/server/components";
import { prisma } from "@/server/db";
import { requireUser } from "@/server/session";

export const metadata = { title: "Correspondances du modèle 3D" };

export default async function MappingPage({ params }: PageProps<"/vue-3d/correspondances/[id]">) {
  const user = await requireUser();
  const { id } = await params;
  const model = await prisma.model3D.findFirst({
    where: { id, userId: user.id },
    include: { mappings: { include: { component: { select: { slug: true } } } }, vehicles: { select: { id: true } } },
  });
  if (!model) notFound();
  const components = await listComponents();
  const vehicleId = model.vehicles[0]?.id;
  return (
    <>
      <Link href={vehicleId ? `/vue-3d/import?v=${vehicleId}` : "/vue-3d"} className="mb-3 inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink">
        <ArrowLeft size={15} aria-hidden /> Modèle 3D
      </Link>
      <PageHeader title="Correspondances" subtitle={`${model.name} — associez chaque objet du fichier à une fiche composant.`} />
      <Card>
        <MappingForm
          action={saveMappingsAction}
          modelId={model.id}
          nodeNames={model.nodeNames}
          current={Object.fromEntries(model.mappings.map((m) => [m.nodeName, m.component.slug]))}
          components={components.map((c) => ({ slug: c.slug, name: c.name, family: c.family }))}
          viewHref={vehicleId ? `/vue-3d?v=${vehicleId}` : "/vue-3d"}
        />
      </Card>
    </>
  );
}
