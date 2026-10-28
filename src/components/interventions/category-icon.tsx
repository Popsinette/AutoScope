import { BatteryCharging, CircleDot, ClipboardCheck, Disc3, Droplet, Hammer, Settings2, Wrench, type LucideIcon } from "lucide-react";
import type { InterventionCategory } from "@/generated/prisma/enums";

const ICONS: Record<InterventionCategory, LucideIcon> = {
  VIDANGE: Droplet,
  REVISION: Settings2,
  FREINAGE: Disc3,
  PNEUS: CircleDot,
  BATTERIE: BatteryCharging,
  CONTROLE_TECHNIQUE: ClipboardCheck,
  REPARATION: Hammer,
  AUTRE: Wrench,
};

export function CategoryIcon({ category }: { category: InterventionCategory }) {
  const Icon = ICONS[category];
  return (
    <span className="grid size-10 shrink-0 place-items-center rounded-lg border border-accent/30 bg-accent-soft text-accent-ink" aria-hidden>
      <Icon size={18} strokeWidth={1.75} />
    </span>
  );
}
