import { Info, RotateCcw } from "lucide-react";
import { useEffect } from "react";
import { Link, Outlet, useLocation } from "react-router";
import { AppShell } from "@/components/views/app-shell";
import { VehiclePhoto } from "@/components/vehicles/vehicle-photo";
import { useDemoActions } from "./actions";
import { photoSrc, useDemo } from "./hooks";

/** Défilement vers l'ancre (#ajouter…) et en haut de page à chaque navigation. */
function ScrollManager() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) document.getElementById(hash.slice(1))?.scrollIntoView();
    else window.scrollTo(0, 0);
  }, [pathname, hash]);
  return null;
}

export function DemoLayout() {
  const store = useDemo();
  const actions = useDemoActions();
  const selected = store.resolveSelected();
  return (
    <AppShell
      userName="Visiteur (démo)"
      vehicles={store.data.vehicles}
      selected={selected}
      alertCount={store.alertCount()}
      select={actions.select}
      photo={selected ? <VehiclePhoto vehicle={selected} src={photoSrc(selected)} /> : null}
      account={
        <Link to="/parametres" className="flex h-9 items-center gap-2 rounded-[10px] px-3 text-[0.82rem] text-ink-2 hover:bg-surface-2 hover:text-ink" aria-label="Réinitialiser ou effacer la démo">
          <RotateCcw size={16} aria-hidden />
        </Link>
      }
      banner={
        <p className="flex items-center gap-2 border-b border-info/20 bg-info/10 px-4 py-2 text-[0.78rem] text-info sm:px-6">
          <Info size={14} className="shrink-0" aria-hidden />
          <span>
            Démo hors ligne : aucune donnée n’est envoyée, tout reste dans ce navigateur.{" "}
            <Link to="/parametres" className="underline">
              Réinitialiser
            </Link>
          </span>
        </p>
      }
    >
      <ScrollManager />
      <Outlet />
    </AppShell>
  );
}
