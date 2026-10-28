import type { ReactNode } from "react";
import { cn } from "./cn";

export type Tone = "neutral" | "accent" | "ok" | "warn" | "info" | "danger";

const tones: Record<Tone, string> = {
  neutral: "bg-surface-3 text-ink-2 border-line-strong",
  accent: "bg-accent-soft text-accent-ink border-accent/40",
  ok: "bg-ok/10 text-ok border-ok/30",
  warn: "bg-warn/10 text-warn border-warn/30",
  info: "bg-info/10 text-info border-info/30",
  danger: "bg-danger/10 text-danger border-danger/30",
};

export function Badge({ tone = "neutral", children, className, title }: { tone?: Tone; children: ReactNode; className?: string; title?: string }) {
  return (
    <span title={title} className={cn("inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full border px-2 py-0.5 text-[0.7rem] font-medium leading-4", tones[tone], className)}>
      {children}
    </span>
  );
}

export function DemoBadge({ className }: { className?: string }) {
  return (
    <Badge tone="info" className={className} title="Données fictives du jeu de démonstration">
      Démo
    </Badge>
  );
}
