import { Database, Download, RotateCcw, Trash2 } from "lucide-react";
import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { ConfirmAction, type SimpleActionState } from "@/components/ui/confirm-action";
import { PageHeader } from "@/components/ui/page-header";
import { useDemo } from "../hooks";
import { seedDemo } from "../store/seed";

export function SettingsPage() {
  const store = useDemo();
  const navigate = useNavigate();
  const { vehicles, documents, interventions } = store.data;

  const reset = async (): Promise<SimpleActionState> => {
    await store.reset(seedDemo);
    navigate("/tableau-de-bord");
    return undefined;
  };
  const wipe = async (): Promise<SimpleActionState> => {
    await store.wipe();
    navigate("/tableau-de-bord");
    return undefined;
  };
  const exportJson = () => {
    const url = URL.createObjectURL(new Blob([JSON.stringify({ exportedAt: new Date().toISOString(), format: "carview-demo-v1", ...store.data }, null, 2)], { type: "application/json" }));
    const a = Object.assign(document.createElement("a"), { href: url, download: `carview-demo-${new Date().toISOString().slice(0, 10)}.json` });
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <>
      <PageHeader title="Paramètres de la démo" subtitle="Version hors ligne : pas de compte, aucune donnée envoyée sur Internet." />
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader icon={Database} title="Où sont mes données ?" />
          <div className="flex flex-col gap-2 px-5 pb-5 text-sm text-ink-2">
            <p>
              Tout est enregistré dans ce navigateur, sur cet appareil : {vehicles.length} véhicule(s), {interventions.length} intervention(s), {documents.length} document(s).
            </p>
            <p className="text-muted">Effacer les données du site dans le navigateur supprime la démo. La version complète (comptes, synchronisation, stockage serveur) se déploie à part : voir le README du dépôt.</p>
          </div>
        </Card>
        <Card>
          <CardHeader icon={Download} title="Exporter" subtitle="Fichier JSON des enregistrements (hors contenu des fichiers)." />
          <div className="px-5 pb-5">
            <Button variant="secondary" onClick={exportJson}>
              <Download size={15} aria-hidden /> Télécharger l’export
            </Button>
          </div>
        </Card>
        <Card>
          <CardHeader icon={RotateCcw} title="Réinitialiser la démo" subtitle="Remet le garage de démonstration d’origine." />
          <div className="px-5 pb-5">
            <ConfirmAction action={reset} title="Réinitialiser la démo ?" confirmLabel="Réinitialiser" triggerVariant="secondary" triggerSize="md" trigger={<><RotateCcw size={15} aria-hidden /> Réinitialiser</>}>
              Vos modifications seront remplacées par le jeu de démonstration.
            </ConfirmAction>
          </div>
        </Card>
        <Card>
          <CardHeader icon={Trash2} title="Partir de zéro" subtitle="Efface toutes les données de ce navigateur." />
          <div className="px-5 pb-5">
            <ConfirmAction action={wipe} title="Effacer toutes les données ?" confirmLabel="Tout effacer" triggerSize="md" trigger={<><Trash2 size={15} aria-hidden /> Tout effacer</>}>
              Véhicules, entretiens, dépenses, échéances, documents et modèles 3D seront supprimés de ce navigateur.
            </ConfirmAction>
          </div>
        </Card>
      </div>
    </>
  );
}
