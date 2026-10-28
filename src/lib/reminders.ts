/**
 * Calcul du statut des échéances (fonction pure, testée).
 * Une échéance peut avoir une date, un kilométrage, ou les deux : elle est
 * signalée dès que l'un des seuils est atteint (ou proche).
 */
export type ReminderStatus = "REALISE" | "DEPASSE" | "PROCHE" | "A_VENIR";

export const SOON_DAYS = 30;
export const SOON_KM = 1000;

export interface ReminderLike {
  dueDate: Date | null;
  dueMileage: number | null;
  completedAt: Date | null;
}

export interface ReminderEvaluation {
  status: ReminderStatus;
  daysLeft: number | null;
  kmLeft: number | null;
  /** Seuil ayant déclenché le statut (le plus urgent). */
  trigger: "date" | "km" | null;
}

const DAY_MS = 24 * 60 * 60 * 1000;

function startOfDayUTC(d: Date) {
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

export function evaluateReminder(
  reminder: ReminderLike,
  currentMileage: number,
  today: Date = new Date(),
): ReminderEvaluation {
  const daysLeft =
    reminder.dueDate === null ? null : Math.round((startOfDayUTC(reminder.dueDate) - startOfDayUTC(today)) / DAY_MS);
  const kmLeft = reminder.dueMileage === null ? null : reminder.dueMileage - currentMileage;

  if (reminder.completedAt) return { status: "REALISE", daysLeft, kmLeft, trigger: null };

  const dateOver = daysLeft !== null && daysLeft <= 0;
  const kmOver = kmLeft !== null && kmLeft <= 0;
  if (dateOver || kmOver) return { status: "DEPASSE", daysLeft, kmLeft, trigger: dateOver ? "date" : "km" };

  const dateSoon = daysLeft !== null && daysLeft <= SOON_DAYS;
  const kmSoon = kmLeft !== null && kmLeft <= SOON_KM;
  if (dateSoon || kmSoon) return { status: "PROCHE", daysLeft, kmLeft, trigger: dateSoon ? "date" : "km" };

  return { status: "A_VENIR", daysLeft, kmLeft, trigger: null };
}

const STATUS_ORDER: Record<ReminderStatus, number> = { DEPASSE: 0, PROCHE: 1, A_VENIR: 2, REALISE: 3 };

/** Tri : statut le plus urgent d'abord, puis échéance la plus proche. */
export function compareEvaluations(a: ReminderEvaluation, b: ReminderEvaluation) {
  if (STATUS_ORDER[a.status] !== STATUS_ORDER[b.status]) return STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
  const urgency = (e: ReminderEvaluation) =>
    Math.min(e.daysLeft ?? Number.POSITIVE_INFINITY, e.kmLeft === null ? Number.POSITIVE_INFINITY : e.kmLeft / 50);
  return urgency(a) - urgency(b);
}

export const STATUS_LABELS: Record<ReminderStatus, string> = {
  DEPASSE: "Dépassé",
  PROCHE: "À prévoir prochainement",
  A_VENIR: "À venir",
  REALISE: "Réalisé",
};

export function describeRemaining(e: ReminderEvaluation) {
  const parts: string[] = [];
  const fr = new Intl.NumberFormat("fr-FR");
  if (e.daysLeft !== null) {
    if (e.daysLeft < 0) parts.push(`dépassée de ${fr.format(-e.daysLeft)} j`);
    else if (e.daysLeft === 0) parts.push("aujourd'hui");
    else parts.push(`dans ${fr.format(e.daysLeft)} j`);
  }
  if (e.kmLeft !== null) {
    if (e.kmLeft < 0) parts.push(`dépassé de ${fr.format(-e.kmLeft)} km`);
    else parts.push(`${fr.format(e.kmLeft)} km restants`);
  }
  return parts.join(" · ");
}
