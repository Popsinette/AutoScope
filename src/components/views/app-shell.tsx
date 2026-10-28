import Link from "next/link";
import { Suspense, type ReactNode } from "react";
import { ChevronRight } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { MobileNav } from "@/components/shell/mobile-nav";
import { SidebarNav } from "@/components/shell/sidebar-nav";
import { VehicleSwitcher } from "@/components/shell/vehicle-switcher";
import { Notice } from "@/components/ui/notice";
import { formatKm } from "@/lib/format";
import { vehicleLabel } from "@/lib/vehicle";

export interface ShellVehicle {
  id: string;
  make: string;
  model: string;
  trim: string | null;
  year: number;
  mileage: number;
  isDemo: boolean;
}

/** Coquille commune (application serveur et démo hors ligne). */
export function AppShell({
  userName,
  userTitle,
  vehicles,
  selected,
  alertCount,
  select,
  account,
  banner,
  photo,
  children,
}: {
  userName: string;
  userTitle?: string;
  vehicles: ShellVehicle[];
  selected: ShellVehicle | null;
  alertCount: number;
  select: (vehicleId: string) => Promise<unknown>;
  account: ReactNode;
  banner?: ReactNode;
  photo?: ReactNode;
  children: ReactNode;
}) {
  const options = vehicles.map((v) => ({ id: v.id, label: `${vehicleLabel(v)}${v.isDemo ? " (démo)" : ""}` }));
  return (
    <div className="lg:grid lg:grid-cols-[248px_1fr]">
      <a href="#contenu" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-lg focus:bg-accent focus:px-3 focus:py-2">
        Aller au contenu
      </a>
      <aside className="sticky top-0 hidden h-dvh flex-col gap-6 overflow-y-auto border-r border-line bg-surface/60 px-3 py-5 lg:flex">
        <Link href="/tableau-de-bord" className="px-3" aria-label="CarView — accueil">
          <Logo />
        </Link>
        <SidebarNav alertCount={alertCount} />
        <div className="mt-auto flex flex-col gap-2">
          {selected && (
            <Link href={`/garage/${selected.id}`} className="group overflow-hidden rounded-xl border border-line bg-surface-2 hover:border-line-strong">
              <div className="aspect-[16/8] overflow-hidden bg-bg">{photo}</div>
              <div className="flex items-center gap-2 px-3 py-2">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[0.8rem] font-medium">{vehicleLabel(selected)}</p>
                  <p className="text-[0.7rem] text-muted">
                    {selected.year} · {formatKm(selected.mileage)}
                  </p>
                </div>
                <ChevronRight size={16} className="text-muted group-hover:text-ink" aria-hidden />
              </div>
            </Link>
          )}
          <div className="flex items-center justify-between px-1">
            <p className="truncate px-2 text-xs text-muted" title={userTitle}>
              {userName}
            </p>
            {account}
          </div>
        </div>
      </aside>

      <div className="min-w-0">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-line bg-bg/85 px-4 backdrop-blur sm:px-6">
          <Link href="/tableau-de-bord" className="lg:hidden" aria-label="CarView — accueil">
            <Logo tagline={false} className="[&>span]:text-lg" />
          </Link>
          <div className="ml-auto flex min-w-0 items-center gap-2">
            <Suspense>
              <VehicleSwitcher vehicles={options} selectedId={selected?.id ?? null} select={select} />
            </Suspense>
            <div className="lg:hidden">{account}</div>
          </div>
        </header>
        {banner}
        <main id="contenu" className="mx-auto w-full max-w-[1400px] px-4 pb-28 pt-5 sm:px-6 lg:pb-12 lg:pt-7">
          {children}
        </main>
      </div>
      <MobileNav alertCount={alertCount} />
      <Suspense>
        <Notice />
      </Suspense>
    </div>
  );
}
