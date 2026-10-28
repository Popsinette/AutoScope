"use client";

import { Ellipsis, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { cn } from "../ui/cn";
import { MOBILE_TABS, NAV_ITEMS } from "./nav-items";

export function MobileNav({ alertCount }: { alertCount: number }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const tabs = NAV_ITEMS.filter((i) => MOBILE_TABS.includes(i.href));
  const more = NAV_ITEMS.filter((i) => !MOBILE_TABS.includes(i.href));
  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);
  const moreActive = more.some((i) => isActive(i.href));

  useEffect(() => {
    if (open) dialog.current?.showModal();
    else dialog.current?.close();
  }, [open]);
  useEffect(() => setOpen(false), [pathname]);

  return (
    <>
      <nav aria-label="Navigation principale" className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-bg/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
        <ul className="grid grid-cols-5">
          {tabs.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <li key={item.href}>
                <Link href={item.href} aria-current={active ? "page" : undefined} className={cn("flex h-16 flex-col items-center justify-center gap-1 text-[0.68rem]", active ? "text-accent-ink" : "text-muted")}>
                  <Icon size={21} strokeWidth={1.75} aria-hidden />
                  {item.label === "Mon garage" ? "Garage" : item.label}
                </Link>
              </li>
            );
          })}
          <li>
            <button type="button" onClick={() => setOpen(true)} aria-haspopup="dialog" className={cn("relative flex h-16 w-full flex-col items-center justify-center gap-1 text-[0.68rem]", moreActive ? "text-accent-ink" : "text-muted")}>
              <Ellipsis size={21} aria-hidden />
              Plus
              {alertCount > 0 && <span className="absolute right-[28%] top-2.5 size-2 rounded-full bg-accent" aria-label={`${alertCount} échéance(s) à traiter`} />}
            </button>
          </li>
        </ul>
      </nav>
      <dialog
        ref={dialog}
        onClose={() => setOpen(false)}
        aria-label="Plus de rubriques"
        className="mb-0 mt-auto w-full max-w-none rounded-t-2xl border-t border-line bg-surface p-0 text-ink lg:hidden"
      >
        <div className="flex items-center justify-between px-5 pb-2 pt-4">
          <p className="font-semibold">Toutes les rubriques</p>
          <button type="button" onClick={() => setOpen(false)} className="grid size-9 place-items-center rounded-full text-muted hover:bg-surface-2" aria-label="Fermer">
            <X size={18} />
          </button>
        </div>
        <ul className="grid grid-cols-3 gap-2 px-4 pb-[calc(1.25rem+env(safe-area-inset-bottom))]">
          {more.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Link href={item.href} aria-current={isActive(item.href) ? "page" : undefined} className={cn("flex flex-col items-center gap-1.5 rounded-xl border px-2 py-3 text-center text-xs", isActive(item.href) ? "border-accent bg-accent-soft text-ink" : "border-line bg-surface-2 text-ink-2")}>
                  <Icon size={20} strokeWidth={1.75} aria-hidden />
                  {item.label}
                  {item.href === "/echeances" && alertCount > 0 && <span className="rounded-full bg-accent px-1.5 text-[0.65rem] text-white">{alertCount}</span>}
                  {item.soon && <span className="text-[0.6rem] uppercase tracking-wider text-muted">bientôt</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </dialog>
    </>
  );
}
