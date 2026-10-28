import { Badge, type Tone } from "@/components/ui/badge";
import { STATUS_LABELS, type ReminderStatus } from "@/lib/reminders";

const TONES: Record<ReminderStatus, Tone> = { DEPASSE: "danger", PROCHE: "warn", A_VENIR: "info", REALISE: "ok" };

export function ReminderStatusBadge({ status }: { status: ReminderStatus }) {
  return <Badge tone={TONES[status]}>{STATUS_LABELS[status]}</Badge>;
}
