import { redirect } from "next/navigation";
import { CarSilhouette } from "@/components/brand/car-silhouette";
import { Logo } from "@/components/brand/logo";
import { getSession } from "@/server/session";

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  if (await getSession()) redirect("/tableau-de-bord");
  return (
    <main className="grid min-h-dvh lg:grid-cols-[1.1fr_1fr]">
      <div className="relative hidden flex-col justify-between overflow-hidden border-r border-line bg-[radial-gradient(800px_400px_at_30%_70%,rgb(217_38_28/0.18),transparent_60%)] p-10 lg:flex">
        <Logo />
        <div>
          <CarSilhouette className="mx-auto max-w-xl drop-shadow-[0_30px_40px_rgba(0,0,0,0.6)]" accent />
          <p className="mt-10 max-w-md text-3xl font-semibold leading-tight tracking-tight">
            Votre voiture, <span className="text-accent-ink">sous toutes ses facettes.</span>
          </p>
          <p className="mt-3 max-w-md text-sm text-muted">
            Garage numérique, carnet d’entretien, dépenses, documents et exploration 3D des composants.
          </p>
        </div>
        <p className="eyebrow">Plus qu’une application, une passion</p>
      </div>
      <div className="flex items-center justify-center p-5 sm:p-10">
        <div className="w-full max-w-sm">
          <Logo className="mb-8 lg:hidden" />
          {children}
        </div>
      </div>
    </main>
  );
}
