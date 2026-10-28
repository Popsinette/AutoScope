import type { LucideIcon } from "lucide-react";
import { Construction } from "lucide-react";
import { Card } from "./ui/card";
import { PageHeader } from "./ui/page-header";

/** Module secondaire non encore disponible : affichage explicite, aucune donnée factice. */
export function ComingSoon({ title, icon: Icon, intro, planned, safeguards }: { title: string; icon: LucideIcon; intro: string; planned: string[]; safeguards: string[] }) {
  return (
    <>
      <PageHeader title={title} subtitle="Module en préparation" />
      <Card className="max-w-3xl p-6">
        <div className="flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded-xl border border-line-strong bg-surface-2 text-ink-2" aria-hidden>
            <Icon size={20} />
          </span>
          <p className="flex items-center gap-2 text-sm font-medium text-warn">
            <Construction size={16} aria-hidden /> Pas encore disponible
          </p>
        </div>
        <p className="mt-4 text-sm text-ink-2">{intro}</p>
        <h2 className="mt-5 text-sm font-semibold">Prévu</h2>
        <ul className="mt-2 list-disc pl-5 text-sm text-ink-2">
          {planned.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ul>
        <h2 className="mt-5 text-sm font-semibold">Engagements</h2>
        <ul className="mt-2 list-disc pl-5 text-sm text-ink-2">
          {safeguards.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ul>
      </Card>
    </>
  );
}
