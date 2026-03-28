import { useRef, useMemo, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Float, MeshDistortMaterial, MeshWobbleMaterial, Sphere, Stars } from '@react-three/drei';
import * as THREE from 'three';

/* ──────────────────────────────────────────────
   HERO BLOB — a massive morphing orb that 
   pulses like a living organism
   ────────────────────────────────────────────── */
function HeroBlob() {
  const core = useRef();
  const halo = useRef();

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (core.current) {
      core.current.rotation.x = t * 0.1;
      core.current.rotation.y = t * 0.15;
      core.current.position.y = Math.sin(t * 0.5) * 0.2;
    }
    if (halo.current) {
      halo.current.rotation.x = t * -0.05;
      halo.current.position.y = Math.sin(t * 0.5) * 0.2;
      halo.current.scale.setScalar(1.0 + Math.sin(t * 1.5) * 0.03);
    }
  });

  return (
    <group position={[3.5, 2, -3]}>
      {/* Central intense sun illumination */}
      <pointLight color="#F97316" intensity={3} distance={15} />

      {/* Solid warm glowing core (The Sun) */}
      <Sphere ref={core} args={[2.3, 128, 128]}>
        <MeshDistortMaterial
          color="#FACC15"
          attach="material"
          distort={0.4}
          speed={1.5}
          roughness={0.1}
          metalness={0.9}
          emissive="#F97316"
          emissiveIntensity={1.0}
        />
      </Sphere>

      {/* Ethereal softer glowing rim (The Aurora Halo) */}
      <Sphere ref={halo} args={[2.8, 64, 64]}>
        <MeshDistortMaterial
          color="#EAB308"
          attach="material"
          distort={0.2}
          speed={2.0}
          roughness={0.4}
          metalness={0.1}
          emissive="#EAB308"
          emissiveIntensity={0.8}
          transparent
          opacity={0.3}
          blending={THREE.AdditiveBlending}
        />
      </Sphere>
    </group>
  );
}

/* ──────────────────────────────────────────────
   ORBITING RINGS — holographic rings that 
   orbit the hero blob
   ────────────────────────────────────────────── */
function OrbitingRing({ radius, speed, tilt, color, thickness = 0.015, opacity = 0.4 }) {
  const ref = useRef();

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (ref.current) {
      ref.current.rotation.x = tilt + t * speed * 0.3;
      ref.current.rotation.y = t * speed * 0.5;
      ref.current.rotation.z = t * speed * 0.2;
    }
  });

  return (
    <mesh ref={ref} position={[3.5, 2, -3]}>
      <torusGeometry args={[radius, thickness, 32, 200]} />
      <meshBasicMaterial color={color} transparent opacity={opacity} />
    </mesh>
  );
}

/* ──────────────────────────────────────────────
   FLOATING DIAMONDS — crystalline shapes that
   drift in space
   ────────────────────────────────────────────── */
function FloatingDiamond({ position, color, speed = 1, scale = 1 }) {
  const ref = useRef();

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (ref.current) {
      ref.current.rotation.x = t * 0.5 * speed;
      ref.current.rotation.y = t * 0.3 * speed;
      ref.current.rotation.z = t * 0.4 * speed;
      ref.current.position.y = position[1] + Math.sin(t * speed * 0.6) * 0.5;
    }
  });

  return (
    <Float speed={speed * 2} rotationIntensity={0.5} floatIntensity={0.8}>
      <mesh ref={ref} position={position} scale={scale}>
        <octahedronGeometry args={[0.3, 0]} />
        <meshStandardMaterial
          color={color}
          roughness={0.1}
          metalness={1}
          emissive={color}
          emissiveIntensity={0.3}
          transparent
          opacity={0.7}
        />
      </mesh>
    </Float>
  );
}

/* ──────────────────────────────────────────────
   ENERGY PARTICLES — streaming particle field
   that flows like energy
   ────────────────────────────────────────────── */
function EnergyParticles() {
  const count = 500;
  const ref = useRef();

  const [positions, velocities] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const vel = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 25;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 25;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 15 - 5;
      vel[i * 3] = (Math.random() - 0.5) * 0.01;
      vel[i * 3 + 1] = (Math.random() - 0.5) * 0.01;
      vel[i * 3 + 2] = (Math.random() - 0.5) * 0.005;
    }
    return [pos, vel];
  }, []);

  useFrame((state) => {
    if (!ref.current) return;
    const posAttr = ref.current.geometry.attributes.position;
    const t = state.clock.elapsedTime;

    for (let i = 0; i < count; i++) {
      posAttr.array[i * 3] += velocities[i * 3] + Math.sin(t * 0.5 + i) * 0.002;
      posAttr.array[i * 3 + 1] += velocities[i * 3 + 1] + Math.cos(t * 0.3 + i) * 0.002;
      posAttr.array[i * 3 + 2] += velocities[i * 3 + 2];

      // Wrap around
      if (Math.abs(posAttr.array[i * 3]) > 12) posAttr.array[i * 3] *= -0.9;
      if (Math.abs(posAttr.array[i * 3 + 1]) > 12) posAttr.array[i * 3 + 1] *= -0.9;
      if (Math.abs(posAttr.array[i * 3 + 2]) > 10) posAttr.array[i * 3 + 2] *= -0.9;
    }
    posAttr.needsUpdate = true;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial
        color="#FDE047"
        size={0.04}
        sizeAttenuation
        transparent
        opacity={0.8}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}

/* ──────────────────────────────────────────────
   AURORA PLANE — a shimmering aurora effect
   ────────────────────────────────────────────── */
function AuroraPlane() {
  const ref = useRef();
  const mat = useRef();

  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.x = -Math.PI / 3;
      ref.current.position.y = 4 + Math.sin(state.clock.elapsedTime * 0.2) * 0.5;
    }
  });

  return (
    <mesh ref={ref} position={[0, 4, -8]} scale={[15, 8, 1]}>
      <planeGeometry args={[1, 1, 32, 32]} />
      <MeshWobbleMaterial
        ref={mat}
        color="#EA580C"
        emissive="#F97316"
        emissiveIntensity={0.1}
        factor={0.3}
        speed={0.8}
        transparent
        opacity={0.12}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

/* ──────────────────────────────────────────────
   LIGHT BEAM — volumetric light rays
   ────────────────────────────────────────────── */
function LightBeam({ position, rotation, color, scale = [0.02, 8, 0.02], opacity = 0.15 }) {
  const ref = useRef();

  useFrame((state) => {
    if (ref.current) {
      ref.current.material.opacity = opacity + Math.sin(state.clock.elapsedTime * 2 + position[0]) * 0.05;
    }
  });

  return (
    <mesh ref={ref} position={position} rotation={rotation} scale={scale}>
      <boxGeometry args={[1, 1, 1]} />
      <meshBasicMaterial color={color} transparent opacity={opacity} blending={THREE.AdditiveBlending} />
    </mesh>
  );
}

/* ──────────────────────────────────────────────
   MAIN SCENE
   ────────────────────────────────────────────── */
export default function Scene3D() {
  return (
    <div className="scene-container">
      <Canvas
        camera={{ position: [0, 0, 8], fov: 60 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      >
        {/* Dramatic lighting */}
        <ambientLight intensity={0.08} />
        <pointLight position={[10, 10, 5]} intensity={0.8} color="#FACC15" />
        <pointLight position={[-10, -5, 3]} intensity={0.5} color="#EAB308" />
        <pointLight position={[0, 8, -5]} intensity={0.6} color="#FEF08A" />
        <pointLight position={[5, -8, 2]} intensity={0.3} color="#FDE047" />
        <spotLight position={[0, 15, 0]} angle={0.3} penumbra={1} intensity={0.4} color="#EAB308" />

        {/* Hero Blob */}
        <HeroBlob />

        {/* Orbiting Rings */}
        <OrbitingRing radius={3.5} speed={0.4} tilt={0.3} color="#FACC15" thickness={0.012} opacity={0.3} />
        <OrbitingRing radius={4.2} speed={-0.3} tilt={1.2} color="#FDE047" thickness={0.008} opacity={0.2} />
        <OrbitingRing radius={5} speed={0.2} tilt={0.8} color="#EAB308" thickness={0.006} opacity={0.15} />

        {/* Floating Diamonds */}
        <FloatingDiamond position={[-5, 2, -3]} color="#FACC15" speed={0.8} scale={0.9} />
        <FloatingDiamond position={[5.5, -1, -4]} color="#EAB308" speed={0.6} scale={0.7} />
        <FloatingDiamond position={[-3, -3, -2]} color="#FEF08A" speed={1} scale={0.5} />
        <FloatingDiamond position={[4, 3.5, -5]} color="#FDE047" speed={0.7} scale={0.6} />
        <FloatingDiamond position={[-6, -1, -6]} color="#FB923C" speed={0.9} scale={0.4} />
        <FloatingDiamond position={[6, 1.5, -3]} color="#FB923C" speed={0.5} scale={0.8} />

        {/* Energy Particles */}
        <EnergyParticles />

        {/* Aurora Effect */}
        <AuroraPlane />

        {/* Light beams */}
        <LightBeam position={[-4, 0, -6]} rotation={[0, 0, 0.3]} color="#FACC15" scale={[0.015, 12, 0.015]} opacity={0.08} />
        <LightBeam position={[3, 0, -7]} rotation={[0, 0, -0.2]} color="#FDE047" scale={[0.01, 10, 0.01]} opacity={0.06} />
        <LightBeam position={[0, 0, -5]} rotation={[0, 0, 0.1]} color="#EAB308" scale={[0.02, 14, 0.02]} opacity={0.05} />

        {/* Deep star field */}
        <Stars radius={80} depth={80} count={3000} factor={4} saturation={0.8} fade speed={0.3} />

        {/* Fog for depth */}
        <fog attach="fog" args={['#030014', 5, 22]} />
      </Canvas>
    </div>
  );
}
