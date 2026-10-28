import { Download } from "lucide-react";
import { Link, useParams } from "react-router";
import { COMPONENTS } from "../../../prisma/demo-data/components";
import { InterventionForm } from "@/components/interventions/intervention-form";
import { ExpenseForm } from "@/components/expenses/expense-form";
import { ReminderForm } from "@/components/reminders/reminder-form";
import { buttonClass } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { NoVehicle } from "@/components/vehicles/no-vehicle";
import { DocumentsView } from "@/components/views/documents-view";
import { ExpensesView } from "@/components/views/expenses-view";
import { InterventionDetailView } from "@/components/views/intervention-detail-view";
import { InterventionsView } from "@/components/views/interventions-view";
import { REMINDER_TABS, RemindersView } from "@/components/views/reminders-view";
import { expensesToCsv } from "@/lib/expenses";
import { DOCUMENT_LABELS, EXPENSE_LABELS, INTERVENTION_LABELS } from "@/lib/labels";
import type { ReminderStatus } from "@/lib/reminders";
import { isEnumValue } from "@/lib/search-params";
import { vehicleLabel } from "@/lib/vehicle";
import { useDemoActions } from "../actions";
import { fileHref, useDemo, useParam } from "../hooks";
import { NotFound } from "./not-found";

/** Fiches proposées dans le formulaire : identifiées par leur slug dans la démo. */
const COMPONENT_OPTIONS = COMPONENTS.map((c) => ({ id: c.slug, name: c.name, family: c.family })).sort(
  (a, b) => a.family.localeCompare(b.family) || a.name.localeCompare(b.name, "fr"),
);

export function InterventionsPage() {
  const store = useDemo();
  const vehicle = store.resolveSelected(useParam("v"));
  const raw = useParam("categorie");
  const category = isEnumValue(INTERVENTION_LABELS, raw) ? raw : undefined;
  const q = useParam("q")?.slice(0, 100);
  const view = useParam("vue") === "tableau" ? "tableau" : "chronologie";
  if (!vehicle) return <NoVehicle what="son carnet d’entretien" />;
  return <InterventionsView vehicle={vehicle} items={store.listInterventions(vehicle.id, { category, q })} category={category} q={q} view={view} />;
}

export function NewInterventionPage() {
  const store = useDemo();
  const actions = useDemoActions();
  const echeance = useParam("echeance");
  const v = useParam("v");
  const composant = useParam("composant");
  const reminder = store.reminder(echeance ?? "");
  const vehicle = store.resolveSelected(reminder?.vehicleId ?? v);
  if (!vehicle) return <NoVehicle what="son carnet d’entretien" />;
  return (
    <>
      <PageHeader title="Nouvel entretien" subtitle={reminder ? `${vehicleLabel(vehicle)} — réalisation de l’échéance « ${reminder.title} »` : vehicleLabel(vehicle)} />
      <InterventionForm
        vehicleId={vehicle.id}
        components={COMPONENT_OPTIONS}
        cancelHref={`/entretiens?v=${vehicle.id}`}
        action={actions.saveIntervention}
        completesReminderId={reminder && !reminder.completedAt ? reminder.id : undefined}
        initial={{ mileage: vehicle.mileage, category: reminder?.category, description: reminder?.title, componentIds: composant ? [composant] : [] }}
      />
    </>
  );
}

export function InterventionPage() {
  const store = useDemo();
  const actions = useDemoActions();
  const detail = store.interventionDetail(useParams().id ?? "");
  if (!detail) return <NotFound />;
  return <InterventionDetailView intervention={detail} deleteAction={actions.deleteIntervention} fileHref={fileHref} />;
}

export function EditInterventionPage() {
  const store = useDemo();
  const actions = useDemoActions();
  const detail = store.interventionDetail(useParams().id ?? "");
  if (!detail) return <NotFound />;
  return (
    <>
      <PageHeader title="Modifier l’intervention" subtitle={vehicleLabel(detail.vehicle)} />
      <InterventionForm
        vehicleId={detail.vehicleId}
        components={COMPONENT_OPTIONS}
        cancelHref={`/entretiens/${detail.id}`}
        action={actions.saveIntervention}
        initial={{ ...detail, componentIds: detail.componentSlugs }}
      />
    </>
  );
}

function downloadCsv(csv: string, name: string) {
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const a = Object.assign(document.createElement("a"), { href: url, download: name });
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function ExpensesPage() {
  const store = useDemo();
  const actions = useDemoActions();
  const v = useParam("v");
  const all = v === "tous";
  const selected = store.resolveSelected(all ? null : v);
  const yearParam = useParam("annee");
  const rawCategory = useParam("categorie");
  if (!selected) return <NoVehicle what="ses dépenses" />;
  const vehicle = all ? null : selected;
  const year = yearParam === "toutes" ? null : Number(yearParam) || new Date().getFullYear();
  const category = isEnumValue(EXPENSE_LABELS, rawCategory) ? rawCategory : null;
  const rows = store.listExpenses({ vehicleId: vehicle?.id, year, category });
  const exportCsv = () =>
    downloadCsv(
      expensesToCsv(
        rows.map((r) => ({
          date: r.date,
          vehicle: vehicleLabel(r.vehicle),
          category: EXPENSE_LABELS[r.category],
          label: r.label,
          amountCents: r.amountCents,
          source: r.interventionId ? "Intervention" : "Saisie manuelle",
        })),
      ),
      `carview-depenses${year ? `-${year}` : ""}.csv`,
    );
  return (
    <ExpensesView
      vehicles={store.data.vehicles}
      vehicle={vehicle}
      all={all}
      years={store.expenseYears()}
      year={year}
      category={category}
      rows={rows}
      yearRows={year ? store.listExpenses({ vehicleId: vehicle?.id, year }) : []}
      deleteAction={actions.deleteExpense}
      saveAction={actions.saveExpense}
      exportButton={
        <button type="button" onClick={exportCsv} className={buttonClass("secondary")}>
          <Download size={15} aria-hidden /> Export CSV
        </button>
      }
    />
  );
}

export function EditExpensePage() {
  const store = useDemo();
  const actions = useDemoActions();
  const expense = store.expense(useParams().id ?? "");
  if (!expense) return <NotFound />;
  if (expense.interventionId) {
    return (
      <Card className="p-5 text-sm">
        Cette dépense provient d’une intervention :{" "}
        <Link className="text-accent-ink underline" to={`/entretiens/${expense.interventionId}`}>
          modifiez l’intervention
        </Link>
        .
      </Card>
    );
  }
  return (
    <>
      <PageHeader title="Modifier la dépense" />
      <Card className="pt-5">
        <ExpenseForm vehicleId={expense.vehicleId} initial={expense} cancelHref={`/depenses?v=${expense.vehicleId}`} action={actions.saveExpense} />
      </Card>
    </>
  );
}

export function RemindersPage() {
  const store = useDemo();
  const actions = useDemoActions();
  const vehicle = store.resolveSelected(useParam("v"));
  const statut = useParam("statut");
  if (!vehicle) return <NoVehicle what="ses échéances" />;
  const tab = (REMINDER_TABS.find((t) => t.key === statut)?.key ?? "toutes") as ReminderStatus | "toutes";
  return (
    <RemindersView
      vehicle={vehicle}
      tab={tab}
      reminders={store.listReminders(vehicle.id)}
      emailReady={false}
      toggleAction={actions.toggleReminder}
      deleteAction={actions.deleteReminder}
      saveAction={actions.saveReminder}
    />
  );
}

export function EditReminderPage() {
  const store = useDemo();
  const actions = useDemoActions();
  const reminder = store.reminder(useParams().id ?? "");
  const vehicle = store.vehicle(reminder?.vehicleId);
  if (!reminder || !vehicle) return <NotFound />;
  return (
    <>
      <PageHeader title="Modifier l’échéance" subtitle={vehicleLabel(vehicle)} />
      <Card className="pt-5">
        <ReminderForm vehicleId={vehicle.id} currentMileage={vehicle.mileage} initial={reminder} cancelHref={`/echeances?v=${vehicle.id}`} action={actions.saveReminder} />
      </Card>
    </>
  );
}

export function DocumentsPage() {
  const store = useDemo();
  const actions = useDemoActions();
  const vehicle = store.resolveSelected(useParam("v"));
  const raw = useParam("categorie");
  const q = useParam("q")?.slice(0, 100) ?? null;
  if (!vehicle) return <NoVehicle what="ses documents" />;
  const category = isEnumValue(DOCUMENT_LABELS, raw) ? raw : null;
  return (
    <DocumentsView
      vehicle={vehicle}
      docs={store.listDocuments({ vehicleId: vehicle.id, category, q })}
      interventions={store.listInterventions(vehicle.id)}
      category={category}
      q={q}
      deleteAction={actions.deleteDocument}
      uploadAction={actions.uploadDocument}
      fileHref={fileHref}
    />
  );
}
