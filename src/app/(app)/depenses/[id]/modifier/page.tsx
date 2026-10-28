import { notFound, redirect } from "next/navigation";
import { ExpenseForm } from "@/components/expenses/expense-form";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { getExpense } from "@/server/expenses";
import { requireUser } from "@/server/session";

export const metadata = { title: "Modifier la dépense" };

export default async function EditExpensePage({ params }: PageProps<"/depenses/[id]/modifier">) {
  const user = await requireUser();
  const { id } = await params;
  const expense = await getExpense(user.id, id);
  if (!expense) notFound();
  if (expense.interventionId) redirect(`/entretiens/${expense.interventionId}/modifier`);
  return (
    <>
      <PageHeader title="Modifier la dépense" />
      <Card className="pt-5">
        <ExpenseForm vehicleId={expense.vehicleId} initial={expense} cancelHref={`/depenses?v=${expense.vehicleId}`} />
      </Card>
    </>
  );
}
