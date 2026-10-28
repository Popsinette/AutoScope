"use client";

import Link from "next/link";
import { FileText, Plus, ShieldCheck, Wrench, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { cn } from "@/components/ui/cn";
import { formatDate, formatKm } from "@/lib/format";
import { ELECTRONIC_LABELS, FAMILY_LABELS, INTERVENTION_LABELS, RELIABILITY_LABELS } from "@/lib/labels";
import type { InterventionCategory, InfoReliability, ComponentFamily, ElectronicKind } from "@/generated/prisma/enums";

export interface Sheet {
  component: {
    id: string;
    slug: string;
    name: string;
    family: ComponentFamily;
    electronicKind: ElectronicKind | null;
    function: string;
    description: string;
    specs: { label: string; value: string }[];
    reference: string | null;
    source: string;
    reliability: InfoReliability;
  };
  interventions: { id: string; date: string | Date; mileage: number; category: InterventionCategory; description: string }[];
  documents: { id: string; title: string; mimeType: string }[];
}

type State = { status: "loading" } | { status: "error"; message: string } | { status: "ready"; sheet: Sheet };

export type SheetLoader = (slug: string, vehicleId: string | null, signal: AbortSignal) => Promise<Sheet>;

/** Chargement par l'API de l'application serveur. */
export const fetchSheet: SheetLoader = async (slug, vehicleId, signal) => {
  const res = await fetch(`/api/composants/${encodeURIComponent(slug)}${vehicleId ? `?v=${vehicleId}` : ""}`, { signal });
  if (!res.ok) throw new Error((await res.json().catch(() => null))?.error ?? "Chargement impossible.");
  return res.json();
};

export function ComponentSheet({
  slug,
  vehicleId,
  illustrative,
  onClose,
  loadSheet = fetchSheet,
  fileHref = (id) => `/api/documents/${id}`,
}: {
  slug: string;
  vehicleId: string | null;
  illustrative: boolean;
  onClose: () => void;
  loadSheet?: SheetLoader;
  fileHref?: (documentId: string) => string;
}) {
  const [state, setState] = useState<State>({ status: "loading" });

  useEffect(() => {
    const controller = new AbortController();
    setState({ status: "loading" });
    loadSheet(slug, vehicleId, controller.signal)
      .then((sheet) => setState({ status: "ready", sheet }))
      .catch((e: Error) => {
        if (e.name !== "AbortError") setState({ status: "error", message: e.message });
      });
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, vehicleId]);

  return (
    <div className="flex flex-col">
      <div className="flex items-start gap-2 border-b border-line p-4">
        <div className="min-w-0 flex-1">
          {state.status === "ready" ? (
            <>
              <h2 id="component-sheet-title" className="text-lg font-semibold tracking-tight">
                {state.sheet.component.name}
              </h2>
              <p className="text-xs text-muted">
                {FAMILY_LABELS[state.sheet.component.family]}
                {state.sheet.component.electronicKind && ` · ${ELECTRONIC_LABELS[state.sheet.component.electronicKind]}`}
              </p>
            </>
          ) : (
            <h2 id="component-sheet-title" className="text-lg font-semibold">
              Fiche composant
            </h2>
          )}
        </div>
        <button type="button" onClick={onClose} className="grid size-8 place-items-center rounded-full text-muted hover:bg-surface-2 hover:text-ink" aria-label="Fermer la fiche">
          <X size={17} />
        </button>
      </div>

      {state.status === "loading" && (
        <div className="flex flex-col gap-3 p-4" aria-busy="true">
          <span className="sr-only">Chargement de la fiche…</span>
          {[80, 100, 90, 60].map((w, i) => (
            <div key={i} className="h-3 animate-pulse rounded bg-surface-3" style={{ width: `${w}%` }} />
          ))}
        </div>
      )}
      {state.status === "error" && (
        <p role="alert" className="p-4 text-sm text-danger">
          {state.message}
        </p>
      )}
      {state.status === "ready" && <SheetBody sheet={state.sheet} vehicleId={vehicleId} illustrative={illustrative} fileHref={fileHref} />}
    </div>
  );
}

function SheetBody({ sheet, vehicleId, illustrative, fileHref }: { sheet: Sheet; vehicleId: string | null; illustrative: boolean; fileHref: (id: string) => string }) {
  const c = sheet.component;
  const reliability = RELIABILITY_LABELS[c.reliability];
  return (
    <div className="flex flex-col gap-4 p-4 text-sm">
      {illustrative && (
        <p className="rounded-lg border border-info/30 bg-info/10 px-3 py-2 text-xs text-info">
          Représentation 3D illustrative : forme et emplacement simplifiés, non issus d’un véhicule réel.
        </p>
      )}
      <section>
        <h3 className="eyebrow mb-1">Fonction</h3>
        <p>{c.function}</p>
      </section>
      <section>
        <h3 className="eyebrow mb-1">Description</h3>
        <p className="leading-relaxed text-ink-2">{c.description}</p>
      </section>
      {c.specs.length > 0 && (
        <section>
          <h3 className="eyebrow mb-1">Caractéristiques</h3>
          <dl className="divide-y divide-line rounded-lg border border-line">
            {c.specs.map((s) => (
              <div key={s.label} className="grid grid-cols-[1fr_1.2fr] gap-3 px-3 py-2">
                <dt className="text-muted">{s.label}</dt>
                <dd>{s.value}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}
      <section>
        <h3 className="eyebrow mb-1">Référence</h3>
        <p className={cn(!c.reference && "text-muted")}>{c.reference ?? "Non connue — dépend du véhicule (consultez sa documentation)."}</p>
      </section>
      <section>
        <h3 className="eyebrow mb-1 flex items-center gap-1.5">
          <Wrench size={12} aria-hidden /> Interventions associées
        </h3>
        {sheet.interventions.length === 0 ? (
          <p className="text-muted">Aucune intervention reliée à ce composant{vehicleId ? " pour ce véhicule" : ""}.</p>
        ) : (
          <ul className="flex flex-col gap-1.5">
            {sheet.interventions.map((i) => (
              <li key={i.id}>
                <Link href={`/entretiens/${i.id}`} className="hover:text-accent-ink">
                  {INTERVENTION_LABELS[i.category]} — {i.description}
                </Link>
                <span className="block text-xs text-muted">
                  {formatDate(i.date)} · {formatKm(i.mileage)}
                </span>
              </li>
            ))}
          </ul>
        )}
        {vehicleId && (
          <ButtonLink href={`/entretiens/nouveau?v=${vehicleId}&composant=${c.slug}`} variant="secondary" size="sm" className="mt-2">
            <Plus size={14} aria-hidden /> Ajouter une intervention
          </ButtonLink>
        )}
      </section>
      <section>
        <h3 className="eyebrow mb-1 flex items-center gap-1.5">
          <FileText size={12} aria-hidden /> Documents associés
        </h3>
        {sheet.documents.length === 0 ? (
          <p className="text-muted">Aucun document.</p>
        ) : (
          <ul className="flex flex-col gap-1">
            {sheet.documents.map((d) => (
              <li key={d.id}>
                <a href={fileHref(d.id)} className="hover:text-accent-ink">
                  {d.title}
                </a>
              </li>
            ))}
          </ul>
        )}
      </section>
      <section className="rounded-lg border border-line bg-bg/50 p-3">
        <h3 className="eyebrow mb-1 flex items-center gap-1.5">
          <ShieldCheck size={12} aria-hidden /> Source et fiabilité
        </h3>
        <Badge tone={c.reliability === "DOCUMENTEE" ? "ok" : c.reliability === "GENERIQUE" ? "warn" : "info"}>{reliability.label}</Badge>
        <p className="mt-1.5 text-xs text-muted">{reliability.hint}</p>
        <p className="mt-1 text-xs text-muted">{c.source}</p>
      </section>
    </div>
  );
}
