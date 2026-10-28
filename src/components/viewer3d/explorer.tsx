"use client";

import dynamic from "next/dynamic";
import { Component, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Eye, EyeOff, ListTree, Loader2, Maximize2, RotateCcw, Search, X } from "lucide-react";
import { cn } from "@/components/ui/cn";
import { Input } from "@/components/ui/field";
import { ELECTRONIC_LABELS, FAMILY_LABELS } from "@/lib/labels";
import { MODES, modeAvailability, modeToReveal, type ViewerMode } from "@/lib/viewer-modes";
import type { ComponentFamily, ElectronicKind } from "@/generated/prisma/enums";
import { ComponentSheet, type SheetLoader } from "./component-sheet";
import { ELECTRONIC_COLORS, FAMILY_COLORS } from "./palette";
import type { CameraPreset, ExplorerComponent, ExplorerModel } from "./types";

// La scène (three.js) n'est chargée qu'à la demande, côté navigateur.
const Scene = dynamic(() => import("./scene"), {
  ssr: false,
  loading: () => <SceneLoading />,
});

function SceneLoading() {
  return (
    <div className="absolute inset-0 grid place-items-center text-sm text-muted" role="status">
      <span className="flex items-center gap-2">
        <Loader2 className="animate-spin" size={18} aria-hidden /> Chargement de la scène 3D…
      </span>
    </div>
  );
}

class SceneBoundary extends Component<{ children: ReactNode; fallback: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(query);
    setMatches(mq.matches);
    const on = () => setMatches(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, [query]);
  return matches;
}

function webglAvailable() {
  try {
    const canvas = document.createElement("canvas");
    return !!(canvas.getContext("webgl2") || canvas.getContext("webgl"));
  } catch {
    return false;
  }
}

const PRESETS: { key: CameraPreset; label: string; needsInterior?: boolean }[] = [
  { key: "avant", label: "Avant" },
  { key: "arriere", label: "Arrière" },
  { key: "profil", label: "Profil" },
  { key: "dessus", label: "Dessus" },
  { key: "interieur", label: "Intérieur", needsInterior: true },
];

const UNMAPPED = "NON_ASSOCIE";

export function Explorer({
  model,
  components,
  vehicleId,
  initialSlug,
  loadSheet,
  fileHref,
}: {
  model: ExplorerModel;
  components: ExplorerComponent[];
  vehicleId: string | null;
  initialSlug: string | null;
  loadSheet?: SheetLoader;
  fileHref?: (documentId: string) => string;
}) {
  const bySlug = useMemo(() => Object.fromEntries(components.map((c) => [c.slug, c])), [components]);
  // Composants réellement présents dans ce modèle.
  const present = useMemo(() => {
    const slugs = new Set(Object.values(model.mapping));
    return components.filter((c) => slugs.has(c.slug));
  }, [components, model.mapping]);

  const [mode, setMode] = useState<ViewerMode>("exterieur");
  const [selected, setSelected] = useState<string | null>(initialSlug && bySlug[initialSlug] ? initialSlug : null);
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const [explode, setExplode] = useState(0);
  const [camera, setCamera] = useState<{ preset: CameraPreset; nonce: number }>({ preset: "reset", nonce: 0 });
  const [focusNonce, setFocusNonce] = useState(0);
  const [hovered, setHovered] = useState<string | null>(null);
  const [ready, setReady] = useState<{ mappedNodes: number; hasInterior: boolean; unmappedMeshes: number } | null>(null);
  const [webgl, setWebgl] = useState<boolean | null>(null);
  const [query, setQuery] = useState("");
  const [treeOpen, setTreeOpen] = useState(false);
  const [sheetExpanded, setSheetExpanded] = useState(false);
  const lowQuality = useMediaQuery("(max-width: 768px), (pointer: coarse)");
  const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const animation = useRef<number | null>(null);
  const sceneRef = useRef<HTMLElement>(null);

  useEffect(() => setWebgl(webglAvailable()), []);
  useEffect(() => () => {
    if (animation.current) cancelAnimationFrame(animation.current);
  }, []);

  const availability = useMemo(
    () => Object.fromEntries(MODES.map((m) => [m.key, modeAvailability(m.key, present, Object.keys(model.mapping).length)])),
    [present, model.mapping],
  );

  const select = useCallback(
    (slug: string | null, fromList = false) => {
      setSelected(slug);
      setSheetExpanded(false);
      if (slug && fromList) {
        const info = bySlug[slug];
        if (info) setMode((m) => modeToReveal(m, info));
        setHidden((h) => {
          if (!info || !h.has(info.family)) return h;
          const next = new Set(h);
          next.delete(info.family);
          return next;
        });
        setFocusNonce((n) => n + 1);
        // Sur petit écran, ramener la scène en vue au-dessus du tiroir de la fiche.
        if (window.matchMedia("(max-width: 1279px)").matches) {
          sceneRef.current?.scrollIntoView({ block: "start", behavior: reducedMotion ? "auto" : "smooth" });
        }
      }
    },
    [bySlug, reducedMotion],
  );

  // Sélection initiale (lien depuis une intervention) : rendre visible puis cadrer.
  useEffect(() => {
    if (ready && initialSlug && bySlug[initialSlug]) select(initialSlug, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  const changeMode = (m: ViewerMode) => {
    setMode(m);
    if (m !== "eclatee") setExplode(0);
    else if (explode === 0) animateExplode(0.6);
  };

  const animateExplode = (target: number) => {
    if (animation.current) cancelAnimationFrame(animation.current);
    if (reducedMotion) return setExplode(target);
    const start = performance.now();
    const from = explode;
    const step = (t: number) => {
      const k = Math.min(1, (t - start) / 450);
      const eased = 1 - (1 - k) ** 3;
      setExplode(from + (target - from) * eased);
      if (k < 1) animation.current = requestAnimationFrame(step);
    };
    animation.current = requestAnimationFrame(step);
  };

  const toggleFamily = (family: string) =>
    setHidden((h) => {
      const next = new Set(h);
      if (next.has(family)) next.delete(family);
      else next.add(family);
      return next;
    });

  const families = useMemo(() => {
    const q = query.trim().toLowerCase();
    const groups = new Map<ComponentFamily, ExplorerComponent[]>();
    for (const c of present) {
      if (q && !c.name.toLowerCase().includes(q) && !FAMILY_LABELS[c.family].toLowerCase().includes(q)) continue;
      groups.set(c.family, [...(groups.get(c.family) ?? []), c]);
    }
    return [...groups.entries()].sort((a, b) => FAMILY_LABELS[a[0]].localeCompare(FAMILY_LABELS[b[0]], "fr"));
  }, [present, query]);

  const legend = useMemo(() => {
    if (mode === "electronique") {
      const kinds = [...new Set(present.map((c) => c.electronicKind).filter(Boolean))] as ElectronicKind[];
      return kinds.map((k) => ({ key: k, label: ELECTRONIC_LABELS[k], color: ELECTRONIC_COLORS[k] }));
    }
    if (mode === "mecanique" || mode === "complete") {
      const fams = [...new Set(present.filter((c) => c.family !== "CARROSSERIE" && (mode === "complete" || c.system === "MECANIQUE")).filter((c) => c.system !== "ELECTRONIQUE").map((c) => c.family))];
      const items: { key: string; label: string; color: string }[] = fams.map((f) => ({ key: f, label: FAMILY_LABELS[f], color: FAMILY_COLORS[f] }));
      if (mode === "complete") {
        const kinds = [...new Set(present.map((c) => c.electronicKind).filter(Boolean))] as ElectronicKind[];
        items.push(...kinds.map((k) => ({ key: k, label: ELECTRONIC_LABELS[k], color: ELECTRONIC_COLORS[k] })));
      }
      return items;
    }
    return [];
  }, [mode, present]);

  const tree = (
    <div className="flex min-h-0 flex-col">
      <div className="relative p-3">
        <Search size={15} className="pointer-events-none absolute left-6 top-1/2 -translate-y-1/2 text-muted" aria-hidden />
        <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Rechercher une pièce…" aria-label="Rechercher une pièce" className="pl-9" />
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-3">
        {families.length === 0 && <p className="px-2 text-sm text-muted">Aucune pièce ne correspond.</p>}
        <ul aria-label="Composants du modèle" className="flex flex-col gap-2">
          {families.map(([family, items]) => {
            const isHidden = hidden.has(family);
            return (
              <li key={family}>
                <div className="flex items-center gap-2 px-2 py-1">
                  <span className="size-2.5 rounded-full" style={{ background: FAMILY_COLORS[family] }} aria-hidden />
                  <span className="flex-1 text-xs font-semibold uppercase tracking-wider text-ink-2">{FAMILY_LABELS[family]}</span>
                  <button
                    type="button"
                    onClick={() => toggleFamily(family)}
                    aria-pressed={!isHidden}
                    className="grid size-7 place-items-center rounded-md text-muted hover:bg-surface-2 hover:text-ink"
                    aria-label={`${isHidden ? "Afficher" : "Masquer"} la famille ${FAMILY_LABELS[family]}`}
                  >
                    {isHidden ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
                <ul>
                  {items.map((c) => (
                    <li key={c.slug}>
                      <button
                        type="button"
                        onClick={() => {
                          select(c.slug, true);
                          setTreeOpen(false);
                        }}
                        aria-pressed={selected === c.slug}
                        className={cn(
                          "flex w-full items-center rounded-lg px-3 py-1.5 text-left text-[0.84rem] transition-colors",
                          selected === c.slug ? "bg-accent text-white" : isHidden ? "text-muted hover:bg-surface-2" : "text-ink-2 hover:bg-surface-2 hover:text-ink",
                        )}
                      >
                        {c.name}
                      </button>
                    </li>
                  ))}
                </ul>
              </li>
            );
          })}
          {ready && ready.unmappedMeshes > 0 && !query && (
            <li className="flex items-center gap-2 px-2 py-1">
              <span className="flex-1 text-xs text-muted">{ready.unmappedMeshes} objet(s) sans fiche</span>
              <button type="button" onClick={() => toggleFamily(UNMAPPED)} aria-pressed={!hidden.has(UNMAPPED)} className="grid size-7 place-items-center rounded-md text-muted hover:bg-surface-2" aria-label={`${hidden.has(UNMAPPED) ? "Afficher" : "Masquer"} les objets sans fiche`}>
                {hidden.has(UNMAPPED) ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </li>
          )}
        </ul>
      </div>
    </div>
  );

  const hoveredName = hovered ? bySlug[hovered]?.name : null;

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[260px_1fr] xl:grid-cols-[260px_1fr_340px]">
      {/* Arborescence : colonne sur ordinateur, panneau sur mobile */}
      <aside className="card hidden max-h-[calc(100dvh-210px)] min-h-[520px] flex-col lg:flex" aria-label="Arborescence des composants">
        <p className="px-4 pt-4 text-sm font-semibold">Composants</p>
        {tree}
      </aside>

      <section ref={sceneRef} className="card relative flex min-h-0 scroll-mt-16 flex-col overflow-hidden" aria-label="Scène 3D">
        <div className="flex items-center gap-2 border-b border-line p-2">
          <div role="toolbar" aria-label="Modes d’affichage" className="relative -mx-1 flex flex-1 gap-1 overflow-x-auto px-1 lg:flex-wrap">
            {MODES.map((m) => {
              const a = availability[m.key];
              return (
                <button
                  key={m.key}
                  type="button"
                  disabled={!a.available}
                  title={a.available ? m.hint : a.reason}
                  aria-pressed={mode === m.key}
                  onClick={() => changeMode(m.key)}
                  className={cn(
                    "h-8 shrink-0 rounded-lg px-3 text-[0.8rem] font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40",
                    mode === m.key ? "bg-accent text-white" : "text-ink-2 hover:bg-surface-2 hover:text-ink",
                  )}
                >
                  {m.label}
                </button>
              );
            })}
          </div>
          <button type="button" onClick={() => setTreeOpen(true)} className="flex h-8 shrink-0 items-center gap-1.5 rounded-lg border border-line-strong px-2.5 text-xs lg:hidden">
            <ListTree size={15} aria-hidden /> Pièces
          </button>
        </div>

        <div className="relative h-[46dvh] min-h-[300px] bg-[#0f1013] lg:h-[calc(100dvh-262px)] lg:min-h-[470px]" data-testid="scene-container" data-selected={selected ?? ""} data-mode={mode} data-ready={ready ? "1" : "0"}>
          {webgl === false ? (
            <NoWebgl />
          ) : webgl === null ? (
            <SceneLoading />
          ) : (
            <SceneBoundary fallback={<NoWebgl />}>
              <Scene
                model={model}
                components={bySlug}
                mode={mode}
                selectedSlug={selected}
                hiddenFamilies={hidden}
                explode={explode}
                lowQuality={lowQuality}
                reducedMotion={reducedMotion}
                camera={camera}
                focusNonce={focusNonce}
                onSelect={(s) => select(s)}
                onHover={setHovered}
                onReady={setReady}
              />
            </SceneBoundary>
          )}

          {hoveredName && (
            <p className="pointer-events-none absolute left-3 top-3 rounded-md bg-black/70 px-2 py-1 text-xs" aria-hidden>
              {hoveredName}
            </p>
          )}

          <div className="absolute right-2 top-2 flex flex-col gap-1" role="toolbar" aria-label="Vues de caméra">
            {PRESETS.filter((p) => !p.needsInterior || ready?.hasInterior).map((p) => (
              <button key={p.key} type="button" onClick={() => setCamera((c) => ({ preset: p.key, nonce: c.nonce + 1 }))} className="h-8 rounded-lg border border-line-strong bg-bg/80 px-2.5 text-[0.75rem] text-ink-2 backdrop-blur hover:text-ink">
                {p.label}
              </button>
            ))}
            <button type="button" onClick={() => setCamera((c) => ({ preset: "reset", nonce: c.nonce + 1 }))} className="flex h-8 items-center justify-center gap-1 rounded-lg border border-line-strong bg-bg/80 px-2.5 text-[0.75rem] text-ink-2 backdrop-blur hover:text-ink" aria-label="Réinitialiser la caméra">
              <RotateCcw size={13} aria-hidden /> 360°
            </button>
            {selected && (
              <button type="button" onClick={() => setFocusNonce((n) => n + 1)} className="flex h-8 items-center justify-center gap-1 rounded-lg border border-accent/60 bg-bg/80 px-2.5 text-[0.75rem] text-ink backdrop-blur" aria-label="Centrer la caméra sur la pièce sélectionnée">
                <Maximize2 size={13} aria-hidden /> Centrer
              </button>
            )}
          </div>

          {legend.length > 0 && (
            <ul className="absolute bottom-3 left-3 flex max-w-[60%] flex-col gap-1 rounded-lg border border-line bg-bg/80 p-2.5 text-[0.72rem] backdrop-blur" aria-label="Légende">
              {legend.map((l) => (
                <li key={l.key} className="flex items-center gap-2">
                  <span className="size-2.5 rounded-sm" style={{ background: l.color }} aria-hidden />
                  {l.label}
                </li>
              ))}
            </ul>
          )}

          {mode === "eclatee" && (
            <div className="absolute inset-x-3 bottom-3 ml-auto flex max-w-sm items-center gap-3 rounded-lg border border-line bg-bg/85 p-2.5 backdrop-blur">
              <label htmlFor="explode" className="shrink-0 text-xs text-ink-2">
                Séparation
              </label>
              <input id="explode" type="range" min={0} max={1} step={0.01} value={explode} onChange={(e) => setExplode(Number(e.target.value))} className="flex-1 accent-[#d9261c]" aria-valuetext={`${Math.round(explode * 100)} %`} />
              <button type="button" onClick={() => animateExplode(0)} className="shrink-0 text-xs text-ink-2 hover:text-ink">
                Rassembler
              </button>
            </div>
          )}
        </div>
        <p className="border-t border-line px-3 py-2 text-[0.72rem] text-muted">
          Glisser pour tourner · molette ou pincement pour zoomer · clic droit ou deux doigts pour déplacer · cliquer une pièce pour ouvrir sa fiche.
        </p>
      </section>

      {/* Fiche : colonne sur grand écran, tiroir inférieur repliable sur mobile/tablette */}
      <aside
        aria-labelledby={selected ? "component-sheet-title" : undefined}
        aria-label={selected ? undefined : "Fiche composant"}
        className={cn(
          "card xl:static xl:block xl:max-h-[calc(100dvh-210px)] xl:overflow-y-auto",
          selected
            ? cn(
                "fixed inset-x-0 bottom-16 z-40 rounded-b-none border-b-0 shadow-2xl lg:bottom-0 xl:rounded-b-[14px] xl:border-b xl:shadow-none",
                sheetExpanded ? "max-h-[72dvh] overflow-y-auto" : "max-h-[118px] overflow-hidden xl:max-h-none",
              )
            : "hidden xl:block",
        )}
      >
        {selected && (
          <button
            type="button"
            onClick={() => setSheetExpanded((e) => !e)}
            aria-expanded={sheetExpanded}
            className="flex w-full items-center justify-center gap-2 pt-2 text-[0.7rem] text-muted xl:hidden"
          >
            <span className="h-1 w-10 rounded-full bg-line-strong" aria-hidden />
            <span className="sr-only">{sheetExpanded ? "Réduire la fiche" : "Afficher toute la fiche"}</span>
          </button>
        )}
        {selected ? (
          <ComponentSheet key={selected} slug={selected} vehicleId={vehicleId} illustrative={model.isIllustrative} onClose={() => setSelected(null)} loadSheet={loadSheet} fileHref={fileHref} />
        ) : (
          <div className="p-5 text-sm text-muted">
            <p className="font-medium text-ink">Sélectionnez une pièce</p>
            <p className="mt-1">Cliquez sur une pièce dans la scène ou dans la liste pour voir sa fonction, sa description, ses interventions et ses documents.</p>
          </div>
        )}
        {selected && !sheetExpanded && (
          <button type="button" onClick={() => setSheetExpanded(true)} className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-surface to-transparent text-[0.72rem] text-ink-2 xl:hidden">
            Voir la fiche complète
          </button>
        )}
      </aside>

      {treeOpen && (
        <div className="fixed inset-0 z-50 flex flex-col bg-bg/95 backdrop-blur lg:hidden" role="dialog" aria-modal="true" aria-label="Liste des pièces">
          <div className="flex items-center justify-between border-b border-line p-3">
            <p className="font-semibold">Pièces du modèle</p>
            <button type="button" onClick={() => setTreeOpen(false)} className="grid size-9 place-items-center rounded-full hover:bg-surface-2" aria-label="Fermer la liste">
              <X size={18} />
            </button>
          </div>
          {tree}
        </div>
      )}
    </div>
  );
}

function NoWebgl() {
  return (
    <div className="absolute inset-0 grid place-items-center p-6 text-center text-sm">
      <div className="max-w-sm">
        <p className="font-medium">La 3D n’est pas disponible sur cet appareil</p>
        <p className="mt-1 text-muted">WebGL est désactivé ou non pris en charge. Utilisez la liste des pièces pour consulter les fiches des composants.</p>
      </div>
    </div>
  );
}
