"use client";

/**
 * Scène 3D générique : le même contrôleur gère les modèles GLB (catalogue ou
 * import) et le véhicule procédural. Il s'appuie uniquement sur les noms des
 * objets et la table de correspondance nœud → fiche composant.
 */
import { CameraControls, ContactShadows, Environment, Lightformer, MeshReflectorMaterial, useGLTF, useProgress } from "@react-three/drei";
import { Canvas, useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import CameraControlsImpl from "camera-controls";
import { forwardRef, Suspense, useCallback, useEffect, useImperativeHandle, useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { suggestComponentSlug } from "@/lib/gltf";
import { appearanceFor, explodeDirection, type ViewerMode } from "@/lib/viewer-modes";
import { DemoCar } from "./demo-car";
import { ELECTRONIC_COLORS, FAMILY_COLORS, SELECTION_COLOR } from "./palette";
import type { CameraPreset, ExplorerComponent, ExplorerModel } from "./types";

const ACTION = CameraControlsImpl.ACTION;

export interface SceneProps {
  model: ExplorerModel;
  components: Record<string, ExplorerComponent>;
  mode: ViewerMode;
  selectedSlug: string | null;
  hiddenFamilies: ReadonlySet<string>;
  explode: number;
  /** Opacité de la carrosserie translucide (0,04 à 0,6). */
  ghostOpacity?: number;
  /** N'afficher que la pièce sélectionnée. */
  isolate?: boolean;
  paint?: string | null;
  lowQuality: boolean;
  reducedMotion: boolean;
  camera: { preset: CameraPreset; nonce: number };
  focusNonce: number;
  zoom?: { direction: 1 | -1; nonce: number };
  /** Vitrine (page d'accueil) : rotation automatique, pas de zoom, défilement tactile préservé. */
  showcase?: boolean;
  autoRotate?: boolean;
  onSelect: (slug: string | null) => void;
  onHover: (slug: string | null) => void;
  onReady: (info: SceneReadyInfo) => void;
}

export interface SceneReadyInfo {
  mappedNodes: number;
  hasInterior: boolean;
  unmappedMeshes: number;
  /** Fiches effectivement présentes dans la scène. */
  slugs: string[];
}

interface Part {
  mesh: THREE.Mesh;
  slug: string | null;
  info: ExplorerComponent | null;
  original: THREE.Material | THREE.Material[];
}

interface MovableNode {
  object: THREE.Object3D;
  /** Position locale d'origine. */
  base: THREE.Vector3;
  /** Position monde d'origine et direction d'éclatement (monde). */
  baseWorld: THREE.Vector3;
  worldDir: THREE.Vector3;
  depth: number;
}

interface Controller {
  frame: (preset: CameraPreset) => void;
  focus: (slug: string | null) => void;
  zoom: (direction: 1 | -1) => void;
}

type PaintSelector = (variant: string) => Promise<void>;

const UNMAPPED = "NON_ASSOCIE";
const BACKGROUND = "#0c0d10";

// Repères du véhicule procédural (demo-car.tsx), utilisés pour recaler les organes illustratifs.
const DEMO_FRONT_AXLE = 1.4;
const DEMO_REAR_AXLE = -1.35;
const DEMO_TRACK = 0.8;
const DEMO_WHEEL_Y = 0.34;
const DEMO_HEIGHT = 1.34;
/** Étendue longitudinale des organes internes (radiateur à l'avant, silencieux à l'arrière). */
const DEMO_INTERNALS_LENGTH = 4.3;

function slugFor(object: THREE.Object3D, mapping: Record<string, string>, stop: THREE.Object3D, autoMap: boolean) {
  let current: THREE.Object3D | null = object;
  while (current && current !== stop.parent) {
    if (current.name && mapping[current.name]) return { slug: mapping[current.name], node: current };
    if (autoMap && current.name) {
      const guess = suggestComponentSlug(current.name);
      if (guess) return { slug: guess, node: current };
    }
    current = current.parent;
  }
  return { slug: null, node: object };
}

/** Centre des roues avant/arrière d'un modèle (noms « Wheel(Front|Rear)(L|R) »), sinon estimation. */
function wheelReference(root: THREE.Object3D) {
  root.updateMatrixWorld(true);
  const centers = { front: [] as THREE.Vector3[], rear: [] as THREE.Vector3[] };
  root.traverse((o) => {
    const m = /^Wheel(Front|Rear)(L|R)$/i.exec(o.name);
    if (m) centers[m[1].toLowerCase() as "front" | "rear"].push(new THREE.Box3().setFromObject(o).getCenter(new THREE.Vector3()));
  });
  if (centers.front.length && centers.rear.length) {
    const avg = (list: THREE.Vector3[]) => list.reduce((a, b) => a.add(b), new THREE.Vector3()).divideScalar(list.length);
    const f = avg(centers.front);
    const r = avg(centers.rear);
    const track = centers.front.reduce((m, c) => Math.max(m, Math.abs(c.x)), 0);
    return { front: f.z, rear: r.z, y: (f.y + r.y) / 2, track };
  }
  const box = new THREE.Box3().setFromObject(root);
  const size = box.getSize(new THREE.Vector3());
  const c = box.getCenter(new THREE.Vector3());
  return { front: c.z + size.z * 0.31, rear: c.z - size.z * 0.31, y: box.min.y + size.y * 0.25, track: size.x * 0.38 };
}

function GlbModel({
  model,
  onLoaded,
}: {
  model: ExplorerModel;
  onLoaded: (root: THREE.Object3D, selectPaint: PaintSelector | null, identity: THREE.Object3D) => void;
}) {
  const url = model.url!;
  // Draco désactivé : son décodeur serait chargé depuis un CDN externe. Meshopt est inclus.
  const gltf = useGLTF(url, false);
  const wrapper = useRef<THREE.Group>(null);
  const overlay = useRef<THREE.Group>(null);

  useLayoutEffect(() => {
    if (!wrapper.current) return;
    if (overlay.current && model.overlayNodes?.length) {
      // Recalage des organes illustratifs sur les essieux réels du modèle.
      const ref = wheelReference(gltf.scene);
      const body = new THREE.Box3().setFromObject(gltf.scene);
      const bodySize = body.getSize(new THREE.Vector3());
      const s = Math.abs(ref.front - ref.rear) / (DEMO_FRONT_AXLE - DEMO_REAR_AXLE);
      // Les organes doivent rester dans l'enveloppe du modèle (plus bas ou plus court que le véhicule schématique).
      const sy = Math.min(s, bodySize.y / DEMO_HEIGHT);
      const sz = Math.min(s, (bodySize.z * 0.9) / DEMO_INTERNALS_LENGTH);
      const axleMid = (ref.front + ref.rear) / 2;
      overlay.current.scale.set(ref.track / DEMO_TRACK, sy, sz);
      overlay.current.position.set(0, ref.y - DEMO_WHEEL_Y * sy, axleMid - ((DEMO_FRONT_AXLE + DEMO_REAR_AXLE) / 2) * sz);
    }
    // Parseur de three-stdlib (utilisé par Drei) : API identique à celui de three.js.
    const parser = gltf.parser as unknown as {
      getDependency(type: "material", index: number): Promise<THREE.Material>;
      assignFinalMaterial(mesh: THREE.Mesh): void;
    };
    const variantNames: string[] = (gltf.userData?.gltfExtensions?.KHR_materials_variants?.variants ?? []).map((v: { name: string }) => v.name);
    const selectPaint: PaintSelector | null = variantNames.length
      ? async (name) => {
          const index = variantNames.indexOf(name);
          if (index < 0) return;
          const meshes: THREE.Mesh[] = [];
          gltf.scene.traverse((o) => {
            if ((o as THREE.Mesh).isMesh && o.userData.gltfExtensions?.KHR_materials_variants) meshes.push(o as THREE.Mesh);
          });
          await Promise.all(
            meshes.map(async (mesh) => {
              mesh.userData.cvPaintOriginal ??= mesh.userData.cvOriginal ?? mesh.material;
              const mapping = mesh.userData.gltfExtensions.KHR_materials_variants.mappings.find((m: { variants: number[] }) => m.variants.includes(index));
              if (mapping) {
                mesh.material = await parser.getDependency("material", mapping.material);
                parser.assignFinalMaterial(mesh);
              } else {
                mesh.material = mesh.userData.cvPaintOriginal;
              }
              mesh.userData.cvOriginal = mesh.material;
            }),
          );
        }
      : null;
    onLoaded(wrapper.current, selectPaint, gltf.scene);
  }, [gltf, model.overlayNodes, onLoaded]);

  return (
    <group ref={wrapper}>
      <group rotation-y={model.rotationY ?? 0}>
        <primitive object={gltf.scene} />
      </group>
      {model.overlayNodes?.length ? (
        <group ref={overlay} name="CarView_Illustratif">
          <DemoCar only={model.overlayNodes} />
        </group>
      ) : null}
    </group>
  );
}

const ModelController = forwardRef<Controller, Omit<SceneProps, "camera" | "focusNonce" | "zoom"> & { controls: React.RefObject<CameraControls | null> }>(
  function ModelController(props, ref) {
    const { model, components, mode, selectedSlug, hiddenFamilies, explode, onSelect, onHover, onReady, controls, reducedMotion, ghostOpacity = 0.12, isolate = false, paint, showcase } = props;
    const invalidate = useThree((s) => s.invalidate);
    const camera = useThree((s) => s.camera);
    const viewport = useThree((s) => s.size);
    const demoRef = useRef<THREE.Group>(null);
    const parts = useRef<Part[]>([]);
    const nodes = useRef<MovableNode[]>([]);
    const bounds = useRef(new THREE.Box3());
    const styleOf = useRef(new Map<THREE.Mesh, string>());
    const paintSelector = useRef<PaintSelector | null>(null);

    const materials = useMemo(() => {
      const ghost = new THREE.MeshPhysicalMaterial({ color: "#a9b4c2", transparent: true, opacity: 0.12, depthWrite: false, roughness: 0.15, metalness: 0.2, clearcoat: 1, side: THREE.DoubleSide });
      const dim = new THREE.MeshStandardMaterial({ color: "#4a4e55", transparent: true, opacity: 0.3, depthWrite: false });
      const highlight = new THREE.MeshStandardMaterial({ color: SELECTION_COLOR, emissive: SELECTION_COLOR, emissiveIntensity: 0.6, roughness: 0.35 });
      const family = Object.fromEntries(Object.entries(FAMILY_COLORS).map(([k, c]) => [k, new THREE.MeshStandardMaterial({ color: c, roughness: 0.4, metalness: 0.35 })]));
      const electronic = Object.fromEntries(Object.entries(ELECTRONIC_COLORS).map(([k, c]) => [k, new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: 0.45, roughness: 0.4 })]));
      return { ghost, dim, highlight, family, electronic };
    }, []);

    // Au démontage : état d'origine restauré (le modèle reste en cache pour une prochaine visite)
    // et ressources GPU libérées ; three.js les renverra à la carte graphique si le modèle réapparaît.
    useEffect(
      () => () => {
        const all = [materials.ghost, materials.dim, materials.highlight, ...Object.values(materials.family), ...Object.values(materials.electronic)];
        all.forEach((m) => m.dispose());
        for (const n of nodes.current) n.object.position.copy(n.base);
        for (const p of parts.current) {
          p.mesh.material = p.original;
          p.mesh.visible = true;
          p.mesh.geometry.dispose();
          (Array.isArray(p.original) ? p.original : [p.original]).forEach((m) => m.dispose());
        }
        registered.current = null;
      },
      [materials],
    );

    const registered = useRef<THREE.Object3D | null>(null);
    const register = (root: THREE.Object3D, selectPaint: PaintSelector | null = null, identity: THREE.Object3D = root) => {
      // Une seule inscription par modèle chargé : les matériaux d'origine ne doivent pas être écrasés.
      if (registered.current === identity) return;
      registered.current = identity;
      paintSelector.current = selectPaint;
      root.updateMatrixWorld(true);
      const list: Part[] = [];
      const movable = new Map<THREE.Object3D, MovableNode>();
      bounds.current.setFromObject(root);
      const center = bounds.current.getCenter(new THREE.Vector3());
      const size = bounds.current.getSize(new THREE.Vector3()).length();
      root.traverse((obj) => {
        if (!(obj instanceof THREE.Mesh)) return;
        obj.castShadow = true;
        const { slug, node } = slugFor(obj, model.mapping, root, !!model.autoMap);
        const info = slug ? (components[slug] ?? null) : null;
        obj.userData.cvOriginal = obj.material;
        list.push({ mesh: obj, slug: info ? slug : null, info, original: obj.material });
        obj.userData.cvSlug = info ? slug : null;
        if (!movable.has(node) && node.parent) {
          const nodeCenter = new THREE.Box3().setFromObject(node).getCenter(new THREE.Vector3());
          const worldDir = new THREE.Vector3(...explodeDirection(center.toArray(), nodeCenter.toArray(), info?.family ?? null)).multiplyScalar(size * 0.22);
          let depth = 0;
          for (let o: THREE.Object3D | null = node.parent; o; o = o.parent) depth++;
          movable.set(node, { object: node, base: node.position.clone(), baseWorld: node.getWorldPosition(new THREE.Vector3()), worldDir, depth });
        }
      });
      parts.current = list;
      // Parents d'abord : la position des enfants est calculée après le déplacement de leur parent.
      nodes.current = [...movable.values()].sort((a, b) => a.depth - b.depth);
      const mappedNodes = new Set(list.filter((p) => p.slug).map((p) => p.mesh.uuid)).size;
      onReady({
        mappedNodes,
        hasInterior: list.some((p) => p.info?.slug === "sieges" || p.info?.slug === "volant"),
        unmappedMeshes: list.filter((p) => !p.slug).length,
        slugs: [...new Set(list.flatMap((p) => (p.slug ? [p.slug] : [])))],
      });
      void applyPaint()
        .catch((error) => console.error("Teinte indisponible :", error))
        .then(() => {
          apply();
          frame("reset", false);
        });
    };

    const applyPaint = async () => {
      const name = paint ?? model.defaultPaint;
      if (!paintSelector.current || !name) return;
      await paintSelector.current(name);
      for (const p of parts.current) p.original = p.mesh.userData.cvOriginal ?? p.original;
    };

    const apply = () => {
      materials.ghost.opacity = ghostOpacity;
      const isolating = isolate && !!selectedSlug;
      for (const p of parts.current) {
        const appearance = appearanceFor(mode, p.info);
        const familyKey = p.info?.family ?? UNMAPPED;
        const isSelected = !!selectedSlug && p.slug === selectedSlug;
        p.mesh.visible = isSelected || (!isolating && appearance.visible && !hiddenFamilies.has(familyKey));
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
        p.mesh.castShadow = style !== "ghost" && style !== "dim";
      }
      for (const n of nodes.current) {
        if (explode === 0) {
          n.object.position.copy(n.base);
          continue;
        }
        // Cible en coordonnées monde (évite le cumul des déplacements entre parents et enfants).
        n.object.parent!.updateWorldMatrix(true, false);
        n.object.position.copy(n.object.parent!.worldToLocal(n.baseWorld.clone().addScaledVector(n.worldDir, explode)));
      }
      invalidate();
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(apply, [mode, selectedSlug, hiddenFamilies, explode, ghostOpacity, isolate]);
    // Vitrine : recadrage quand le format change (rotation du téléphone, redimensionnement).
    useEffect(() => {
      if (showcase && registered.current) frame("reset", false);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [viewport.width, viewport.height]);
    useEffect(() => {
      if (!registered.current) return;
      void applyPaint().then(apply);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [paint]);

    const registerRef = useRef(register);
    registerRef.current = register;
    const onGlbLoaded = useCallback((root: THREE.Object3D, selectPaint: PaintSelector | null, identity: THREE.Object3D) => registerRef.current(root, selectPaint, identity), []);

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
      // Distance calculée pour que le véhicule tienne dans le cadre quel que soit le format (portrait mobile compris).
      const cam = camera as THREE.PerspectiveCamera;
      const vfov = THREE.MathUtils.degToRad(cam.fov);
      const hfov = 2 * Math.atan(Math.tan(vfov / 2) * cam.aspect);
      const radius = Math.max(size.x, size.z) * 0.5;
      // Contrainte horizontale (longueur du véhicule) et verticale (hauteur + profondeur vue en plongée).
      const fitH = radius / Math.tan(hfov / 2);
      const fitV = (size.y * 0.5 + radius * 0.45) / Math.tan(vfov / 2);
      const fit = Math.max(fitH, fitV) * (showcase ? 1.08 : mode === "eclatee" ? 1.55 : 1.2);
      const target = center.clone().setY(center.y * (showcase ? 0.8 : 0.9));
      c.minDistance = showcase ? fit * 0.6 : 0.05;
      c.maxDistance = fit * 3;
      const look = (dx: number, dy: number, dz: number, distance = fit) => {
        const dir = new THREE.Vector3(dx, dy, dz).normalize().multiplyScalar(distance);
        void c.setLookAt(target.x + dir.x, target.y + dir.y, target.z + dir.z, target.x, target.y, target.z, transition);
      };
      // Vitrine sur écran large : véhicule décalé vers la droite, à l'écart des informations superposées.
      if (showcase) void c.setFocalOffset(cam.aspect > 1.3 ? -radius * 0.3 : 0, cam.aspect > 1.3 ? -size.y * 0.1 : -size.y * 0.3, 0, false);
      switch (preset) {
        case "avant":
          return look(0, 0.35, 1);
        case "arriere":
          return look(0, 0.35, -1);
        case "gauche":
          return look(1, 0.15, 0);
        case "droite":
          return look(-1, 0.15, 0);
        case "dessus":
          return look(0, 1, 0.001, fit * 1.1);
        case "interieur": {
          const seats = parts.current.filter((p) => p.info?.slug === "sieges" || p.info?.slug === "volant");
          if (seats.length === 0) return;
          const seatBox = new THREE.Box3();
          seats.forEach((p) => seatBox.expandByObject(p.mesh));
          const wheel = parts.current.find((p) => p.info?.slug === "volant");
          const x = wheel ? new THREE.Box3().setFromObject(wheel.mesh).getCenter(new THREE.Vector3()).x : seatBox.getCenter(new THREE.Vector3()).x;
          const eyeY = seatBox.max.y + 0.08;
          const z = seatBox.getCenter(new THREE.Vector3()).z - 0.15;
          void c.setLookAt(x, eyeY, z, x, eyeY - 0.12, z + 2, transition);
          return;
        }
        default:
          return showcase ? look(0.8, 0.26, 0.8) : look(0.75, 0.55, 0.85);
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
      zoom: (direction) => {
        const c = controls.current;
        if (!c) return;
        void c.dolly(direction * Math.max(0.4, c.distance * 0.2), !reducedMotion);
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
        {model.kind === "PROCEDURAL_DEMO" ? <DemoCar ref={demoRef} /> : <GlbModel model={model} onLoaded={onGlbLoaded} />}
      </group>
    );
  },
);

/** Studio de présentation : fond sombre, sol réfléchissant, softbox et ombres de contact. */
function Studio({ lowQuality }: { lowQuality: boolean }) {
  return (
    <>
      <color attach="background" args={[BACKGROUND]} />
      <fog attach="fog" args={[BACKGROUND, 10, 26]} />
      <ambientLight intensity={0.12} />
      <directionalLight position={[4, 8, 5]} intensity={1.3} />
      <directionalLight position={[-6, 3, -6]} intensity={0.6} color="#c9d6ff" />
      <Environment resolution={lowQuality ? 64 : 256} frames={1} environmentIntensity={1.05}>
        <Lightformer form="rect" intensity={3.2} position={[0, 6, 0]} rotation-x={Math.PI / 2} scale={[12, 5, 1]} />
        <Lightformer form="rect" intensity={2.2} position={[-6, 1.6, -1]} rotation-y={Math.PI / 2} scale={[12, 1.1, 1]} />
        <Lightformer form="rect" intensity={2.2} position={[6, 1.6, 1]} rotation-y={-Math.PI / 2} scale={[12, 1.1, 1]} />
        <Lightformer form="rect" intensity={1.1} position={[0, 2.2, 8]} scale={[10, 2, 1]} />
        <Lightformer form="rect" intensity={0.9} position={[0, 2.2, -8]} rotation-y={Math.PI} scale={[10, 2, 1]} />
        <Lightformer form="ring" color="#ff3b2f" intensity={0.8} position={[-4, 0.8, -9]} scale={3} />
      </Environment>
      <mesh rotation-x={-Math.PI / 2} position={[0, -0.001, 0]} receiveShadow>
        <planeGeometry args={[60, 60]} />
        {lowQuality ? (
          <meshStandardMaterial color="#0b0c0f" roughness={0.75} metalness={0.2} />
        ) : (
          <MeshReflectorMaterial
            blur={[320, 90]}
            resolution={512}
            mixBlur={1}
            mixStrength={9}
            roughness={0.9}
            depthScale={1.1}
            minDepthThreshold={0.4}
            maxDepthThreshold={1.3}
            color="#0d0e12"
            metalness={0.55}
            mirror={0.35}
          />
        )}
      </mesh>
      <ContactShadows position={[0, 0.002, 0]} opacity={0.82} scale={12} blur={2.2} far={2.6} resolution={lowQuality ? 256 : 512} color="#000000" />
    </>
  );
}

/**
 * Vitrine : rotation au doigt/à la souris uniquement (molette et pincement laissés à la page)
 * et rotation automatique, suspendue pendant et peu après une interaction.
 */
function ShowcaseControls({ controls, autoRotate }: { controls: React.RefObject<CameraControls | null>; autoRotate: boolean }) {
  const pausedUntil = useRef(0);
  useEffect(() => {
    const c = controls.current;
    if (!c) return;
    c.mouseButtons.wheel = ACTION.NONE;
    c.mouseButtons.right = ACTION.NONE;
    c.mouseButtons.middle = ACTION.NONE;
    c.touches.two = ACTION.NONE;
    c.touches.three = ACTION.NONE;
    c.minPolarAngle = Math.PI * 0.3;
    c.maxPolarAngle = Math.PI * 0.47;
    const pause = () => (pausedUntil.current = performance.now() + 5000);
    c.addEventListener("controlstart", pause);
    c.addEventListener("control", pause);
    return () => {
      c.removeEventListener("controlstart", pause);
      c.removeEventListener("control", pause);
    };
  }, [controls]);
  useFrame((_, delta) => {
    if (!autoRotate || performance.now() < pausedUntil.current) return;
    controls.current?.rotate(delta * 0.18, 0, false);
  });
  return null;
}

/** Progression du téléchargement du modèle, affichée par-dessus le canevas. */
function LoadProgress() {
  const { active, progress } = useProgress();
  if (!active) return null;
  return (
    <div className="pointer-events-none absolute inset-0 z-10 grid place-items-center bg-[#0c0d10]/70 text-sm text-ink-2" role="status">
      <div className="flex flex-col items-center gap-3">
        <span>Chargement du modèle 3D…</span>
        <span className="h-1 w-40 overflow-hidden rounded-full bg-surface-3" aria-hidden>
          <span className="block h-full bg-accent transition-[width]" style={{ width: `${Math.round(progress)}%` }} />
        </span>
      </div>
    </div>
  );
}

export default function Scene(props: SceneProps) {
  const controls = useRef<CameraControls | null>(null);
  const controller = useRef<Controller>(null);
  const { showcase = false, autoRotate = false } = props;

  useEffect(() => {
    if (props.camera.nonce > 0) controller.current?.frame(props.camera.preset);
  }, [props.camera]);
  useEffect(() => {
    // Le slug est transmis explicitement : le contenu du Canvas est rendu par un réconciliateur séparé
    // et peut ne pas avoir encore reçu la nouvelle sélection.
    if (props.focusNonce > 0) controller.current?.focus(props.selectedSlug);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.focusNonce]);
  useEffect(() => {
    if (props.zoom && props.zoom.nonce > 0) controller.current?.zoom(props.zoom.direction);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.zoom?.nonce]);

  return (
    <>
      <Canvas
        frameloop={showcase && autoRotate && !props.reducedMotion ? "always" : "demand"}
        dpr={props.lowQuality ? [1, 1.5] : [1, 2]}
        gl={{ antialias: true, powerPreference: "high-performance", preserveDrawingBuffer: false, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.08 }}
        camera={{ position: [6, 2.5, 7], fov: showcase ? 30 : 36, near: 0.02, far: 120 }}
        onPointerMissed={(e) => {
          if (e.type === "click") props.onSelect(null);
        }}
        // Sur la vitrine, le défilement vertical de la page reste possible au doigt.
        style={showcase ? { touchAction: "pan-y" } : undefined}
        onCreated={({ gl }) => {
          if (showcase) gl.domElement.style.touchAction = "pan-y";
        }}
        aria-hidden
      >
        <Studio lowQuality={props.lowQuality} />
        <Suspense fallback={null}>
          <ModelController ref={controller} {...props} controls={controls} />
        </Suspense>
        <CameraControls ref={controls} makeDefault smoothTime={props.reducedMotion ? 0 : 0.35} draggingSmoothTime={0.12} maxPolarAngle={Math.PI * 0.49} />
        {showcase && <ShowcaseControls controls={controls} autoRotate={autoRotate && !props.reducedMotion} />}
      </Canvas>
      <LoadProgress />
    </>
  );
}
