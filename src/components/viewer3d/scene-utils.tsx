"use client";

/** Utilitaires légers de la vue 3D (sans three.js, pour ne pas alourdir le premier chargement). */
import { Component, useEffect, useState, type ReactNode } from "react";
import type { ExplorerModel } from "./types";

export class SceneBoundary extends Component<{ children: ReactNode; fallback: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error: unknown) {
    console.error("Scène 3D indisponible :", error);
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

export function useMediaQuery(query: string) {
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

export function webglAvailable() {
  try {
    const canvas = document.createElement("canvas");
    return !!(canvas.getContext("webgl2") || canvas.getContext("webgl"));
  } catch {
    return false;
  }
}

let software: boolean | undefined;
/** Rendu WebGL logiciel (pas d'accélération matérielle) : les effets coûteux sont alors désactivés. */
function softwareRendering() {
  if (software !== undefined) return software;
  try {
    const gl = document.createElement("canvas").getContext("webgl");
    const info = gl?.getExtension("WEBGL_debug_renderer_info");
    const renderer = info && gl ? String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL)) : "";
    software = /swiftshader|llvmpipe|software|basic render/i.test(renderer);
    gl?.getExtension("WEBGL_lose_context")?.loseContext();
  } catch {
    software = false;
  }
  return software;
}

/** Qualité réduite (sans sol réfléchissant) : petit écran tactile ou rendu logiciel. */
export function useLowQuality() {
  const small = useMediaQuery("(max-width: 768px), (pointer: coarse)");
  const [slow, setSlow] = useState(false);
  useEffect(() => setSlow(softwareRendering()), []);
  return small || slow;
}

/**
 * Modèle effectivement affiché : le modèle dédié au véhicule s'il est installé
 * (fichier présent), sinon le modèle de repli. Un fichier absent ne casse rien.
 */
export function useResolvedModel(model: ExplorerModel, preferred: ExplorerModel | null | undefined) {
  const [state, setState] = useState<{ model: ExplorerModel; missing: ExplorerModel | null; checked: boolean }>({ model, missing: null, checked: !preferred });
  useEffect(() => {
    if (!preferred?.url) {
      setState({ model, missing: null, checked: true });
      return;
    }
    let cancelled = false;
    fetch(preferred.url, { method: "HEAD" })
      .then((res) => {
        // Un hébergement monopage peut répondre 200 avec sa page HTML pour un fichier absent.
        const installed = res.ok && !(res.headers.get("content-type") ?? "").includes("html");
        if (!cancelled) setState(installed ? { model: preferred, missing: null, checked: true } : { model, missing: preferred, checked: true });
      })
      .catch(() => !cancelled && setState({ model, missing: preferred, checked: true }));
    return () => {
      cancelled = true;
    };
    // Les objets modèle sont recréés à chaque rendu du parent : on ne revérifie que si les fichiers changent.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [model.id, model.url, preferred?.url]);
  return state;
}

