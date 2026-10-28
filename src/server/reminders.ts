import "server-only";
import { prisma } from "./db";
import { NotFoundError } from "./errors";
import { requireVehicle } from "./vehicles";
import { compareEvaluations, evaluateReminder } from "@/lib/reminders";
import type { ReminderInput } from "@/lib/validation";

export async function listReminders(userId: string, vehicleId?: string | null) {
  const reminders = await prisma.reminder.findMany({
    where: { vehicle: { userId }, ...(vehicleId ? { vehicleId } : {}) },
    include: {
      vehicle: { select: { id: true, make: true, model: true, trim: true, mileage: true } },
      completedBy: { select: { id: true, date: true } },
      sourceIntervention: { select: { id: true, date: true } },
    },
  });
  const today = new Date();
  return reminders
    .map((r) => ({ ...r, evaluation: evaluateReminder(r, r.vehicle.mileage, today) }))
    .sort((a, b) => compareEvaluations(a.evaluation, b.evaluation));
}

export async function getReminder(userId: string, id: string) {
  return prisma.reminder.findFirst({ where: { id, vehicle: { userId } }, include: { vehicle: true } });
}

async function requireReminder(userId: string, id: string) {
  const reminder = await getReminder(userId, id);
  if (!reminder) throw new NotFoundError("Échéance introuvable.");
  return reminder;
}

function columns(input: ReminderInput) {
  return {
    title: input.title,
    category: input.category,
    dueDate: input.dueDate,
    dueMileage: input.dueMileage,
    origin: input.origin,
    sourceReference: input.sourceReference,
    notes: input.notes,
  };
}

export async function createReminder(userId: string, vehicleId: string, input: ReminderInput) {
  const vehicle = await requireVehicle(userId, vehicleId);
  return prisma.reminder.create({ data: { ...columns(input), vehicleId: vehicle.id } });
}

export async function updateReminder(userId: string, id: string, input: ReminderInput) {
  const reminder = await requireReminder(userId, id);
  return prisma.reminder.update({ where: { id: reminder.id }, data: columns(input) });
}

export async function setReminderCompleted(userId: string, id: string, completed: boolean) {
  const reminder = await requireReminder(userId, id);
  return prisma.reminder.update({
    where: { id: reminder.id },
    data: completed ? { completedAt: new Date() } : { completedAt: null, completedById: null },
  });
}

export async function deleteReminder(userId: string, id: string) {
  const reminder = await requireReminder(userId, id);
  await prisma.reminder.delete({ where: { id: reminder.id } });
}
