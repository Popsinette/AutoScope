"use client";

/**
 * Scène 3D générique : le même contrôleur gère le véhicule de démonstration et
 * les modèles GLB importés. Il s'appuie uniquement sur les noms des objets et la
 * table de correspondance nœud → fiche composant.
 */
import { CameraControls, Environment, Grid, Lightformer, useGLTF } from "@react-three/drei";
import { Canvas, useThree, type ThreeEvent } from "@react-three/fiber";
import { forwardRef, Suspense, useCallback, useEffect, useImperativeHandle, useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { appearanceFor, explodeDirection, type ViewerMode } from "@/lib/viewer-modes";
import { DemoCar } from "./demo-car";
import { ELECTRONIC_COLORS, FAMILY_COLORS, SELECTION_COLOR } from "./palette";
import type { CameraPreset, ExplorerComponent, ExplorerModel } from "./types";

export interface SceneProps {
  model: ExplorerModel;
  components: Record<string, ExplorerComponent>;
  mode: ViewerMode;
  selectedSlug: string | null;
  hiddenFamilies: ReadonlySet<string>;
  explode: number;
  lowQuality: boolean;
  reducedMotion: boolean;
  camera: { preset: CameraPreset; nonce: number };
  focusNonce: number;
  onSelect: (slug: string | null) => void;
  onHover: (slug: string | null) => void;
  onReady: (info: { mappedNodes: number; hasInterior: boolean; unmappedMeshes: number }) => void;
}

interface Part {
  mesh: THREE.Mesh;
  slug: string | null;
  info: ExplorerComponent | null;
  original: THREE.Material | THREE.Material[];
}

interface MovableNode {
  object: THREE.Object3D;
  base: THREE.Vector3;
  localDir: THREE.Vector3;
}

const UNMAPPED = "NON_ASSOCIE";

function slugFor(object: THREE.Object3D, mapping: Record<string, string>, stop: THREE.Object3D) {
  let current: THREE.Object3D | null = object;
  while (current && current !== stop.parent) {
    if (current.name && mapping[current.name]) return { slug: mapping[current.name], node: current };
    current = current.parent;
  }
  return { slug: null, node: object };
}

function GlbModel({ url, onLoaded }: { url: string; onLoaded: (root: THREE.Object3D) => void }) {
  // Draco désactivé : le décodeur serait chargé depuis un CDN externe (voir docs/MODELES_3D.md).
  const { scene } = useGLTF(url, false);
  useLayoutEffect(() => onLoaded(scene), [scene, onLoaded]);
  useEffect(() => () => useGLTF.clear(url), [url]);
  return <primitive object={scene} />;
}

const ModelController = forwardRef<{ frame: (preset: CameraPreset) => void; focus: (slug: string | null) => void }, Omit<SceneProps, "camera" | "focusNonce"> & { controls: React.RefObject<CameraControls | null> }>(
  function ModelController(props, ref) {
    const { model, components, mode, selectedSlug, hiddenFamilies, explode, onSelect, onHover, onReady, controls, reducedMotion } = props;
    const invalidate = useThree((s) => s.invalidate);
    const demoRef = useRef<THREE.Group>(null);
    const parts = useRef<Part[]>([]);
    const nodes = useRef<MovableNode[]>([]);
    const bounds = useRef(new THREE.Box3());
    const styleOf = useRef(new Map<THREE.Mesh, string>());

    const materials = useMemo(() => {
      const ghost = new THREE.MeshStandardMaterial({ color: "#9aa3ad", transparent: true, opacity: 0.1, depthWrite: false, roughness: 0.2, metalness: 0.1, side: THREE.DoubleSide });
      const dim = new THREE.MeshStandardMaterial({ color: "#4a4e55", transparent: true, opacity: 0.35, depthWrite: false });
      const highlight = new THREE.MeshStandardMaterial({ color: SELECTION_COLOR, emissive: SELECTION_COLOR, emissiveIntensity: 0.55, roughness: 0.35 });
      const family = Object.fromEntries(Object.entries(FAMILY_COLORS).map(([k, c]) => [k, new THREE.MeshStandardMaterial({ color: c, roughness: 0.45, metalness: 0.3 })]));
      const electronic = Object.fromEntries(Object.entries(ELECTRONIC_COLORS).map(([k, c]) => [k, new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: 0.35, roughness: 0.4 })]));
      return { ghost, dim, highlight, family, electronic };
    }, []);

    // Libération des ressources GPU au démontage.
    useEffect(
      () => () => {
        const all = [materials.ghost, materials.dim, materials.highlight, ...Object.values(materials.family), ...Object.values(materials.electronic)];
        all.forEach((m) => m.dispose());
        for (const p of parts.current) {
          p.mesh.geometry.dispose();
          (Array.isArray(p.original) ? p.original : [p.original]).forEach((m) => m.dispose());
        }
      },
      [materials],
    );

    const registered = useRef<THREE.Object3D | null>(null);
    const register = (root: THREE.Object3D) => {
      // Une seule inscription par racine : les matériaux d'origine ne doivent pas être écrasés.
      if (registered.current === root) return;
      registered.current = root;
      root.updateMatrixWorld(true);
      const list: Part[] = [];
      const movable = new Map<THREE.Object3D, MovableNode>();
      bounds.current.setFromObject(root);
      const center = bounds.current.getCenter(new THREE.Vector3());
      const size = bounds.current.getSize(new THREE.Vector3()).length();
      root.traverse((obj) => {
        if (!(obj instanceof THREE.Mesh)) return;
        const { slug, node } = slugFor(obj, model.mapping, root);
        const info = slug ? (components[slug] ?? null) : null;
        list.push({ mesh: obj, slug: info ? slug : null, info, original: obj.material });
        obj.userData.cvSlug = info ? slug : null;
        if (!movable.has(node) && node.parent) {
          const nodeCenter = new THREE.Box3().setFromObject(node).getCenter(new THREE.Vector3());
          const dir = new THREE.Vector3(...explodeDirection(center.toArray(), nodeCenter.toArray(), info?.family ?? null)).multiplyScalar(size * 0.28);
          const worldPos = node.getWorldPosition(new THREE.Vector3());
          const a = node.parent.worldToLocal(worldPos.clone());
          const b = node.parent.worldToLocal(worldPos.clone().add(dir));
          movable.set(node, { object: node, base: node.position.clone(), localDir: b.sub(a) });
        }
      });
      parts.current = list;
      nodes.current = [...movable.values()];
      const mappedNodes = new Set(list.filter((p) => p.slug).map((p) => p.mesh.uuid)).size;
      onReady({
        mappedNodes,
        hasInterior: list.some((p) => p.info?.family === "HABITACLE"),
        unmappedMeshes: list.filter((p) => !p.slug).length,
      });
      apply();
      frame("reset", false);
    };

    const apply = () => {
      for (const p of parts.current) {
        const appearance = appearanceFor(mode, p.info);
        const familyKey = p.info?.family ?? UNMAPPED;
        const isSelected = !!selectedSlug && p.slug === selectedSlug;
        p.mesh.visible = isSelected || (appearance.visible && !hiddenFamilies.has(familyKey));
        let style: string = appearance.visible ? appearance.style : "original";
        if (isSelected) style = "highlight";
        styleOf.current.set(p.mesh, style);
        p.mesh.material =
          style === "highlight"
            ? materials.highlight
            : style === "ghost"
              ? materials.ghost
              : style === "dim"
                ? materials.dim
                : style === "family" && p.info
                  ? materials.family[p.info.family]
                  : style === "electronic" && p.info?.electronicKind
                    ? materials.electronic[p.info.electronicKind]
                    : p.original;
        p.mesh.renderOrder = style === "ghost" ? 2 : 0;
      }
      for (const n of nodes.current) n.object.position.copy(n.base).addScaledVector(n.localDir, explode);
      invalidate();
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(apply, [mode, selectedSlug, hiddenFamilies, explode]);

    const registerRef = useRef(register);
    registerRef.current = register;
    const onGlbLoaded = useCallback((root: THREE.Object3D) => registerRef.current(root), []);

    useLayoutEffect(() => {
      if (model.kind === "PROCEDURAL_DEMO" && demoRef.current) register(demoRef.current);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [model.kind]);

    const frame = (preset: CameraPreset, transition = !reducedMotion) => {
      const c = controls.current;
      if (!c) return;
      const box = bounds.current;
      if (box.isEmpty()) return;
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());
      const d = Math.max(size.x, size.z) * 1.45;
      const h = size.y;
      c.minDistance = 0.05;
      c.maxDistance = d * 4;
      switch (preset) {
        case "avant":
          void c.setLookAt(center.x, center.y + h * 0.3, center.z + d, center.x, center.y, center.z, transition);
          break;
        case "arriere":
          void c.setLookAt(center.x, center.y + h * 0.3, center.z - d, center.x, center.y, center.z, transition);
          break;
        case "profil":
          void c.setLookAt(center.x + d, center.y + h * 0.15, center.z, center.x, center.y, center.z, transition);
          break;
        case "dessus":
          void c.setLookAt(center.x, center.y + d * 1.15, center.z + 0.01, center.x, center.y, center.z, transition);
          break;
        case "interieur": {
          const seats = parts.current.filter((p) => p.info?.slug === "sieges" || p.info?.slug === "volant");
          if (seats.length === 0) return;
          const seatBox = new THREE.Box3();
          seats.forEach((p) => seatBox.expandByObject(p.mesh));
          const wheel = parts.current.find((p) => p.info?.slug === "volant");
          const x = wheel ? new THREE.Box3().setFromObject(wheel.mesh).getCenter(new THREE.Vector3()).x : seatBox.getCenter(new THREE.Vector3()).x;
          const eyeY = seatBox.max.y + 0.05;
          const z = seatBox.getCenter(new THREE.Vector3()).z - 0.1;
          void c.setLookAt(x, eyeY, z, x, eyeY - 0.15, z + 2, transition);
          break;
        }
        default:
          void c.setLookAt(center.x + d * 0.75, center.y + h * 0.9, center.z + d * 0.85, center.x, center.y, center.z, transition);
      }
    };

    useImperativeHandle(ref, () => ({
      frame,
      focus: (slug: string | null) => {
        const c = controls.current;
        if (!c || !slug) return;
        const box = new THREE.Box3();
        parts.current.filter((p) => p.slug === slug).forEach((p) => box.expandByObject(p.mesh));
        if (box.isEmpty()) return;
        // Marge proportionnelle : une petite pièce reste visible dans son contexte.
        const pad = Math.max(0.5, box.getSize(new THREE.Vector3()).length() * 0.6);
        void c.fitToBox(box, !reducedMotion, { paddingTop: pad, paddingBottom: pad, paddingLeft: pad, paddingRight: pad });
      },
    }));

    const pick = (e: ThreeEvent<MouseEvent | PointerEvent>) => {
      // On ignore les objets fantômes (carrosserie translucide) pour atteindre les pièces internes.
      const hits = e.intersections.filter((i) => i.object.visible);
      const solid = hits.find((i) => styleOf.current.get(i.object as THREE.Mesh) !== "ghost" && i.object.userData.cvSlug);
      const any = hits.find((i) => i.object.userData.cvSlug);
      return ((solid ?? any)?.object.userData.cvSlug as string | undefined) ?? null;
    };

    return (
      <group
        onClick={(e) => {
          if (e.delta > 6) return;
          e.stopPropagation();
          onSelect(pick(e));
        }}
        onPointerMove={(e) => {
          e.stopPropagation();
          const slug = pick(e);
          document.body.style.cursor = slug ? "pointer" : "";
          onHover(slug);
        }}
        onPointerOut={() => {
          document.body.style.cursor = "";
          onHover(null);
        }}
      >
        {model.kind === "PROCEDURAL_DEMO" ? <DemoCar ref={demoRef} /> : <GlbModel url={model.url!} onLoaded={onGlbLoaded} />}
      </group>
    );
  },
);

function Studio({ lowQuality }: { lowQuality: boolean }) {
  return (
    <>
      <color attach="background" args={["#0f1013"]} />
      <hemisphereLight args={["#dfe7f2", "#16171a", 0.8]} />
      <directionalLight position={[5, 8, 6]} intensity={2.2} />
      <directionalLight position={[-6, 4, -6]} intensity={1.0} color="#c9d6ff" />
      <Environment resolution={lowQuality ? 32 : 128} frames={1}>
        <Lightformer form="rect" intensity={2.5} position={[0, 5, 0]} rotation-x={Math.PI / 2} scale={[10, 4, 1]} />
        <Lightformer form="rect" intensity={1.2} position={[6, 2, 0]} rotation-y={-Math.PI / 2} scale={[8, 2, 1]} />
        <Lightformer form="rect" intensity={1.2} position={[-6, 2, 0]} rotation-y={Math.PI / 2} scale={[8, 2, 1]} />
        <Lightformer form="ring" color="#ff3b2f" intensity={0.25} position={[0, -2, -8]} scale={3} />
      </Environment>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.001, 0]}>
        <circleGeometry args={[3.4, 48]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.45} depthWrite={false} />
      </mesh>
      {!lowQuality && <Grid position={[0, 0, 0]} infiniteGrid cellSize={0.5} sectionSize={2.5} cellColor="#1d2025" sectionColor="#2b2f35" fadeDistance={22} fadeStrength={1.5} />}
    </>
  );
}

export default function Scene(props: SceneProps) {
  const controls = useRef<CameraControls | null>(null);
  const controller = useRef<{ frame: (preset: CameraPreset) => void; focus: (slug: string | null) => void }>(null);

  useEffect(() => {
    if (props.camera.nonce > 0) controller.current?.frame(props.camera.preset);
  }, [props.camera]);
  useEffect(() => {
    // Le slug est transmis explicitement : le contenu du Canvas est rendu par un réconciliateur séparé
    // et peut ne pas avoir encore reçu la nouvelle sélection.
    if (props.focusNonce > 0) controller.current?.focus(props.selectedSlug);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.focusNonce]);

  return (
    <Canvas
      frameloop="demand"
      dpr={props.lowQuality ? [1, 1.25] : [1, 2]}
      gl={{ antialias: !props.lowQuality, powerPreference: "high-performance", preserveDrawingBuffer: false }}
      camera={{ position: [6, 3, 7], fov: 38, near: 0.02, far: 200 }}
      onPointerMissed={(e) => {
        if (e.type === "click") props.onSelect(null);
      }}
      aria-hidden
    >
      <Studio lowQuality={props.lowQuality} />
      <Suspense fallback={null}>
        <ModelController ref={controller} {...props} controls={controls} />
      </Suspense>
      <CameraControls ref={controls} makeDefault smoothTime={props.reducedMotion ? 0 : 0.25} maxPolarAngle={Math.PI * 0.53} />
    </Canvas>
  );
}
