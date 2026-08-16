import React, { useState, useRef, useEffect, useMemo, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Billboard, Html } from "@react-three/drei";
import * as THREE from "three";
import {
  Compass,
  RotateCw,
  Sparkles,
  Volume2,
  VolumeX,
  Smartphone,
  Flame,
  Sliders,
  MoveHorizontal,
} from "lucide-react";

// Web Audio API Procedural Sound Engine (Zero external audio file downloads needed!)
class SpatialAudioEngine {
  private ctx: AudioContext | null = null;
  private chaosOsc: OscillatorNode | null = null;
  private chaosGain: GainNode | null = null;
  private sereneOsc: OscillatorNode | null = null;
  private sereneGain: GainNode | null = null;
  private isMuted: boolean = true;
  private lastT: number = 0;

  init() {
    if (this.ctx) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();

      // Chaos droning noise
      this.chaosGain = this.ctx.createGain();
      this.chaosGain.gain.setValueAtTime(0, this.ctx.currentTime);
      this.chaosGain.connect(this.ctx.destination);

      this.chaosOsc = this.ctx.createOscillator();
      this.chaosOsc.type = "sawtooth";
      this.chaosOsc.frequency.setValueAtTime(65, this.ctx.currentTime);
      this.chaosOsc.connect(this.chaosGain);
      this.chaosOsc.start();

      // Serene harmonic chime
      this.sereneGain = this.ctx.createGain();
      this.sereneGain.gain.setValueAtTime(0, this.ctx.currentTime);
      this.sereneGain.connect(this.ctx.destination);

      this.sereneOsc = this.ctx.createOscillator();
      this.sereneOsc.type = "sine";
      this.sereneOsc.frequency.setValueAtTime(432, this.ctx.currentTime);
      this.sereneOsc.connect(this.sereneGain);
      this.sereneOsc.start();
    } catch {
      // AudioContext not allowed or unsupported
    }
  }

  setMute(mute: boolean) {
    this.isMuted = mute;
    if (this.ctx && this.ctx.state === "suspended" && !mute) {
      this.ctx.resume();
    }
    this.updateVolumes(this.lastT);
  }

  updateVolumes(t: number) {
    this.lastT = t;
    if (!this.ctx || this.isMuted || !this.chaosGain || !this.sereneGain) return;
    const now = this.ctx.currentTime;
    const chaosVol = Math.max(0, (1 - t) * 0.05);
    const sereneVol = Math.max(0, t * 0.04);
    this.chaosGain.gain.setTargetAtTime(chaosVol, now, 0.1);
    this.sereneGain.gain.setTargetAtTime(sereneVol, now, 0.1);
  }

  playChime() {
    if (!this.ctx || this.isMuted) return;
    try {
      const chime = this.ctx.createOscillator();
      const chimeGain = this.ctx.createGain();
      chime.type = "triangle";
      chime.frequency.setValueAtTime(587.33, this.ctx.currentTime); // D5
      chime.frequency.exponentialRampToValueAtTime(880, this.ctx.currentTime + 0.3); // A5
      chimeGain.gain.setValueAtTime(0.08, this.ctx.currentTime);
      chimeGain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.8);
      chime.connect(chimeGain);
      chimeGain.connect(this.ctx.destination);
      chime.start();
      chime.stop(this.ctx.currentTime + 0.8);
    } catch {
      // ignore
    }
  }
}

const audio = new SpatialAudioEngine();

// Hotspots scattered in 360-degree spatial coordinates
interface HotspotInfo {
  id: string;
  angleDeg: number;
  pitchDeg: number;
  radius: number;
  title: string;
  chaosLabel: string;
  sereneLabel: string;
  chaosDescription: string;
  sereneDescription: string;
  metric: string;
  color: string;
}

const HOTSPOTS: HotspotInfo[] = [
  {
    id: "counter",
    angleDeg: 0,
    pitchDeg: 0,
    radius: 7.5,
    title: "The Main Counter",
    chaosLabel: "Staff Bottleneck & Inquiries",
    sereneLabel: "Unified 1-by-1 Flow",
    chaosDescription: "Staff spend 40+ min/day fielding 'how much longer?' inquiries instead of serving.",
    sereneDescription: "Digital tokens call customers exactly when their turn is ready. Zero crowd at counter.",
    metric: "40 min/day saved",
    color: "#f59e0b",
  },
  {
    id: "entrance",
    angleDeg: 90,
    pitchDeg: -4,
    radius: 7.2,
    title: "The Front Entrance",
    chaosLabel: "Immediate Walkout Risk",
    sereneLabel: "Instant QR Portal",
    chaosDescription: "22% of prospective customers see a packed lobby and immediately walk away to competitors.",
    sereneDescription: "Customers scan the door QR, take a digital spot in 3 seconds, and wander freely.",
    metric: "+22% revenue captured",
    color: "#ef4444",
  },
  {
    id: "phone",
    angleDeg: 180,
    pitchDeg: 5,
    radius: 6.8,
    title: "Customer Handset",
    chaosLabel: "Blind Uncertainty",
    sereneLabel: "Live Streaming Token",
    chaosDescription: "No position awareness. Customers feel trapped, constantly checking clocks in frustration.",
    sereneDescription: "Web-native live countdown in browser. No app install, zero registration friction.",
    metric: "100% time certainty",
    color: "#3fb8bf",
  },
  {
    id: "waiting-area",
    angleDeg: 270,
    pitchDeg: -2,
    radius: 7.5,
    title: "Waiting Lounge & Seating",
    chaosLabel: "Congested & Noisy Seating",
    sereneLabel: "Open, Breathable Space",
    chaosDescription: "Crowded chairs, high stress levels, anxious murmur, spilled drinks, and standing overflow.",
    sereneDescription: "Customers sit at nearby cafes or finish errands. Lounge stays calm and pristine.",
    metric: "Zero lobby overcrowding",
    color: "#22c55e",
  },
];

/**
 * 3D Silhouettes in Space (Crowd simulation)
 */
function CrowdSilhouettes({ transition }: { transition: number }) {
  const count = 18;
  const positions = useMemo(() => {
    return Array.from({ length: count }).map((_, i) => {
      const angle = (i / count) * Math.PI * 2 + (Math.sin(i * 13) * 0.4);
      const dist = 5.2 + (i % 4) * 0.9;
      const x = Math.sin(angle) * dist;
      const z = Math.cos(angle) * dist;
      const height = 1.6 + (i % 3) * 0.25;
      const swaySpeed = 0.8 + (i % 5) * 0.3;
      return { x, z, height, angle, swaySpeed, id: i };
    });
  }, []);

  const groupRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = clock.elapsedTime;
    const children = groupRef.current.children;
    for (let i = 0; i < children.length; i++) {
      const mesh = children[i] as THREE.Mesh;
      if (mesh) {
        const item = positions[i];
        if (item) {
          const jitter = (1 - transition) * 0.08;
          mesh.position.y = (item.height / 2) - 1.5 + Math.sin(t * item.swaySpeed + item.id) * jitter;
          mesh.scale.y = THREE.MathUtils.lerp(1, 0.1, Math.pow(transition, 2));
          mesh.scale.x = THREE.MathUtils.lerp(1, 0.1, Math.pow(transition, 2));
          mesh.scale.z = THREE.MathUtils.lerp(1, 0.1, Math.pow(transition, 2));
        }
      }
    }
  });

  return (
    <group ref={groupRef}>
      {positions.map((p) => {
        const chaosColor = new THREE.Color("#e0684f");
        const sereneColor = new THREE.Color("#3fb8bf");
        const baseColor = chaosColor.lerp(sereneColor, transition);

        return (
          <mesh key={p.id} position={[p.x, (p.height / 2) - 1.5, p.z]}>
            <capsuleGeometry args={[0.35, p.height - 0.7, 8, 16]} />
            <meshStandardMaterial
              color={baseColor}
              roughness={0.6}
              transparent
              opacity={Math.max(0.04, (1 - transition * 0.92) * 0.75)}
              emissive={baseColor}
              emissiveIntensity={(1 - transition) * 0.4 + 0.1}
            />
          </mesh>
        );
      })}
    </group>
  );
}

/**
 * The 3D Floating Phone in Center of Serenity
 */
function FloatingHandset3D({ transition }: { transition: number }) {
  const phoneRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (!phoneRef.current) return;
    const t = clock.elapsedTime;
    phoneRef.current.rotation.y = Math.sin(t * 0.6) * 0.2 + Math.PI; // Face the 180 deg angle
    phoneRef.current.position.y = Math.sin(t * 1.4) * 0.12 - 0.2;
    const s = THREE.MathUtils.lerp(0.01, 1.15, Math.pow(transition, 1.4));
    phoneRef.current.scale.set(s, s, s);
  });

  return (
    <group ref={phoneRef} position={[0, 0, 3.2]}>
      {/* Phone chassis */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[1.5, 2.8, 0.14]} />
        <meshStandardMaterial color="#0f172a" roughness={0.2} metalness={0.8} />
      </mesh>

      {/* Screen */}
      <mesh position={[0, 0, 0.075]}>
        <planeGeometry args={[1.38, 2.68]} />
        <meshBasicMaterial color="#09131e" />
      </mesh>

      {/* Dynamic Screen Content as 3D Elements */}
      <group position={[0, 0, 0.082]}>
        {/* Header bar */}
        <mesh position={[0, 1.05, 0]}>
          <planeGeometry args={[1.2, 0.25]} />
          <meshBasicMaterial color="#132337" />
        </mesh>

        {/* Live Token Badge */}
        <mesh position={[0, 0.35, 0]}>
          <planeGeometry args={[1.15, 0.9]} />
          <meshBasicMaterial color="#0e2a38" />
        </mesh>

        {/* Glow progress ring */}
        <mesh position={[0, -0.45, 0]}>
          <ringGeometry args={[0.35, 0.42, 32]} />
          <meshBasicMaterial color="#3fb8bf" />
        </mesh>

        {/* Floating live point light around handset */}
        <pointLight color="#3fb8bf" intensity={transition * 2.5} distance={3} />
      </group>
    </group>
  );
}

/**
 * 3D Hotspot Anchor in 360 Space
 */
function HotspotMarker3D({
  spot,
  transition,
  isActive,
  onClick,
}: {
  spot: HotspotInfo;
  transition: number;
  isActive: boolean;
  onClick: () => void;
}) {
  const rad = (spot.angleDeg * Math.PI) / 180;
  const pitchRad = (spot.pitchDeg * Math.PI) / 180;
  const x = Math.sin(rad) * Math.cos(pitchRad) * spot.radius;
  const y = Math.sin(pitchRad) * spot.radius;
  const z = Math.cos(rad) * Math.cos(pitchRad) * spot.radius;

  const meshRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (ringRef.current) {
      const wave = (t * 1.5) % 1;
      ringRef.current.scale.setScalar(1 + wave * 1.4);
      (ringRef.current.material as THREE.MeshBasicMaterial).opacity = (1 - wave) * 0.7;
    }
  });

  return (
    <group position={[x, y, z]}>
      <Billboard follow={true} lockX={false} lockY={false} lockZ={false}>
        {/* Hit area & beacon */}
        <mesh
          ref={meshRef}
          onClick={(e) => {
            e.stopPropagation();
            onClick();
          }}
          className="cursor-pointer"
        >
          <circleGeometry args={[0.38, 32]} />
          <meshBasicMaterial
            color={transition > 0.5 ? "#3fb8bf" : spot.color}
            toneMapped={false}
          />
        </mesh>

        {/* Sonar Ping Ring */}
        <mesh ref={ringRef}>
          <ringGeometry args={[0.38, 0.48, 32]} />
          <meshBasicMaterial
            color={transition > 0.5 ? "#3fb8bf" : spot.color}
            transparent
            opacity={0.6}
            side={THREE.DoubleSide}
          />
        </mesh>

        {/* 3D Label tag */}
        <Html distanceFactor={14} center position={[0, -0.65, 0]}>
          <button
            type="button"
            onClick={onClick}
            className={`px-2.5 py-1 rounded-full text-[11px] font-mono-caps font-bold tracking-wider shadow-xl backdrop-blur-md transition-all whitespace-nowrap ${
              isActive
                ? "bg-glow text-ink ring-2 ring-cream"
                : "bg-ink/80 text-cream/90 border border-glow/30 hover:border-glow hover:scale-105"
            }`}
          >
            {spot.title}
          </button>
        </Html>
      </Billboard>
    </group>
  );
}

/**
 * 360 Room Architecture
 */
function RoomArchitecture({ transition }: { transition: number }) {
  const chaosCeiling = new THREE.Color("#180a08");
  const sereneCeiling = new THREE.Color("#081422");
  const ceilingColor = chaosCeiling.lerp(sereneCeiling, transition);

  const chaosFloor = new THREE.Color("#1a0e0c");
  const sereneFloor = new THREE.Color("#06101c");
  const floorColor = chaosFloor.lerp(sereneFloor, transition);

  return (
    <group>
      {/* Floor */}
      <mesh position={[0, -2.2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[30, 30, 20, 20]} />
        <meshStandardMaterial
          color={floorColor}
          roughness={0.4}
          metalness={0.3}
          wireframe={false}
        />
      </mesh>

      {/* Ceiling */}
      <mesh position={[0, 4.5, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[30, 30]} />
        <meshBasicMaterial color={ceilingColor} />
      </mesh>

      {/* 360 Surrounding Pillars / Spatial Markers */}
      {Array.from({ length: 12 }).map((_, i) => {
        const angle = (i / 12) * Math.PI * 2;
        const x = Math.sin(angle) * 11;
        const z = Math.cos(angle) * 11;
        return (
          <mesh key={i} position={[x, 1, z]}>
            <boxGeometry args={[0.4, 7, 0.4]} />
            <meshStandardMaterial
              color={transition > 0.5 ? "#0e243a" : "#241210"}
              emissive={transition > 0.5 ? "#3fb8bf" : "#ef4444"}
              emissiveIntensity={0.12}
            />
          </mesh>
        );
      })}

      {/* Ambient Flow Particle Field */}
      <FlowParticleField transition={transition} />
    </group>
  );
}

/**
 * Kinetic Flow Particles floating in 360 space
 */
function FlowParticleField({ transition }: { transition: number }) {
  const count = 180;
  const particles = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const rad = Math.random() * Math.PI * 2;
      const dist = 2 + Math.random() * 8;
      arr[i * 3] = Math.sin(rad) * dist;
      arr[i * 3 + 1] = (Math.random() - 0.5) * 5;
      arr[i * 3 + 2] = Math.cos(rad) * dist;
    }
    return arr;
  }, []);

  const pointsRef = useRef<THREE.Points>(null);

  useFrame(({ clock }) => {
    if (!pointsRef.current) return;
    const t = clock.elapsedTime;
    const speed = THREE.MathUtils.lerp(0.4, 0.15, transition);
    pointsRef.current.rotation.y = t * speed;
  });

  const color = useMemo(() => {
    return transition > 0.5 ? new THREE.Color("#3fb8bf") : new THREE.Color("#f87171");
  }, [transition]);

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[particles, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.09}
        color={color}
        transparent
        opacity={0.65}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

/**
 * Camera Controller with Drag-to-Rotate and Smooth Target Seeking
 */
function CameraController({
  yaw,
  pitch,
  fov,
}: {
  yaw: number;
  pitch: number;
  fov: number;
}) {
  const { camera } = useThree();

  useFrame(() => {
    const yawRad = (yaw * Math.PI) / 180;
    const pitchRad = (pitch * Math.PI) / 180;

    const targetX = Math.sin(yawRad) * Math.cos(pitchRad) * 10;
    const targetY = Math.sin(pitchRad) * 10;
    const targetZ = Math.cos(yawRad) * Math.cos(pitchRad) * 10;

    camera.lookAt(targetX, targetY, targetZ);
    if ("fov" in camera) {
      const persCamera = camera as THREE.PerspectiveCamera;
      persCamera.fov = THREE.MathUtils.lerp(persCamera.fov, fov, 0.1);
      persCamera.updateProjectionMatrix();
    }
  });

  return null;
}

/**
 * The Master 360 Interactive Spatial Component
 */
export const ChaoticRoom360: React.FC = () => {
  const [transition, setTransition] = useState<number>(0.25);
  const [yaw, setYaw] = useState<number>(180);
  const [pitch, setPitch] = useState<number>(0);
  const [fov] = useState<number>(65);

  const [isAutoRotate, setIsAutoRotate] = useState<boolean>(false);
  const [activeHotspot, setActiveHotspot] = useState<HotspotInfo | null>(HOTSPOTS[2]);
  const [isMuted, setIsMuted] = useState<boolean>(true);

  const isDragging = useRef<boolean>(false);
  const startPointer = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const startAngles = useRef<{ yaw: number; pitch: number }>({ yaw: 180, pitch: 0 });

  useEffect(() => {
    audio.updateVolumes(transition);
  }, [transition]);

  const toggleMute = () => {
    audio.init();
    const nextMute = !isMuted;
    setIsMuted(nextMute);
    audio.setMute(nextMute);
  };

  useEffect(() => {
    if (!isAutoRotate) return;
    const interval = setInterval(() => {
      setYaw((prev) => (prev + 0.35) % 360);
    }, 30);
    return () => clearInterval(interval);
  }, [isAutoRotate]);

  const handlePointerDown = (e: React.PointerEvent) => {
    isDragging.current = true;
    startPointer.current = { x: e.clientX, y: e.clientY };
    startAngles.current = { yaw, pitch };
    setIsAutoRotate(false);
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging.current) return;
    const dx = e.clientX - startPointer.current.x;
    const dy = e.clientY - startPointer.current.y;

    const sensitivity = 0.28;
    let nextYaw = (startAngles.current.yaw - dx * sensitivity) % 360;
    if (nextYaw < 0) nextYaw += 360;

    let nextPitch = startAngles.current.pitch + dy * sensitivity;
    nextPitch = Math.max(-55, Math.min(55, nextPitch));

    setYaw(nextYaw);
    setPitch(nextPitch);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    isDragging.current = false;
    try {
      (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
    } catch {
      // ignore
    }
  };

  const snapToHotspot = (spot: HotspotInfo) => {
    setActiveHotspot(spot);
    setIsAutoRotate(false);
    setYaw(spot.angleDeg);
    setPitch(spot.pitchDeg);
    audio.playChime();
  };

  const headingLabel = useMemo(() => {
    const norm = (yaw % 360 + 360) % 360;
    if (norm >= 337.5 || norm < 22.5) return "0° · FRONT COUNTER";
    if (norm >= 22.5 && norm < 67.5) return "45° · NORTHEAST EXIT";
    if (norm >= 67.5 && norm < 112.5) return "90° · ENTRANCE QR";
    if (norm >= 112.5 && norm < 157.5) return "135° · SOUTHEAST LOUNGE";
    if (norm >= 157.5 && norm < 202.5) return "180° · MOBILE HANDSET";
    if (norm >= 202.5 && norm < 247.5) return "225° · SOUTHWEST SEATING";
    if (norm >= 247.5 && norm < 292.5) return "270° · WAITING LOUNGE";
    return "315° · NORTHWEST RUSH";
  }, [yaw]);

  return (
    <section
      id="spatial-experience"
      className="relative min-h-screen py-24 sm:py-32 bg-[hsl(var(--brand-navy))] overflow-hidden grain"
      aria-label="360 Chaotic Room to Qblink Transition"
    >
      {/* Ambient background lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[900px] h-[450px] bg-glow/5 blur-[160px] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-5 sm:px-8 z-10">
        {/* Editorial Section Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-12">
          <div className="max-w-3xl">
            <div className="font-mono-caps text-glow/90 mb-4 flex items-center gap-2 text-xs tracking-[0.25em]">
              <span className="w-2 h-2 rounded-full bg-glow animate-ping" />
              Ch. 04 · 360° Spatial Reality Simulator
            </div>
            <h2 className="font-display text-4xl sm:text-6xl text-cream leading-[0.94] tracking-tight">
              Step inside the room.
              <br />
              <span className="text-glow italic font-normal">
                Drag 360° — Feel the Metamorphosis.
              </span>
            </h2>
            <p className="mt-5 text-cream/70 text-base sm:text-lg leading-relaxed max-w-2xl">
              Physical line congestion isn't just inefficient — it's an overwhelming sensory drain.
              Drag your viewpoint around the room and pull the slider to see how Qblink dissolves
              the physical crowd into effortless digital freedom.
            </p>
          </div>

          {/* Quick Stats Banner */}
          <div className="flex items-center gap-4 bg-deep/40 border border-glow/20 rounded-2xl p-4 backdrop-blur-md">
            <div className="w-12 h-12 rounded-xl bg-glow/15 border border-glow/30 flex items-center justify-center text-glow">
              <Compass className="w-6 h-6 animate-spin" style={{ animationDuration: "24s" }} />
            </div>
            <div>
              <div className="text-xs font-mono-caps text-cream/50">SPATIAL HEADING</div>
              <div className="font-display text-cream font-bold text-sm sm:text-base mt-0.5">
                {headingLabel}
              </div>
            </div>
          </div>
        </div>

        {/* 360 Interactive Spatial Viewport */}
        <div className="relative aspect-[16/9] min-h-[460px] sm:min-h-[560px] rounded-3xl overflow-hidden border border-glow/25 shadow-2xl bg-black select-none">
          {/* Three.js 3D WebGL Canvas */}
          <div
            className="w-full h-full cursor-grab active:cursor-grabbing touch-none"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
          >
            <Canvas
              dpr={[1, 1.75]}
              camera={{ position: [0, 0, 0], fov: 65, near: 0.1, far: 50 }}
              gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
            >
              <CameraController yaw={yaw} pitch={pitch} fov={fov} />
              <ambientLight intensity={THREE.MathUtils.lerp(0.35, 0.8, transition)} />
              <directionalLight
                position={[5, 10, 5]}
                intensity={THREE.MathUtils.lerp(0.8, 1.4, transition)}
                color={transition > 0.5 ? "#f2eee4" : "#ffeedd"}
              />
              <pointLight
                position={[0, 2, 0]}
                intensity={THREE.MathUtils.lerp(18, 35, transition)}
                color={transition > 0.5 ? "#3fb8bf" : "#f87171"}
                distance={15}
              />

              <Suspense fallback={null}>
                <RoomArchitecture transition={transition} />
                <CrowdSilhouettes transition={transition} />
                <FloatingHandset3D transition={transition} />

                {HOTSPOTS.map((s) => (
                  <HotspotMarker3D
                    key={s.id}
                    spot={s}
                    transition={transition}
                    isActive={activeHotspot?.id === s.id}
                    onClick={() => snapToHotspot(s)}
                  />
                ))}
              </Suspense>
            </Canvas>
          </div>

          {/* Top-Left UI Overlay: Hotspot Quick Jumps */}
          <div className="absolute top-4 sm:top-6 left-4 sm:left-6 z-20 flex flex-wrap items-center gap-2 pointer-events-auto">
            {HOTSPOTS.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => snapToHotspot(s)}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono-caps font-semibold backdrop-blur-md border transition-all flex items-center gap-1.5 ${
                  activeHotspot?.id === s.id
                    ? "bg-glow text-ink border-cream shadow-lg scale-105"
                    : "bg-ink/70 text-cream/80 border-glow/20 hover:border-glow/60"
                }`}
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: transition > 0.5 ? "#3fb8bf" : s.color }}
                />
                {s.title}
              </button>
            ))}
          </div>

          {/* Top-Right UI Overlay: Audio, Auto-Rotate */}
          <div className="absolute top-4 sm:top-6 right-4 sm:right-6 z-20 flex items-center gap-2 pointer-events-auto">
            <button
              type="button"
              onClick={toggleMute}
              title={isMuted ? "Unmute Spatial Soundscape" : "Mute Soundscape"}
              className="p-2.5 rounded-xl bg-ink/70 border border-glow/25 text-cream hover:text-glow backdrop-blur-md transition-all hover:scale-105"
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-glow animate-pulse" />}
            </button>

            <button
              type="button"
              onClick={() => setIsAutoRotate(!isAutoRotate)}
              title="Toggle Auto 360° Orbit"
              className={`p-2.5 rounded-xl border backdrop-blur-md transition-all hover:scale-105 ${
                isAutoRotate
                  ? "bg-glow text-ink border-cream"
                  : "bg-ink/70 text-cream border-glow/25 hover:text-glow"
              }`}
            >
              <RotateCw className={`w-4 h-4 ${isAutoRotate ? "animate-spin" : ""}`} />
            </button>
          </div>

          {/* Center-Bottom Floating Metamorphosis Slider Control */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-[92%] max-w-xl z-20 pointer-events-auto">
            <div className="rounded-2xl bg-ink/85 border border-glow/30 backdrop-blur-xl p-4 sm:p-5 shadow-2xl">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-xs font-mono-caps font-bold">
                  <span
                    className={`flex items-center gap-1 transition-colors ${
                      transition < 0.4 ? "text-destructive" : "text-cream/50"
                    }`}
                  >
                    <Flame className="w-3.5 h-3.5" /> Physical Chaos (0%)
                  </span>
                </div>

                <div className="text-xs font-mono-caps text-glow font-bold flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 animate-pulse" />
                  <span>Drag Transformation</span>
                </div>

                <div className="flex items-center gap-2 text-xs font-mono-caps font-bold">
                  <span
                    className={`flex items-center gap-1 transition-colors ${
                      transition > 0.6 ? "text-glow" : "text-cream/50"
                    }`}
                  >
                    <Smartphone className="w-3.5 h-3.5" /> Qblink Flow (100%)
                  </span>
                </div>
              </div>

              {/* Range Slider */}
              <div className="relative flex items-center">
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={transition}
                  onChange={(e) => setTransition(parseFloat(e.target.value))}
                  className="w-full h-3 bg-gradient-to-r from-destructive/60 via-warning/60 to-glow rounded-lg appearance-none cursor-pointer accent-glow shadow-inner"
                />
              </div>

              <div className="flex justify-between items-center text-[11px] text-cream/50 mt-2 font-mono-caps">
                <span>Overwhelmed Room</span>
                <span className="text-cream font-bold">
                  {Math.round(transition * 100)}% Modernized
                </span>
                <span>Calm Pocket Queue</span>
              </div>
            </div>
          </div>

          {/* Interactive Drag Instruction Hint */}
          <div className="absolute top-1/2 left-6 -translate-y-1/2 z-10 pointer-events-none hidden md:flex items-center gap-2 text-xs font-mono-caps text-cream/40 bg-ink/40 px-3 py-2 rounded-xl backdrop-blur-sm border border-cream/5">
            <MoveHorizontal className="w-4 h-4 text-glow animate-pulse" />
            <span>Drag in any direction to look 360°</span>
          </div>
        </div>

        {/* Dynamic Detail Inspector Card of Active Hotspot */}
        <AnimatePresence mode="wait">
          {activeHotspot && (
            <motion.div
              key={activeHotspot.id + (transition > 0.5 ? "-serene" : "-chaos")}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="mt-8 rounded-3xl bg-deep/30 border border-glow/20 p-6 sm:p-8 backdrop-blur-md grid grid-cols-1 lg:grid-cols-3 gap-6 items-center"
            >
              <div className="lg:col-span-2">
                <div className="flex items-center gap-3">
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: transition > 0.5 ? "#3fb8bf" : activeHotspot.color }}
                  />
                  <span className="text-xs font-mono-caps text-glow font-bold tracking-wider uppercase">
                    360° Inspector: {activeHotspot.title}
                  </span>
                  <span
                    className={`text-[11px] font-mono-caps px-2.5 py-0.5 rounded-full font-bold ${
                      transition > 0.5
                        ? "bg-glow/15 text-glow border border-glow/30"
                        : "bg-destructive/15 text-destructive border border-destructive/30"
                    }`}
                  >
                    {transition > 0.5 ? "Qblink Serenity Mode" : "Physical Congestion Mode"}
                  </span>
                </div>

                <h3 className="font-display text-2xl sm:text-3xl text-cream font-bold mt-2">
                  {transition > 0.5 ? activeHotspot.sereneLabel : activeHotspot.chaosLabel}
                </h3>
                <p className="text-cream/70 mt-2 text-sm sm:text-base leading-relaxed max-w-2xl">
                  {transition > 0.5 ? activeHotspot.sereneDescription : activeHotspot.chaosDescription}
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-deep/50 border border-glow/15 flex flex-col justify-between">
                <div className="text-xs font-mono-caps text-cream/50">MEASURABLE IMPACT</div>
                <div className="font-display text-2xl sm:text-3xl text-glow font-bold mt-1">
                  {activeHotspot.metric}
                </div>
                <div className="mt-4 pt-3 border-t border-glow/10 flex items-center justify-between text-xs text-cream/60">
                  <span>Hardware needed</span>
                  <span className="text-cream font-bold">Zero (100% Web)</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
};
export default ChaoticRoom360;
