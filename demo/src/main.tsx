import "@fontsource-variable/inter";
import "./main.css";
import { StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Navigate, Route, Routes } from "react-router";
import { CalendarDays, Gauge, Newspaper, Users } from "lucide-react";
import { ComingSoon } from "@/components/coming-soon";
import { DemoLayout } from "./layout";
import { CatalogPage, DashboardPage, EditVehiclePage, GaragePage, NewVehiclePage, VehiclePage } from "./pages/core";
import { NotFound } from "./pages/not-found";
import {
  DocumentsPage,
  EditExpensePage,
  EditInterventionPage,
  EditReminderPage,
  ExpensesPage,
  InterventionPage,
  InterventionsPage,
  NewInterventionPage,
  RemindersPage,
} from "./pages/records";
import { SettingsPage } from "./pages/settings";
import { ImportModelPage, MappingPage, ViewerPage } from "./pages/viewer";
import { demoStore } from "./store";
import { seedDemo } from "./store/seed";

function App() {
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  useEffect(() => {
    demoStore.init(seedDemo).then(
      () => setState("ready"),
      (error) => {
        console.error(error);
        setState("error");
      },
    );
  }, []);
  if (state === "loading") {
    return (
      <p role="status" className="grid min-h-dvh place-items-center text-sm text-muted">
        Chargement de la démo…
      </p>
    );
  }
  if (state === "error") {
    return (
      <p role="alert" className="grid min-h-dvh place-items-center p-6 text-center text-sm text-danger">
        Le stockage local du navigateur est indisponible (navigation privée ?). La démo ne peut pas démarrer.
      </p>
    );
  }
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, "")}>
      <Routes>
        <Route element={<DemoLayout />}>
          <Route index element={<Navigate to="/tableau-de-bord" replace />} />
          <Route path="tableau-de-bord" element={<DashboardPage />} />
          <Route path="garage" element={<GaragePage />} />
          <Route path="garage/nouveau" element={<NewVehiclePage />} />
          <Route path="garage/:id" element={<VehiclePage />} />
          <Route path="garage/:id/modifier" element={<EditVehiclePage />} />
          <Route path="vue-3d" element={<ViewerPage />} />
          <Route path="vue-3d/import" element={<ImportModelPage />} />
          <Route path="vue-3d/correspondances/:id" element={<MappingPage />} />
          <Route path="entretiens" element={<InterventionsPage />} />
          <Route path="entretiens/nouveau" element={<NewInterventionPage />} />
          <Route path="entretiens/:id" element={<InterventionPage />} />
          <Route path="entretiens/:id/modifier" element={<EditInterventionPage />} />
          <Route path="echeances" element={<RemindersPage />} />
          <Route path="echeances/:id/modifier" element={<EditReminderPage />} />
          <Route path="depenses" element={<ExpensesPage />} />
          <Route path="depenses/:id/modifier" element={<EditExpensePage />} />
          <Route path="documents" element={<DocumentsPage />} />
          <Route path="catalogue" element={<CatalogPage />} />
          <Route path="parametres" element={<SettingsPage />} />
          <Route
            path="performances"
            element={<ComingSoon title="Performances" icon={Gauge} intro="Journal de trajets et de sessions circuit saisis manuellement." planned={["Saisie manuelle des trajets et sessions circuit.", "Comparaison de vos propres temps."]} safeguards={["Aucune télémétrie ni connexion OBD simulée."]} />}
          />
          <Route
            path="communaute"
            element={<ComingSoon title="Communauté" icon={Users} intro="Échanger avec d’autres passionnés." planned={["Profil public distinct du garage privé."]} safeguards={["Rien du garage n’est publié automatiquement."]} />}
          />
          <Route
            path="evenements"
            element={<ComingSoon title="Événements" icon={CalendarDays} intro="Trackdays, rassemblements et sorties." planned={["Agenda filtrable par région."]} safeguards={["Aucun événement fictif présenté comme réel."]} />}
          />
          <Route
            path="actualites"
            element={<ComingSoon title="Actualités" icon={Newspaper} intro="Articles liés à vos véhicules." planned={["Sources identifiées et citées."]} safeguards={["Aucun contenu inventé."]} />}
          />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
