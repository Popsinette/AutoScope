import { Download, Lock, ShieldCheck, UserRound } from "lucide-react";
import { DeleteAccount } from "@/components/account/delete-account";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { formatDate } from "@/lib/format";
import { prisma } from "@/server/db";
import { requireUser } from "@/server/session";

export const metadata = { title: "Paramètres" };

export default async function SettingsPage() {
  const user = await requireUser();
  const [vehicles, documents] = await Promise.all([
    prisma.vehicle.count({ where: { userId: user.id } }),
    prisma.document.count({ where: { userId: user.id } }),
  ]);
  return (
    <>
      <PageHeader title="Paramètres" subtitle="Compte, confidentialité et données personnelles." />
      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader icon={UserRound} title="Compte" />
          <dl className="grid gap-3 px-5 pb-5 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-xs text-muted">Nom</dt>
              <dd>{user.name}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted">E-mail</dt>
              <dd>{user.email}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted">Inscription</dt>
              <dd>{formatDate(user.createdAt)}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted">Contenu</dt>
              <dd>
                {vehicles} véhicule(s), {documents} document(s)
              </dd>
            </div>
          </dl>
        </Card>
        <Card>
          <CardHeader icon={ShieldCheck} title="Confidentialité" />
          <ul className="flex flex-col gap-2 px-5 pb-5 text-sm text-ink-2">
            <li className="flex gap-2">
              <Lock size={15} className="mt-0.5 shrink-0 text-muted" aria-hidden /> Vos documents, photos, VIN et immatriculations sont privés : ils ne sont servis qu’à votre compte.
            </li>
            <li className="flex gap-2">
              <Lock size={15} className="mt-0.5 shrink-0 text-muted" aria-hidden /> Aucune donnée du garage n’est partagée avec une communauté ou un tiers.
            </li>
          </ul>
        </Card>
        <Card>
          <CardHeader icon={Download} title="Exporter mes données" subtitle="Fichier JSON contenant toutes vos données (hors contenu des fichiers)." />
          <div className="px-5 pb-5">
            <ButtonLink href="/api/compte/export" prefetch={false} variant="secondary">
              <Download size={15} aria-hidden /> Télécharger l’export
            </ButtonLink>
            <p className="mt-2 text-xs text-muted">Les dépenses s’exportent aussi en CSV depuis la page Dépenses ; chaque document se télécharge individuellement.</p>
          </div>
        </Card>
        <Card>
          <CardHeader title="Supprimer mon compte" subtitle="Efface toutes vos données et fichiers de façon définitive." />
          <div className="px-5 pb-5">
            <DeleteAccount email={user.email} />
          </div>
        </Card>
      </div>
    </>
  );
}
