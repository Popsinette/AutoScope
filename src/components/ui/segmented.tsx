import Link from "next/link";
import { cn } from "./cn";

/** Groupe de filtres sous forme de liens (état conservé dans l'URL). */
export function SegmentedLinks({ items, label }: { items: { href: string; label: string; active: boolean; count?: number }[]; label: string }) {
  return (
    <nav aria-label={label} className="relative -mx-1 min-w-0 max-w-full overflow-x-auto px-1">
      <ul className="flex w-max gap-1 rounded-[11px] border border-line bg-bg/60 p-1">
        {items.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              aria-current={item.active ? "page" : undefined}
              className={cn(
                "flex h-8 items-center gap-1.5 rounded-lg px-3 text-[0.8rem] font-medium transition-colors",
                item.active ? "bg-accent text-white" : "text-ink-2 hover:bg-surface-2 hover:text-ink",
              )}
            >
              {item.label}
              {item.count !== undefined && <span className={cn("tabular-nums text-[0.7rem]", item.active ? "text-white/80" : "text-muted")}>{item.count}</span>}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
