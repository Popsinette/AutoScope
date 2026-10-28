"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { SceneBoundary, useLowQuality, useMediaQuery, useResolvedModel, webglAvailable } from "./scene-utils";
import { Eye, EyeOff, Info, ListTree, Loader2, Maximize2, Minus, Plus, RotateCcw, Search, X } from "lucide-react";
import { cn } from "@/components/ui/cn";
import { Input } from "@/components/ui/field";
import { ELECTRONIC_LABELS, FAMILY_LABELS } from "@/lib/labels";
import { MODES, modeAvailability, modeToReveal, type ViewerMode } from "@/lib/viewer-modes";
import type { ComponentFamily, ElectronicKind } from "@/generated/prisma/enums";
import { ComponentSheet, type SheetLoader } from "./component-sheet";
import { ELECTRONIC_COLORS, FAMILY_COLORS } from "./palette";
import type { SceneReadyInfo } from "./scene";
import type { CameraPreset, ExplorerComponent, ExplorerModel } from "./types";

// La scène (three.js) n'est chargée qu'à la demande, côté navigateur.
const Scene = dynamic(() => import("./scene"), {
  ssr: false,
  loading: () => <SceneLoading label="Préparation de la scène 3D…" />,
});

function SceneLoading({ label, progress }: { label: string; progress?: number }) {
  return (
    <div className="pointer-events-none absolute inset-0 z-10 grid place-items-center bg-[#0c0d10]/70 text-sm text-ink-2" role="status">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="animate-spin text-accent-ink" size={22} aria-hidden />
        <span>{label}</span>
        {progress !== undefined && (
          <span className="h-1 w-40 overflow-hidden rounded-full bg-surface-3" aria-hidden>
            <span className="block h-full bg-accent transition-[width]" style={{ width: `${Math.round(progress)}%` }} />
          </span>
        )}
      </div>
    </div>
  );
}

const PRESETS: { key: CameraPreset; label: string; title: string; needsInterior?: boolean }[] = [
  { key: "perspective", label: "3/4", title: "Vue en perspective" },
  { key: "avant", label: "Avant", title: "Vue de face" },
  { key: "arriere", label: "Arrière", title: "Vue arrière" },
  { key: "gauche", label: "Gauche", title: "Côté gauche" },
  { key: "droite", label: "Droite", title: "Côté droit" },
  { key: "dessus", label: "Dessus", title: "Vue de dessus" },
  { key: "interieur", label: "Intérieur", title: "Vue depuis le siège conducteur", needsInterior: true },
];

const UNMAPPED = "NON_ASSOCIE";
const glass = "rounded-xl border border-line/80 bg-[#121317]/85 shadow-[0_16px_40px_-20px_rgba(0,0,0,0.9)] backdrop-blur-md";

export function Explorer({
  model: fallbackModel,
  preferredModel,
  components,
  vehicleId,
  initialSlug,
  loadSheet,
  fileHref,
}: {
  model: ExplorerModel;
  /** Modèle dédié au véhicule, utilisé si son fichier est installé. */
  preferredModel?: ExplorerModel | null;
  components: ExplorerComponent[];
  vehicleId: string | null;
  initialSlug: string | null;
  loadSheet?: SheetLoader;
  fileHref?: (documentId: string) => string;
}) {
  const resolved = useResolvedModel(fallbackModel, preferredModel);
  const model = resolved.model;
  const bySlug = useMemo(() => Object.fromEntries(components.map((c) => [c.slug, c])), [components]);
  // Composants réellement présents dans ce modèle (ou détectés après chargement s'il est lu automatiquement).
  const [detectedSlugs, setDetectedSlugs] = useState<string[] | null>(null);
  const present = useMemo(() => {
    const slugs = new Set(detectedSlugs ?? Object.values(model.mapping));
    return components.filter((c) => slugs.has(c.slug));
  }, [components, model.mapping, detectedSlugs]);

  const [mode, setMode] = useState<ViewerMode>("exterieur");
  const [selected, setSelected] = useState<string | null>(initialSlug && bySlug[initialSlug] ? initialSlug : null);
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const [explode, setExplode] = useState(0);
  const [ghostOpacity, setGhostOpacity] = useState(0.12);
  const [isolate, setIsolate] = useState(false);
  const [paint, setPaint] = useState<string | null>(model.defaultPaint ?? null);
  const [camera, setCamera] = useState<{ preset: CameraPreset; nonce: number }>({ preset: "reset", nonce: 0 });
  const [zoom, setZoom] = useState<{ direction: 1 | -1; nonce: number }>({ direction: 1, nonce: 0 });
  const [focusNonce, setFocusNonce] = useState(0);
  const [hovered, setHovered] = useState<string | null>(null);
  const [ready, setReady] = useState<SceneReadyInfo | null>(null);
  const [webgl, setWebgl] = useState<boolean | null>(null);
  const [query, setQuery] = useState("");
  const [treeOpen, setTreeOpen] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const [sheetExpanded, setSheetExpanded] = useState(false);
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const lowQuality = useLowQuality();
  const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const animation = useRef<number | null>(null);
  const sceneRef = useRef<HTMLElement>(null);

  useEffect(() => setWebgl(webglAvailable()), []);
  useEffect(() => {
    setPaint(model.defaultPaint ?? null);
    setReady(null);
    setDetectedSlugs(null);
  }, [model]);
  useEffect(
    () => () => {
      if (animation.current) cancelAnimationFrame(animation.current);
    },
    [],
  );

  const availability = useMemo(
    () => Object.fromEntries(MODES.map((m) => [m.key, modeAvailability(m.key, present, ready?.mappedNodes ?? Object.keys(model.mapping).length)])),
    [present, model.mapping, ready],
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

  const onReady = useCallback((info: SceneReadyInfo) => {
    setReady(info);
    setDetectedSlugs(info.slugs);
  }, []);

  const animateExplode = (target: number) => {
    if (animation.current) cancelAnimationFrame(animation.current);
    if (reducedMotion) return setExplode(target);
    const start = performance.now();
    const from = explode;
    const step = (t: number) => {
      const k = Math.min(1, (t - start) / 500);
      const eased = 1 - (1 - k) ** 3;
      setExplode(from + (target - from) * eased);
      if (k < 1) animation.current = requestAnimationFrame(step);
    };
    animation.current = requestAnimationFrame(step);
  };

  const changeMode = (m: ViewerMode) => {
    setMode(m);
    if (m !== "eclatee") setExplode(0);
    else if (explode === 0) {
      animateExplode(0.6);
      // Recul de la caméra pour garder l'ensemble des pièces écartées dans le cadre.
      setCamera((c) => ({ preset: "perspective", nonce: c.nonce + 1 }));
    }
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
    const kinds = [...new Set(present.map((c) => c.electronicKind).filter(Boolean))] as ElectronicKind[];
    if (mode === "electronique") return kinds.map((k) => ({ key: k, label: ELECTRONIC_LABELS[k], color: ELECTRONIC_COLORS[k] }));
    if (mode === "mecanique" || mode === "complete") {
      const fams = [...new Set(present.filter((c) => c.family !== "CARROSSERIE" && c.system !== "ELECTRONIQUE" && (mode === "complete" || c.system === "MECANIQUE")).map((c) => c.family))];
      const items: { key: string; label: string; color: string }[] = fams.map((f) => ({ key: f, label: FAMILY_LABELS[f], color: FAMILY_COLORS[f] }));
      if (mode === "complete") items.push(...kinds.map((k) => ({ key: k, label: ELECTRONIC_LABELS[k], color: ELECTRONIC_COLORS[k] })));
      return items;
    }
    return [];
  }, [mode, present]);

  const tree = (
    <div className="flex min-h-0 flex-1 flex-col">
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
  const bodyHidden = hidden.has("CARROSSERIE");
  const showSidePanel = isDesktop && panelOpen;

  return (
    <div className="flex flex-col gap-3">
      {(model.notice || resolved.missing) && (
        <p className="flex items-start gap-2 rounded-xl border border-info/30 bg-info/10 px-4 py-2.5 text-[0.82rem] text-info">
          <Info size={15} className="mt-0.5 shrink-0" aria-hidden />
          <span>
            {resolved.missing && `Le modèle dédié « ${resolved.missing.name} » n’est pas installé (fichier ${resolved.missing.url} absent) : affichage du modèle de présentation. `}
            {model.notice}
          </span>
        </p>
      )}

      <section
        ref={sceneRef}
        aria-label="Scène 3D"
        className="relative h-[60dvh] min-h-[380px] scroll-mt-16 overflow-hidden rounded-[16px] border border-line bg-[#0c0d10] lg:h-[calc(100dvh-210px)] lg:min-h-[560px]"
        data-testid="scene-container"
        data-selected={selected ?? ""}
        data-mode={mode}
        data-ready={ready ? "1" : "0"}
        data-model={model.id}
      >
        {webgl === false ? (
          <NoWebgl />
        ) : webgl === null || !resolved.checked ? (
          <SceneLoading label="Préparation de la scène 3D…" />
        ) : (
          <SceneBoundary fallback={<NoWebgl failed />}>
            <div className="absolute inset-0">
              <Scene
                key={model.id}
                model={model}
                components={bySlug}
                mode={mode}
                selectedSlug={selected}
                hiddenFamilies={hidden}
                explode={explode}
                ghostOpacity={ghostOpacity}
                isolate={isolate}
                paint={paint}
                lowQuality={lowQuality}
                reducedMotion={reducedMotion}
                camera={camera}
                zoom={zoom}
                focusNonce={focusNonce}
                onSelect={(s) => select(s)}
                onHover={setHovered}
                onReady={onReady}
              />
            </div>
          </SceneBoundary>
        )}

        {/* Barre supérieure : modes et outils */}
        <div className="pointer-events-none absolute inset-x-2 top-2 z-20 flex items-start gap-2 sm:inset-x-3 sm:top-3">
          <div role="toolbar" aria-label="Modes d’affichage" className={cn(glass, "pointer-events-auto relative flex min-w-0 gap-1 overflow-x-auto p-1")}>
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
                    "h-8 shrink-0 rounded-lg px-3 text-[0.8rem] font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-35",
                    mode === m.key ? "bg-accent text-white shadow-[0_6px_18px_-8px_rgb(217_38_28/0.9)]" : "text-ink-2 hover:bg-surface-2 hover:text-ink",
                  )}
                >
                  {m.label}
                </button>
              );
            })}
          </div>
          <div className="pointer-events-auto ml-auto flex shrink-0 items-center gap-2">
            {model.paints && (
              <div className={cn(glass, "hidden items-center gap-1.5 px-2 py-1.5 sm:flex")} role="radiogroup" aria-label="Teinte de carrosserie">
                {model.paints.map((p) => (
                  <button
                    key={p.name}
                    type="button"
                    role="radio"
                    aria-checked={paint === p.name}
                    aria-label={`Teinte ${p.label}`}
                    title={p.label}
                    onClick={() => setPaint(p.name)}
                    className={cn("size-5 rounded-full border-2 transition-transform", paint === p.name ? "scale-110 border-white" : "border-white/20 hover:border-white/60")}
                    style={{ background: p.swatch }}
                  />
                ))}
              </div>
            )}
            <button
              type="button"
              onClick={() => (isDesktop ? setPanelOpen((o) => !o) : setTreeOpen(true))}
              aria-pressed={isDesktop ? panelOpen : undefined}
              className={cn(glass, "flex h-10 items-center gap-1.5 px-3 text-xs text-ink-2 hover:text-ink")}
            >
              <ListTree size={15} aria-hidden /> Pièces
            </button>
          </div>
        </div>

        {/* Panneau gauche : arborescence (ordinateur) */}
        {showSidePanel && (
          <aside className={cn(glass, "absolute bottom-20 left-3 top-[4.25rem] z-10 flex w-[264px] flex-col")} aria-label="Arborescence des composants">
            <p className="px-4 pt-3 text-sm font-semibold">Composants</p>
            {tree}
          </aside>
        )}

        {hoveredName && (
          <p className="pointer-events-none absolute left-1/2 top-16 z-10 -translate-x-1/2 rounded-full bg-black/75 px-3 py-1 text-xs" aria-hidden>
            {hoveredName}
          </p>
        )}

        {/* Réglages du mode et légende */}
        <div className={cn("absolute bottom-[4.5rem] z-10 flex max-w-[calc(100%-1rem)] flex-col gap-2 sm:bottom-20", showSidePanel ? "left-[284px]" : "left-2 sm:left-3")}>
          {(mode === "transparent" || mode === "mecanique" || mode === "complete" || mode === "eclatee" || selected) && (
            <div className={cn(glass, "flex flex-col gap-2 p-2.5 text-xs")}>
              {(mode === "transparent" || mode === "mecanique" || mode === "complete") && (
                <label className="flex items-center gap-3">
                  <span className="w-24 shrink-0 text-ink-2">Transparence</span>
                  <input type="range" min={0.04} max={0.6} step={0.01} value={ghostOpacity} onChange={(e) => setGhostOpacity(Number(e.target.value))} className="w-36 accent-[#d9261c]" aria-label="Opacité de la carrosserie" aria-valuetext={`${Math.round(ghostOpacity * 100)} %`} />
                </label>
              )}
              {mode === "eclatee" && (
                <div className="flex items-center gap-3">
                  <label htmlFor="explode" className="w-24 shrink-0 text-ink-2">
                    Séparation
                  </label>
                  <input id="explode" type="range" min={0} max={1} step={0.01} value={explode} onChange={(e) => setExplode(Number(e.target.value))} className="w-36 accent-[#d9261c]" aria-valuetext={`${Math.round(explode * 100)} %`} />
                  <button type="button" onClick={() => animateExplode(0)} className="shrink-0 text-ink-2 hover:text-ink">
                    Rassembler
                  </button>
                </div>
              )}
              <div className="flex flex-wrap gap-1.5">
                {mode !== "exterieur" && (
                  <button type="button" aria-pressed={bodyHidden} onClick={() => toggleFamily("CARROSSERIE")} className={cn("rounded-md border px-2 py-1", bodyHidden ? "border-accent bg-accent-soft text-ink" : "border-line-strong text-ink-2 hover:text-ink")}>
                    {bodyHidden ? "Afficher la carrosserie" : "Masquer la carrosserie"}
                  </button>
                )}
                {selected && (
                  <button type="button" aria-pressed={isolate} onClick={() => setIsolate((v) => !v)} className={cn("rounded-md border px-2 py-1", isolate ? "border-accent bg-accent-soft text-ink" : "border-line-strong text-ink-2 hover:text-ink")}>
                    {isolate ? "Tout afficher" : "Isoler la pièce"}
                  </button>
                )}
              </div>
            </div>
          )}
          {legend.length > 0 && (
            <ul className={cn(glass, "hidden max-w-xs flex-col gap-1 p-2.5 text-[0.72rem] sm:flex")} aria-label="Légende">
              {legend.map((l) => (
                <li key={l.key} className="flex items-center gap-2">
                  <span className="size-2.5 rounded-sm" style={{ background: l.color }} aria-hidden />
                  {l.label}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Barre inférieure : vues caméra et zoom */}
        <div className="absolute inset-x-2 bottom-2 z-20 flex justify-center sm:bottom-3">
          <div role="toolbar" aria-label="Vues de caméra" className={cn(glass, "relative flex max-w-full items-center gap-0.5 overflow-x-auto p-1")}>
            {PRESETS.filter((p) => !p.needsInterior || ready?.hasInterior).map((p) => (
              <button key={p.key} type="button" title={p.title} onClick={() => setCamera((c) => ({ preset: p.key, nonce: c.nonce + 1 }))} className="h-9 shrink-0 rounded-lg px-2.5 text-[0.76rem] text-ink-2 hover:bg-surface-2 hover:text-ink">
                {p.label}
              </button>
            ))}
            <span className="mx-1 h-5 w-px shrink-0 bg-line-strong" aria-hidden />
            <button type="button" onClick={() => setZoom((z) => ({ direction: -1, nonce: z.nonce + 1 }))} className="grid size-9 shrink-0 place-items-center rounded-lg text-ink-2 hover:bg-surface-2 hover:text-ink" aria-label="Dézoomer">
              <Minus size={15} />
            </button>
            <button type="button" onClick={() => setZoom((z) => ({ direction: 1, nonce: z.nonce + 1 }))} className="grid size-9 shrink-0 place-items-center rounded-lg text-ink-2 hover:bg-surface-2 hover:text-ink" aria-label="Zoomer">
              <Plus size={15} />
            </button>
            <button type="button" onClick={() => setCamera((c) => ({ preset: "reset", nonce: c.nonce + 1 }))} className="flex h-9 shrink-0 items-center gap-1 rounded-lg px-2.5 text-[0.76rem] text-ink-2 hover:bg-surface-2 hover:text-ink" aria-label="Réinitialiser la caméra">
              <RotateCcw size={14} aria-hidden /> 360°
            </button>
            {selected && (
              <button type="button" onClick={() => setFocusNonce((n) => n + 1)} className="flex h-9 shrink-0 items-center gap-1 rounded-lg px-2.5 text-[0.76rem] text-ink hover:bg-surface-2" aria-label="Centrer la caméra sur la pièce sélectionnée">
                <Maximize2 size={14} aria-hidden /> Centrer
              </button>
            )}
          </div>
        </div>

        {model.credit && (
          <p className="pointer-events-none absolute bottom-[4.4rem] right-3 z-10 hidden max-w-[40%] text-right text-[0.65rem] leading-tight text-muted/80 lg:block">
            Modèle 3D : {model.credit}
          </p>
        )}

        {/* Fiche : panneau droit sur grand écran, tiroir inférieur repliable sur mobile/tablette */}
        <aside
          aria-labelledby={selected ? "component-sheet-title" : undefined}
          aria-label={selected ? undefined : "Fiche composant"}
          className={cn(
            glass,
            selected && "xl:absolute xl:bottom-20 xl:right-3 xl:top-[4.25rem] xl:z-10 xl:block xl:w-[340px] xl:overflow-y-auto",
            selected
              ? cn(
                  "fixed inset-x-0 bottom-16 z-40 rounded-b-none border-b-0 lg:bottom-0 xl:rounded-b-xl xl:border-b",
                  sheetExpanded ? "max-h-[72dvh] overflow-y-auto" : "max-h-[118px] overflow-hidden xl:max-h-none",
                )
              : "hidden",
          )}
        >
          {selected && (
            <>
              <button type="button" onClick={() => setSheetExpanded((e) => !e)} aria-expanded={sheetExpanded} className="flex w-full items-center justify-center gap-2 pt-2 text-[0.7rem] text-muted xl:hidden">
                <span className="h-1 w-10 rounded-full bg-line-strong" aria-hidden />
                <span className="sr-only">{sheetExpanded ? "Réduire la fiche" : "Afficher toute la fiche"}</span>
              </button>
              <ComponentSheet key={selected} slug={selected} vehicleId={vehicleId} illustrative={model.isIllustrative || !!model.overlayNodes?.length} onClose={() => setSelected(null)} loadSheet={loadSheet} fileHref={fileHref} />
              {!sheetExpanded && (
                <button type="button" onClick={() => setSheetExpanded(true)} className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-surface to-transparent text-[0.72rem] text-ink-2 xl:hidden">
                  Voir la fiche complète
                </button>
              )}
            </>
          )}
        </aside>
      </section>

      <p className="text-[0.72rem] text-muted">
        Glisser pour tourner · molette, pincement ou boutons −/+ pour zoomer · clic droit ou deux doigts pour déplacer · cliquer une pièce pour ouvrir sa fiche.
        {model.credit && <span className="lg:hidden"> Modèle 3D : {model.credit}</span>}
      </p>

      {treeOpen && (
        <div className="fixed inset-0 z-50 flex flex-col bg-bg/95 backdrop-blur lg:hidden" role="dialog" aria-modal="true" aria-label="Liste des pièces">
          <div className="flex items-center justify-between border-b border-line p-3">
            <p className="font-semibold">Pièces du modèle</p>
            <button type="button" onClick={() => setTreeOpen(false)} className="grid size-9 place-items-center rounded-full hover:bg-surface-2" aria-label="Fermer la liste">
              <X size={18} />
            </button>
          </div>
          {model.paints && (
            <div className="flex items-center gap-2 border-b border-line px-4 py-2 text-xs text-ink-2" role="radiogroup" aria-label="Teinte de carrosserie">
              Teinte :
              {model.paints.map((p) => (
                <button key={p.name} type="button" role="radio" aria-checked={paint === p.name} aria-label={`Teinte ${p.label}`} onClick={() => setPaint(p.name)} className={cn("size-6 rounded-full border-2", paint === p.name ? "border-white" : "border-white/20")} style={{ background: p.swatch }} />
              ))}
            </div>
          )}
          {tree}
        </div>
      )}
    </div>
  );
}

function NoWebgl({ failed = false }: { failed?: boolean }) {
  return (
    <div className="absolute inset-0 grid place-items-center p-6 text-center text-sm">
      <div className="max-w-sm">
        <p className="font-medium">{failed ? "Le modèle 3D n’a pas pu être chargé" : "La 3D n’est pas disponible sur cet appareil"}</p>
        <p className="mt-1 text-muted">
          {failed ? "Le fichier est absent ou illisible. " : "WebGL est désactivé ou non pris en charge. "}
          Utilisez la liste des pièces pour consulter les fiches des composants.
        </p>
      </div>
    </div>
  );
}
