"use client";

/**
 * Véhicule générique de démonstration, construit en code (aucune ressource tierce).
 * Volontairement simplifié et ILLUSTRATIF : il sert à démontrer l'explorateur.
 *
 * Il se comporte exactement comme un GLB importé : chaque objet porte un nom
 * (`name`) que la table de correspondance (src/lib/demo-model.ts → base de
 * données) relie à une fiche composant. Convention : avant du véhicule vers +Z,
 * Y vers le haut, unités en mètres.
 */
import { forwardRef, useImperativeHandle, useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { DEMO_NODE_MAPPING } from "@/lib/demo-model";

const WHEELS = [
  { id: "FL", x: 0.8, z: 1.4 },
  { id: "FR", x: -0.8, z: 1.4 },
  { id: "RL", x: 0.8, z: -1.35 },
  { id: "RR", x: -0.8, z: -1.35 },
] as const;
const WHEEL_R = 0.34;

function bodyGeometry() {
  const s = new THREE.Shape();
  s.moveTo(-2.2, 0.28);
  s.lineTo(-2.26, 0.46);
  s.quadraticCurveTo(-2.27, 0.74, -2.18, 0.8);
  s.lineTo(-1.75, 0.87);
  s.lineTo(-1.05, 0.9);
  s.lineTo(0.68, 0.92);
  s.quadraticCurveTo(1.5, 0.86, 2.05, 0.72);
  s.quadraticCurveTo(2.28, 0.64, 2.27, 0.46);
  s.lineTo(2.2, 0.28);
  s.lineTo(1.82, 0.28);
  s.absarc(1.4, 0.34, 0.42, -0.142, Math.PI + 0.142, false);
  s.lineTo(-0.93, 0.28);
  s.absarc(-1.35, 0.34, 0.42, -0.142, Math.PI + 0.142, false);
  s.lineTo(-2.2, 0.28);
  const depth = 1.72;
  const g = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.05, bevelSegments: 4, curveSegments: 24 });
  g.translate(0, 0, -depth / 2);
  g.rotateY(-Math.PI / 2);
  g.computeVertexNormals();
  return g;
}

function quad(a: [number, number, number], b: [number, number, number], c: [number, number, number], d: [number, number, number]) {
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute([...a, ...b, ...c, ...a, ...c, ...d], 3));
  g.computeVertexNormals();
  return g;
}

function tube(points: [number, number, number][], radius: number) {
  const curve = new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p)));
  return new THREE.TubeGeometry(curve, 48, radius, 8, false);
}

function useMaterials() {
  return useMemo(
    () => ({
      paint: new THREE.MeshStandardMaterial({ color: "#7d838b", metalness: 0.65, roughness: 0.32 }),
      paintDark: new THREE.MeshStandardMaterial({ color: "#2a2d32", metalness: 0.4, roughness: 0.5 }),
      glass: new THREE.MeshStandardMaterial({ color: "#11161c", metalness: 0.2, roughness: 0.05, transparent: true, opacity: 0.55, side: THREE.DoubleSide }),
      light: new THREE.MeshStandardMaterial({ color: "#e8eef5", emissive: "#cfe3ff", emissiveIntensity: 0.6 }),
      tail: new THREE.MeshStandardMaterial({ color: "#7a0d0a", emissive: "#d9261c", emissiveIntensity: 0.7 }),
      tire: new THREE.MeshStandardMaterial({ color: "#151618", roughness: 0.9 }),
      rim: new THREE.MeshStandardMaterial({ color: "#a6abb2", metalness: 0.9, roughness: 0.25 }),
      metal: new THREE.MeshStandardMaterial({ color: "#7a7f86", metalness: 0.8, roughness: 0.4 }),
      dark: new THREE.MeshStandardMaterial({ color: "#3a3d42", metalness: 0.5, roughness: 0.6 }),
      caliper: new THREE.MeshStandardMaterial({ color: "#c7a12a", metalness: 0.4, roughness: 0.4 }),
      radiator: new THREE.MeshStandardMaterial({ color: "#4a4f56", metalness: 0.6, roughness: 0.5 }),
      hose: new THREE.MeshStandardMaterial({ color: "#1d1f22", roughness: 0.8 }),
      plastic: new THREE.MeshStandardMaterial({ color: "#26292d", roughness: 0.7 }),
      electronic: new THREE.MeshStandardMaterial({ color: "#3b4a5e", metalness: 0.3, roughness: 0.5 }),
      wire: new THREE.MeshStandardMaterial({ color: "#b8742a", roughness: 0.6 }),
      leather: new THREE.MeshStandardMaterial({ color: "#2b2e33", roughness: 0.85 }),
    }),
    [],
  );
}

/**
 * `only` : ne conserve que ces objets (organes illustratifs ajoutés à un modèle GLB
 * qui n'en possède pas). Les autres sont retirés avant l'inscription dans la scène.
 */
export const DemoCar = forwardRef<THREE.Group, { only?: string[] }>(function DemoCar({ only }, ref) {
  const m = useMaterials();
  const root = useRef<THREE.Group>(null);
  useImperativeHandle(ref, () => root.current!);
  useLayoutEffect(() => {
    if (!only || !root.current) return;
    const keep = new Set(only);
    const drop: THREE.Object3D[] = [];
    root.current.traverse((o) => {
      if (o.name in DEMO_NODE_MAPPING && !keep.has(o.name)) drop.push(o);
    });
    drop.forEach((o) => o.removeFromParent());
  }, [only]);
  const g = useMemo(() => {
    const doorShape = (sign: 1 | -1) => {
      const x = 0.915 * sign;
      return quad([x, 0.36, 0.62], [x, 0.36, -0.95], [x, 0.86, -0.95], [x, 0.87, 0.62]);
    };
    return {
      body: bodyGeometry(),
      windshield: quad([0.7, 0.92, 0.66], [-0.7, 0.92, 0.66], [-0.62, 1.32, 0.1], [0.62, 1.32, 0.1]),
      rear: quad([0.7, 0.9, -1.05], [0.62, 1.3, -0.42], [-0.62, 1.3, -0.42], [-0.7, 0.9, -1.05]),
      sideL: quad([0.72, 0.92, 0.6], [0.72, 0.9, -1.0], [0.64, 1.28, -0.42], [0.64, 1.3, 0.1]),
      sideR: quad([-0.72, 0.92, 0.6], [-0.64, 1.3, 0.1], [-0.64, 1.28, -0.42], [-0.72, 0.9, -1.0]),
      doorL: doorShape(1),
      doorR: doorShape(-1),
      hoseUpper: tube([[0.15, 0.78, 1.95], [0.2, 0.86, 1.8], [0.15, 0.84, 1.62]], 0.03),
      hoseLower: tube([[-0.2, 0.4, 1.95], [-0.25, 0.36, 1.75], [-0.2, 0.42, 1.6]], 0.03),
      exhaust: tube([[0.32, 0.42, 1.2], [0.36, 0.24, 0.9], [0.36, 0.22, -0.4], [0.4, 0.24, -1.6], [0.45, 0.3, -1.85]], 0.045),
      harnessMain: tube([[-0.6, 0.78, 1.05], [-0.55, 0.82, 1.6], [0.0, 0.88, 1.75], [0.55, 0.72, 0.95], [0.4, 0.5, 0.2], [0.2, 0.3, -0.8], [0.0, 0.5, -1.8]], 0.018),
      harnessRear: tube([[0.0, 0.5, -1.8], [0.6, 0.72, -2.05], [-0.6, 0.72, -2.05]], 0.016),
      harnessWheels: WHEELS.map((w) => tube([[w.x * 0.4, 0.45, w.z * 0.75], [w.x * 0.75, 0.42, w.z * 0.95], [w.x * 0.86, 0.36, w.z]], 0.012)),
    };
  }, []);

  return (
    <group ref={root} name="CarView_Demo">
      {/* Carrosserie */}
      <mesh name="Body_Shell" geometry={g.body} material={m.paint} castShadow />
      <mesh name="Body_Roof" material={m.paint} position={[0, 1.32, -0.16]} castShadow>
        <boxGeometry args={[1.26, 0.035, 0.6]} />
      </mesh>
      <mesh name="Hood" material={m.paint} position={[0, 0.915, 1.32]} rotation={[0.11, 0, 0]} castShadow>
        <boxGeometry args={[1.5, 0.03, 1.12]} />
      </mesh>
      <mesh name="Door_L" geometry={g.doorL} material={m.paint} />
      <mesh name="Door_R" geometry={g.doorR} material={m.paint} />
      <mesh name="Bumper_F" material={m.paintDark} position={[0, 0.4, 2.26]}>
        <boxGeometry args={[1.66, 0.22, 0.12]} />
      </mesh>
      <mesh name="Bumper_R" material={m.paintDark} position={[0, 0.42, -2.27]}>
        <boxGeometry args={[1.66, 0.24, 0.12]} />
      </mesh>
      <mesh name="Glass_Windshield" geometry={g.windshield} material={m.glass} />
      <mesh name="Glass_Rear" geometry={g.rear} material={m.glass} />
      <mesh name="Glass_Side_L" geometry={g.sideL} material={m.glass} />
      <mesh name="Glass_Side_R" geometry={g.sideR} material={m.glass} />
      {[1, -1].map((s) => (
        <mesh key={`hl${s}`} name={s > 0 ? "Headlight_L" : "Headlight_R"} material={m.light} position={[0.6 * s, 0.68, 2.17]} rotation={[0, 0.25 * s, 0]}>
          <boxGeometry args={[0.36, 0.07, 0.08]} />
        </mesh>
      ))}
      {[1, -1].map((s) => (
        <mesh key={`tl${s}`} name={s > 0 ? "Taillight_L" : "Taillight_R"} material={m.tail} position={[0.6 * s, 0.76, -2.22]}>
          <boxGeometry args={[0.42, 0.06, 0.06]} />
        </mesh>
      ))}
      <group name="Spoiler">
        <mesh material={m.paintDark} position={[0, 1.08, -1.98]} rotation={[-0.08, 0, 0]}>
          <boxGeometry args={[1.5, 0.03, 0.26]} />
        </mesh>
        {[0.45, -0.45].map((x) => (
          <mesh key={x} material={m.paintDark} position={[x, 0.97, -1.95]}>
            <boxGeometry args={[0.04, 0.2, 0.1]} />
          </mesh>
        ))}
      </group>

      {/* Moteur (avant longitudinal) */}
      <mesh name="Engine_Block" material={m.metal} position={[0, 0.55, 1.35]} castShadow>
        <boxGeometry args={[0.58, 0.4, 0.62]} />
      </mesh>
      <mesh name="Engine_Head" material={m.dark} position={[0, 0.8, 1.35]}>
        <boxGeometry args={[0.5, 0.1, 0.6]} />
      </mesh>
      <mesh name="Air_Intake" material={m.plastic} position={[-0.25, 0.8, 1.82]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.08, 0.08, 0.36, 16]} />
      </mesh>

      {/* Transmission (propulsion) */}
      <mesh name="Gearbox" material={m.metal} position={[0, 0.45, 0.78]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.12, 0.2, 0.55, 20]} />
      </mesh>
      <mesh name="Driveshaft" material={m.dark} position={[0, 0.36, -0.38]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.04, 0.04, 1.8, 12]} />
      </mesh>
      <mesh name="Differential" material={m.metal} position={[0, 0.36, -1.35]}>
        <sphereGeometry args={[0.16, 20, 16]} />
      </mesh>

      {/* Refroidissement */}
      <mesh name="Radiator" material={m.radiator} position={[0, 0.56, 2.02]}>
        <boxGeometry args={[1.1, 0.42, 0.06]} />
      </mesh>
      <mesh name="Coolant_Hose_Upper" geometry={g.hoseUpper} material={m.hose} />
      <mesh name="Coolant_Hose_Lower" geometry={g.hoseLower} material={m.hose} />

      {/* Échappement */}
      <mesh name="Exhaust_Pipe" geometry={g.exhaust} material={m.metal} />
      <mesh name="Muffler" material={m.metal} position={[0.45, 0.3, -1.95]} rotation={[Math.PI / 2, 0, 0]}>
        <capsuleGeometry args={[0.1, 0.32, 6, 16]} />
      </mesh>

      {/* Direction */}
      <mesh name="Steering_Rack" material={m.metal} position={[0, 0.3, 1.12]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.035, 0.035, 1.25, 12]} />
      </mesh>
      <mesh name="Steering_Column" material={m.dark} position={[0.36, 0.6, 0.78]} rotation={[-0.95, 0, 0]}>
        <cylinderGeometry args={[0.025, 0.025, 0.72, 10]} />
      </mesh>

      {/* Roues, freins, suspension, capteurs */}
      {WHEELS.map((w) => {
        const side = Math.sign(w.x);
        return (
          <group key={w.id}>
            <mesh name={`Tire_${w.id}`} material={m.tire} position={[w.x, WHEEL_R, w.z]} rotation={[0, 0, Math.PI / 2]} castShadow>
              <cylinderGeometry args={[WHEEL_R, WHEEL_R, 0.25, 40]} />
            </mesh>
            <mesh name={`Rim_${w.id}`} material={m.rim} position={[w.x + 0.005 * side, WHEEL_R, w.z]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.22, 0.22, 0.255, 10]} />
            </mesh>
            <mesh name={`Brake_Disc_${w.id}`} material={m.metal} position={[w.x - 0.17 * side, WHEEL_R, w.z]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.2, 0.2, 0.03, 32]} />
            </mesh>
            <mesh name={`Brake_Caliper_${w.id}`} material={m.caliper} position={[w.x - 0.17 * side, WHEEL_R + 0.12, w.z - 0.1]}>
              <boxGeometry args={[0.07, 0.12, 0.14]} />
            </mesh>
            <mesh name={`Damper_${w.id}`} material={m.dark} position={[w.x * 0.78, 0.62, w.z]}>
              <cylinderGeometry args={[0.045, 0.06, 0.46, 12]} />
            </mesh>
            <mesh name={`Wishbone_${w.id}`} material={m.dark} position={[w.x * 0.62, 0.26, w.z]}>
              <boxGeometry args={[0.5, 0.03, 0.12]} />
            </mesh>
            <mesh name={`WheelSpeed_Sensor_${w.id}`} material={m.electronic} position={[w.x - 0.24 * side, WHEEL_R - 0.12, w.z + 0.1]}>
              <cylinderGeometry args={[0.02, 0.02, 0.07, 8]} />
            </mesh>
          </group>
        );
      })}

      {/* Électronique */}
      <mesh name="ECU" material={m.electronic} position={[0.55, 0.72, 1.62]}>
        <boxGeometry args={[0.2, 0.05, 0.16]} />
      </mesh>
      <mesh name="ABS_Module" material={m.electronic} position={[0.56, 0.66, 0.98]}>
        <boxGeometry args={[0.16, 0.12, 0.14]} />
      </mesh>
      <mesh name="Battery" material={m.plastic} position={[-0.58, 0.64, 1.02]}>
        <boxGeometry args={[0.24, 0.2, 0.18]} />
      </mesh>
      <mesh name="Alternator" material={m.metal} position={[0.36, 0.48, 1.62]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.07, 0.07, 0.12, 16]} />
      </mesh>
      <mesh name="Starter" material={m.metal} position={[-0.3, 0.38, 1.0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.05, 0.05, 0.18, 12]} />
      </mesh>
      <group name="Injectors">
        {[-0.18, -0.06, 0.06, 0.18].map((z) => (
          <mesh key={z} material={m.electronic} position={[0.16, 0.88, 1.35 + z]}>
            <cylinderGeometry args={[0.018, 0.018, 0.08, 8]} />
          </mesh>
        ))}
      </group>
      <mesh name="Lambda_Sensor" material={m.electronic} position={[0.36, 0.3, 0.88]}>
        <cylinderGeometry args={[0.02, 0.02, 0.1, 8]} />
      </mesh>
      <mesh name="Harness_Main" geometry={g.harnessMain} material={m.wire} />
      <mesh name="Harness_Rear" geometry={g.harnessRear} material={m.wire} />
      <group name="Harness_Wheels">
        {g.harnessWheels.map((geo, i) => (
          <mesh key={i} geometry={geo} material={m.wire} />
        ))}
      </group>

      {/* Habitacle */}
      {[0.36, -0.36].map((x) => (
        <group key={x} name={x > 0 ? "Seat_L" : "Seat_R"}>
          <mesh material={m.leather} position={[x, 0.46, -0.22]}>
            <boxGeometry args={[0.46, 0.1, 0.5]} />
          </mesh>
          <mesh material={m.leather} position={[x, 0.78, -0.5]} rotation={[-0.2, 0, 0]}>
            <boxGeometry args={[0.46, 0.6, 0.1]} />
          </mesh>
        </group>
      ))}
      <mesh name="Dashboard" material={m.plastic} position={[0, 0.82, 0.5]}>
        <boxGeometry args={[1.36, 0.16, 0.3]} />
      </mesh>
      <mesh name="Steering_Wheel" material={m.leather} position={[0.36, 0.86, 0.38]} rotation={[-0.35, 0, 0]}>
        <torusGeometry args={[0.17, 0.022, 10, 32]} />
      </mesh>
    </group>
  );
});
