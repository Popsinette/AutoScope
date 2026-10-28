import { deleteExpenseAction, saveExpense } from "@/app/actions/expenses";
import { ExpensesView } from "@/components/views/expenses-view";
import { NoVehicle } from "@/components/vehicles/no-vehicle";
import { EXPENSE_LABELS } from "@/lib/labels";
import { isEnumValue, param, type SearchParams } from "@/lib/search-params";
import { expenseYears, listExpenses } from "@/server/expenses";
import { resolveSelectedVehicle } from "@/server/selection";
import { requireUser } from "@/server/session";

export const metadata = { title: "Dépenses" };

export default async function ExpensesPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const user = await requireUser();
  const sp = await searchParams;
  const all = param(sp, "v") === "tous";
  const { vehicles, selected } = await resolveSelectedVehicle(user.id, all ? null : param(sp, "v"));
  if (!selected) return <NoVehicle what="ses dépenses" />;
  const vehicle = all ? null : selected;
  const yearParam = param(sp, "annee");
  const year = yearParam === "toutes" ? null : Number(yearParam) || new Date().getFullYear();
  const rawCategory = param(sp, "categorie");
  const category = isEnumValue(EXPENSE_LABELS, rawCategory) ? rawCategory : null;
  const [years, rows, yearRows] = await Promise.all([
    expenseYears(user.id),
    listExpenses(user.id, { vehicleId: vehicle?.id, year, category }),
    year ? listExpenses(user.id, { vehicleId: vehicle?.id, year, category: null }) : Promise.resolve([]),
  ]);
  return (
    <ExpensesView
      vehicles={vehicles}
      vehicle={vehicle}
      all={all}
      years={years}
      year={year}
      category={category}
      rows={rows}
      yearRows={yearRows}
      deleteAction={deleteExpenseAction}
      saveAction={saveExpense}
    />
  );
}
