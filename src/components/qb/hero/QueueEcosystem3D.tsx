import { useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Float, RoundedBox, Line } from "@react-three/drei";
import * as THREE from "three";

/**
 * The Qblink queue ecosystem.
 *
 * A single continuous thread carries digital tokens from the moment a
 * customer scans, through the waiting state, into the serving node.
 * Everything is derived from one curve so the motion reads as one system,
 * not a set of decorative objects.
 */

const NAVY = "#0b1b2d";
const TEAL = "#3fb8bf";
const CYAN = "#22a7e0";
const CREAM = "#f2eee4";

const CURVE = new THREE.CatmullRomCurve3([
  new THREE.Vector3(-2.6, -2.6, -1.6),
  new THREE.Vector3(-1.9, -1.2, 0.9),
  new THREE.Vector3(-0.8, -1.5, 1.7),
  new THREE.Vector3(1.3, -0.2, 0.4),
  new THREE.Vector3(2.9, -1.1, -1.1),
  new THREE.Vector3(4.4, 0.3, -2.2),
]);

const TOKEN_COUNT = 9;

/** One digital token travelling the thread. */
function Token({ offset, reduced }: { offset: number; reduced: boolean }) {
  const group = useRef<THREE.Group>(null);
  const mat = useRef<THREE.MeshStandardMaterial>(null);

  useFrame(({ clock }) => {
    const g = group.current;
    if (!g) return;
    const speed = reduced ? 0 : 0.045;
    const t = (offset + clock.elapsedTime * speed) % 1;
    const p = CURVE.getPointAt(t);
    g.position.set(p.x, p.y, p.z);
    const tan = CURVE.getTangentAt(t);
    g.lookAt(p.x + tan.x, p.y + tan.y, p.z + tan.z);
    // tokens brighten and lift as they approach the serving node
    const near = Math.pow(t, 2.2);
    g.scale.setScalar(0.72 + near * 0.55);
    if (mat.current) {
      mat.current.emissiveIntensity = 0.18 + near * 1.5;
      mat.current.opacity = t > 0.94 ? (1 - t) / 0.06 : Math.min(1, t / 0.06);
    }
  });

  return (
    <group ref={group}>
      <RoundedBox args={[0.62, 0.4, 0.07]} radius={0.07} smoothness={4}>
        <meshStandardMaterial
          ref={mat}
          color={CREAM}
          emissive={TEAL}
          emissiveIntensity={0.4}
          roughness={0.32}
          metalness={0.1}
          transparent
        />
      </RoundedBox>
      <mesh position={[0, 0, 0.045]}>
        <planeGeometry args={[0.34, 0.06]} />
        <meshBasicMaterial color={NAVY} transparent opacity={0.5} />
      </mesh>
    </group>
  );
}

/** The serving node — where the wait ends. */
function ServingNode({ reduced }: { reduced: boolean }) {
  const ring = useRef<THREE.Mesh>(null);
  const pulse = useRef<THREE.Mesh>(null);
  const end = CURVE.getPointAt(1);

  useFrame(({ clock }) => {
    if (reduced) return;
    const t = clock.elapsedTime;
    if (ring.current) ring.current.rotation.z = t * 0.4;
    if (pulse.current) {
      const k = (t % 2.4) / 2.4;
      pulse.current.scale.setScalar(1 + k * 2.6);
      (pulse.current.material as THREE.MeshBasicMaterial).opacity = 0.35 * (1 - k);
    }
  });

  return (
    <group position={[end.x, end.y, end.z]}>
      <mesh ref={ring}>
        <torusGeometry args={[0.85, 0.02, 12, 64]} />
        <meshBasicMaterial color={TEAL} transparent opacity={0.55} />
      </mesh>
      <mesh ref={pulse}>
        <ringGeometry args={[0.85, 0.9, 64]} />
        <meshBasicMaterial color={CYAN} transparent opacity={0.3} side={THREE.DoubleSide} />
      </mesh>
      <mesh>
        <sphereGeometry args={[0.22, 32, 32]} />
        <meshStandardMaterial color={CYAN} emissive={CYAN} emissiveIntensity={2.4} toneMapped={false} />
      </mesh>
    </group>
  );
}

/** The scan point — where a customer enters the system. */
function ScanNode() {
  const start = CURVE.getPointAt(0);
  const corners = useMemo(
    () =>
      [
        [-1, 1],
        [1, 1],
        [1, -1],
        [-1, -1],
      ] as const,
    []
  );
  return (
    <Float speed={1.1} rotationIntensity={0.16} floatIntensity={0.5}>
      <group position={[start.x, start.y + 0.4, start.z]}>
        <RoundedBox args={[1.5, 1.5, 0.05]} radius={0.14} smoothness={4}>
          <meshStandardMaterial color={CREAM} roughness={0.45} metalness={0.05} />
        </RoundedBox>
        {corners.map(([sx, sy], i) => (
          <mesh key={i} position={[sx * 0.42, sy * 0.42, 0.035]}>
            <planeGeometry args={[0.34, 0.34]} />
            <meshBasicMaterial color={NAVY} />
          </mesh>
        ))}
        {corners.map(([sx, sy], i) => (
          <mesh key={`i${i}`} position={[sx * 0.42, sy * 0.42, 0.04]}>
            <planeGeometry args={[0.14, 0.14]} />
            <meshBasicMaterial color={CREAM} />
          </mesh>
        ))}
      </group>
    </Float>
  );
}

/** Floating operational surface — the business side of the same thread. */
function DataPanel({
  position,
  rows,
  width = 2.5,
  height = 1.6,
}: {
  position: [number, number, number];
  rows: number[];
  width?: number;
  height?: number;
}) {
  return (
    <Float speed={1.3} rotationIntensity={0.22} floatIntensity={0.7}>
      <group position={position} rotation={[0, -0.34, 0]}>
        <RoundedBox args={[width, height, 0.04]} radius={0.09} smoothness={4}>
          <meshStandardMaterial
            color={NAVY}
            emissive={TEAL}
            emissiveIntensity={0.12}
            roughness={0.28}
            metalness={0.35}
            transparent
            opacity={0.94}
          />
        </RoundedBox>
        {rows.map((w, i) => (
          <mesh
            key={i}
            position={[-width / 2 + 0.22 + (w * (width - 0.5)) / 2, height / 2 - 0.34 - i * 0.28, 0.03]}
          >
            <planeGeometry args={[w * (width - 0.5), 0.08]} />
            <meshBasicMaterial color={i === 0 ? CYAN : TEAL} transparent opacity={i === 0 ? 0.95 : 0.4} />
          </mesh>
        ))}
      </group>
    </Float>
  );
}

/** The thread itself. */
function Thread() {
  const points = useMemo(() => CURVE.getPoints(220), []);
  return (
    <>
      <Line points={points} color={TEAL} lineWidth={1.4} transparent opacity={0.5} />
      <Line
        points={points.map((p) => new THREE.Vector3(p.x, p.y - 2.4, p.z))}
        color={CYAN}
        lineWidth={1}
        transparent
        opacity={0.1}
      />
    </>
  );
}

function Scene({ reduced }: { reduced: boolean }) {
  const world = useRef<THREE.Group>(null);
  const fit = useRef<THREE.Group>(null);
  const { viewport } = useThree();

  // Fit the ecosystem to whatever aspect the stage happens to be, and bias it
  // toward the upper-right so the headline column stays clean.
  const scale = Math.min(1.05, Math.max(0.42, viewport.width / 17));
  const offsetX = viewport.width > 14 ? viewport.width * 0.16 : 0;
  const offsetY = viewport.width > 14 ? 0.6 : 1.4;

  useFrame(({ pointer, clock }) => {
    const g = world.current;
    if (!g) return;
    const drift = reduced ? 0 : Math.sin(clock.elapsedTime * 0.16) * 0.04;
    g.rotation.y += (pointer.x * 0.16 + drift - g.rotation.y) * 0.03;
    g.rotation.x += (-pointer.y * 0.09 + 0.05 - g.rotation.x) * 0.03;
  });

  return (
    <group ref={fit} position={[offsetX, offsetY, 0]} scale={scale}>
    <group ref={world}>
      <Thread />
      <ScanNode />
      <ServingNode reduced={reduced} />
      {Array.from({ length: TOKEN_COUNT }).map((_, i) => (
        <Token key={i} offset={i / TOKEN_COUNT} reduced={reduced} />
      ))}
      <DataPanel position={[3.1, 1.9, -1.4]} rows={[0.9, 0.55, 0.72, 0.34]} />
      <DataPanel position={[-3.2, 2.3, -3.4]} rows={[0.7, 0.95, 0.42]} width={2} height={1.25} />
    </group>
    </group>
  );
}

export default function QueueEcosystem3D() {
  const reduced =
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  return (
    <Canvas
      dpr={[1, 1.75]}
      camera={{ position: [0, 1.2, 11], fov: 44 }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      aria-hidden
    >
      <ambientLight intensity={0.55} />
      <directionalLight position={[4, 6, 6]} intensity={1.1} color={CREAM} />
      <pointLight position={[-6, 2, 4]} intensity={26} color={CYAN} distance={18} />
      <pointLight position={[7, -1, 3]} intensity={22} color={TEAL} distance={18} />
      <Scene reduced={Boolean(reduced)} />
      <fog attach="fog" args={[NAVY, 12, 26]} />
    </Canvas>
  );
}
