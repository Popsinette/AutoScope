"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { Hand, Loader2 } from "lucide-react";
import { CarSilhouette } from "@/components/brand/car-silhouette";
import { cn } from "@/components/ui/cn";
import { COMPONENTS } from "../../../prisma/demo-data/components";
import { SceneBoundary, useLowQuality, useMediaQuery, useResolvedModel, webglAvailable } from "./scene-utils";
import type { ExplorerModel } from "./types";

const Scene = dynamic(() => import("./scene"), { ssr: false, loading: () => <ShowcaseLoading /> });

function ShowcaseLoading() {
  return (
    <div className="absolute inset-0 grid place-items-center text-xs text-muted" role="status">
      <span className="flex items-center gap-2">
        <Loader2 size={16} className="animate-spin text-accent-ink" aria-hidden /> Chargement du modèle 3D…
      </span>
    </div>
  );
}

const SHOWCASE_COMPONENTS = Object.fromEntries(
  COMPONENTS.map((c) => [c.slug, { id: c.slug, slug: c.slug, name: c.name, family: c.family, system: c.system, electronicKind: c.electronicKind ?? null }]),
);
const NO_HIDDEN = new Set<string>();
const NO_CAMERA = { preset: "reset" as const, nonce: 0 };

/**
 * Vitrine 3D du véhicule (page d'accueil) : rotation automatique lente,
 * rotation au doigt ou à la souris, sans bloquer le défilement de la page.
 * Un clic sur une pièce ouvre sa fiche dans la vue 3D complète.
 */
export function VehicleShowcase({
  model: fallbackModel,
  preferredModel,
  vehicleId,
  className,
}: {
  model: ExplorerModel;
  preferredModel?: ExplorerModel | null;
  vehicleId: string;
  className?: string;
}) {
  const router = useRouter();
  const resolved = useResolvedModel(fallbackModel, preferredModel);
  const model = resolved.model;
  const container = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [webgl, setWebgl] = useState<boolean | null>(null);
  const [ready, setReady] = useState(false);
  const [hovered, setHovered] = useState<string | null>(null);
  const [paint, setPaint] = useState<string | null>(model.defaultPaint ?? null);
  const lowQuality = useLowQuality();
  const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");

  useEffect(() => setWebgl(webglAvailable()), []);
  useEffect(() => setPaint(model.defaultPaint ?? null), [model]);
  // La rotation automatique ne tourne que lorsque la vitrine est à l'écran.
  useEffect(() => {
    const el = container.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: 0.15 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const fallback = useMemo(
    () => (
      <div className="absolute inset-0 grid place-items-center p-6">
        <CarSilhouette className="max-w-md opacity-70" />
        <p className="absolute bottom-3 text-xs text-muted">Vue 3D indisponible sur cet appareil.</p>
      </div>
    ),
    [],
  );

  return (
    <div ref={container} className={cn("relative overflow-hidden bg-[#0c0d10]", className)} data-testid="vehicle-showcase" data-ready={ready ? "1" : "0"} data-model={model.id}>
      {webgl === false ? (
        fallback
      ) : webgl === null || !resolved.checked ? (
        <ShowcaseLoading />
      ) : (
        <SceneBoundary fallback={fallback}>
          <Scene
            key={model.id}
            showcase
            autoRotate={visible}
            model={model}
            components={SHOWCASE_COMPONENTS}
            mode="exterieur"
            selectedSlug={null}
            hiddenFamilies={NO_HIDDEN}
            explode={0}
            paint={paint}
            lowQuality={lowQuality}
            reducedMotion={reducedMotion}
            camera={NO_CAMERA}
            focusNonce={0}
            onSelect={(slug) => slug && router.push(`/vue-3d?v=${vehicleId}&composant=${slug}`)}
            onHover={setHovered}
            onReady={() => setReady(true)}
          />
        </SceneBoundary>
      )}
      {!ready && webgl !== false && <ShowcaseLoading />}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#0c0d10] to-transparent" aria-hidden />
      {hovered && (
        <p className="pointer-events-none absolute left-1/2 top-3 -translate-x-1/2 rounded-full bg-black/70 px-3 py-1 text-xs" aria-hidden>
          {SHOWCASE_COMPONENTS[hovered]?.name} · ouvrir la fiche
        </p>
      )}
      {ready && (
        <p className="pointer-events-none absolute bottom-3 right-3 hidden items-center gap-1.5 text-[0.7rem] text-muted sm:flex">
          <Hand size={13} aria-hidden /> Faites pivoter le véhicule
        </p>
      )}
      {model.paints && ready && (
        <div className="absolute right-3 top-3 flex gap-1.5 rounded-full border border-line/70 bg-black/40 p-1.5 backdrop-blur" role="radiogroup" aria-label="Teinte de carrosserie">
          {model.paints.map((p) => (
            <button
              key={p.name}
              type="button"
              role="radio"
              aria-checked={paint === p.name}
              aria-label={`Teinte ${p.label}`}
              title={p.label}
              onClick={() => setPaint(p.name)}
              className={cn("size-4 rounded-full border-2", paint === p.name ? "border-white" : "border-white/25 hover:border-white/60")}
              style={{ background: p.swatch }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
