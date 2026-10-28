import { cn } from "../ui/cn";

export function Logo({ className, tagline = true }: { className?: string; tagline?: boolean }) {
  return (
    <span className={cn("inline-flex flex-col leading-none", className)}>
      <span className="text-[1.35rem] font-bold tracking-tight">
        <span className="text-accent">Car</span>
        <span className="text-ink">View</span>
      </span>
      {tagline && <span className="mt-1 text-[0.52rem] font-medium uppercase tracking-[0.32em] text-muted">Conduit par la passion</span>}
    </span>
  );
}
