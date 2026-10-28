"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "../ui/cn";
import { NAV_ITEMS } from "./nav-items";

export function SidebarNav({ alertCount }: { alertCount: number }) {
  const pathname = usePathname();
  const groups = [
    { key: "main", label: "Mon véhicule" },
    { key: "secondary", label: "Passion (bientôt)" },
    { key: "account", label: "Compte" },
  ] as const;
  return (
    <nav aria-label="Navigation principale" className="flex flex-col gap-5">
      {groups.map((group) => (
        <div key={group.key}>
          <p className="eyebrow mb-1.5 px-3 text-[0.62rem]">{group.label}</p>
          <ul className="flex flex-col gap-0.5">
            {NAV_ITEMS.filter((i) => i.group === group.key).map((item) => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              const Icon = item.icon;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "group flex h-9 items-center gap-3 rounded-[10px] px-3 text-[0.86rem] transition-colors",
                      active ? "bg-accent text-white shadow-[0_8px_24px_-12px_rgb(217_38_28/0.9)]" : "text-ink-2 hover:bg-surface-2 hover:text-ink",
                    )}
                  >
                    <Icon size={17} strokeWidth={1.75} aria-hidden />
                    <span className="flex-1">{item.label}</span>
                    {item.href === "/echeances" && alertCount > 0 && (
                      <span className={cn("grid min-w-5 place-items-center rounded-full px-1.5 text-[0.68rem] font-semibold tabular-nums", active ? "bg-white text-accent" : "bg-accent text-white")}>
                        {alertCount}
                        <span className="sr-only"> échéance(s) à traiter</span>
                      </span>
                    )}
                    {item.soon && !active && <span className="text-[0.62rem] uppercase tracking-wider text-muted">bientôt</span>}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
