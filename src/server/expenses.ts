import "server-only";
import type { ExpenseCategory } from "@/generated/prisma/enums";
import { prisma } from "./db";
import { ForbiddenActionError, NotFoundError } from "./errors";
import { requireVehicle } from "./vehicles";
import type { ExpenseInput } from "@/lib/validation";

export interface ExpenseFilters {
  vehicleId?: string | null; // null/undefined = tous les véhicules de l'utilisateur
  year?: number | null;
  category?: ExpenseCategory | null;
}

// Les dates saisies sont enregistrées à midi UTC : les bornes UTC suffisent.
function yearRange(year: number) {
  return { gte: new Date(Date.UTC(year, 0, 1)), lt: new Date(Date.UTC(year + 1, 0, 1)) };
}

export async function listExpenses(userId: string, filters: ExpenseFilters = {}) {
  return prisma.expense.findMany({
    where: {
      vehicle: { userId },
      ...(filters.vehicleId ? { vehicleId: filters.vehicleId } : {}),
      ...(filters.year ? { date: yearRange(filters.year) } : {}),
      ...(filters.category ? { category: filters.category } : {}),
    },
    include: {
      vehicle: { select: { id: true, make: true, model: true, trim: true } },
      intervention: { select: { id: true, category: true } },
    },
    orderBy: { date: "desc" },
  });
}

/** Années pour lesquelles l'utilisateur a des dépenses (plus l'année en cours). */
export async function expenseYears(userId: string) {
  const rows = await prisma.expense.findMany({ where: { vehicle: { userId } }, select: { date: true } });
  const years = new Set(rows.map((r) => r.date.getUTCFullYear()));
  years.add(new Date().getFullYear());
  return [...years].sort((a, b) => b - a);
}

async function requireManualExpense(userId: string, id: string) {
  const expense = await prisma.expense.findFirst({ where: { id, vehicle: { userId } } });
  if (!expense) throw new NotFoundError("Dépense introuvable.");
  if (expense.interventionId) {
    throw new ForbiddenActionError("Cette dépense provient d'une intervention : modifiez l'intervention pour la mettre à jour.");
  }
  return expense;
}

export async function getExpense(userId: string, id: string) {
  return prisma.expense.findFirst({ where: { id, vehicle: { userId } } });
}

export async function createExpense(userId: string, vehicleId: string, input: ExpenseInput) {
  const vehicle = await requireVehicle(userId, vehicleId);
  return prisma.expense.create({
    data: {
      vehicleId: vehicle.id,
      date: input.date,
      category: input.category,
      amountCents: input.amount,
      label: input.label,
      notes: input.notes,
    },
  });
}

export async function updateExpense(userId: string, id: string, input: ExpenseInput) {
  const expense = await requireManualExpense(userId, id);
  return prisma.expense.update({
    where: { id: expense.id },
    data: { date: input.date, category: input.category, amountCents: input.amount, label: input.label, notes: input.notes },
  });
}

export async function deleteExpense(userId: string, id: string) {
  const expense = await requireManualExpense(userId, id);
  await prisma.expense.delete({ where: { id: expense.id } });
}
