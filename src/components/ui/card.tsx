import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "./cn";

export function Card({ className, children, as: Tag = "section", ...rest }: { className?: string; children: ReactNode; as?: "section" | "div" | "article"; "aria-labelledby"?: string }) {
  return (
    <Tag className={cn("card", className)} {...rest}>
      {children}
    </Tag>
  );
}

export function CardHeader({
  icon: Icon,
  title,
  subtitle,
  action,
  id,
  level = 2,
}: {
  icon?: LucideIcon;
  title: ReactNode;
  subtitle?: ReactNode;
  action?: ReactNode;
  id?: string;
  level?: 2 | 3;
}) {
  const H = level === 2 ? "h2" : "h3";
  return (
    <div className="flex items-start gap-3 p-4 pb-3 sm:p-5 sm:pb-3">
      {Icon && (
        <span className="grid size-9 shrink-0 place-items-center rounded-lg border border-line-strong bg-surface-2 text-ink-2" aria-hidden>
          <Icon size={18} strokeWidth={1.75} />
        </span>
      )}
      <div className="min-w-0 flex-1">
        <H id={id} className="text-[0.98rem] font-semibold tracking-tight text-ink">
          {title}
        </H>
        {subtitle && <p className="mt-0.5 text-[0.8rem] text-muted">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
