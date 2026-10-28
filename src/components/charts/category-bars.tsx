import { formatEuros } from "@/lib/format";

/** Répartition par catégorie : barres horizontales d'une seule teinte, valeurs en texte. */
export function CategoryBars({ rows }: { rows: { label: string; amountCents: number; share: number }[] }) {
  const max = Math.max(...rows.map((r) => r.amountCents), 1);
  return (
    <ul className="flex flex-col gap-3">
      {rows.map((r) => (
        <li key={r.label} className="grid grid-cols-[minmax(0,7.5rem)_1fr_auto] items-center gap-3 text-sm">
          <span className="truncate text-ink-2">{r.label}</span>
          <span className="h-2.5 overflow-hidden rounded-r bg-surface-3/60" aria-hidden>
            <span className="block h-full rounded-r-[4px] bg-accent" style={{ width: `${(r.amountCents / max) * 100}%` }} />
          </span>
          <span className="text-right tabular-nums">
            {formatEuros(r.amountCents)} <span className="ml-1 text-xs text-muted">{Math.round(r.share * 100)} %</span>
          </span>
        </li>
      ))}
    </ul>
  );
}
