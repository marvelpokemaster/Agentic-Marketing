"use client";

import React, { useRef, useMemo, useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { generateSculptureSampleData } from "./MeshSampler";
import { useTheme } from "@/lib/theme";

interface InstancedSphereRendererProps {
  morphProgress?: number; // 0.0 = Sphere, 1.0 = Torus, 2.0 = Octahedron
  instanceCount?: number;
}

export function InstancedSphereRenderer({
  morphProgress = 0,
  instanceCount = 50000,
}: InstancedSphereRendererProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null!);
  const { themeConfig } = useTheme();
  const { viewport, pointer } = useThree();

  // 1. Generate Surface Sampling Data (Cached via useMemo)
  const data = useMemo(() => {
    return generateSculptureSampleData(instanceCount);
  }, [instanceCount]);

  // 2. Pre-allocate Physics & Spring Buffers to Avoid GC Allocation in Render Loop
  const currentPos = useMemo(() => new Float32Array(data.count * 3), [data.count]);
  const velocities = useMemo(() => new Float32Array(data.count * 3), [data.count]);

  // Pre-allocate temporary Three.js Math Objects
  const dummyMatrix = useMemo(() => new THREE.Matrix4(), []);
  const dummyPos = useMemo(() => new THREE.Vector3(), []);
  const dummyScale = useMemo(() => new THREE.Vector3(), []);
  const dummyQuat = useMemo(() => new THREE.Quaternion(), []);
  const cursorWorld = useMemo(() => new THREE.Vector3(), []);

  // Initialize current positions to Shape 1 (Sphere)
  useEffect(() => {
    const pos = data.shapeSphere.positions;
    for (let i = 0; i < data.count * 3; i++) {
      currentPos[i] = pos[i];
    }
  }, [data, currentPos]);

  // 3. Render Loop: GPU Instanced Updates & Physics Simulation
  useFrame((state, delta) => {
    if (!meshRef.current) return;

    const time = state.clock.getElapsedTime();

    // Map 2D Cursor (NDC) to 3D World Coordinates at z=0 plane
    cursorWorld.set(
      (pointer.x * viewport.width) / 2,
      (pointer.y * viewport.height) / 2,
      0
    );

    // Calculate Morph Target Interpolation Weights
    // Target 0: Sphere, Target 1: Torus, Target 2: Octahedron
    const progressClamped = Math.max(0, Math.min(2, morphProgress));
    const targetIdxA = Math.floor(progressClamped);
    const targetIdxB = Math.min(2, targetIdxA + 1);
    const blendFactor = progressClamped - targetIdxA;

    const posA = targetIdxA === 0 ? data.shapeSphere.positions : targetIdxA === 1 ? data.shapeTorus.positions : data.shapeOctahedron.positions;
    const posB = targetIdxB === 0 ? data.shapeSphere.positions : targetIdxB === 1 ? data.shapeTorus.positions : data.shapeOctahedron.positions;

    const repulsionRadius = 1.8;
    const repulsionStrength = 2.4;
    const springStiffness = 12.0;
    const damping = 0.88;

    for (let i = 0; i < data.count; i++) {
      const idx3 = i * 3;

      // Base Morphed Position
      const targetX = posA[idx3 + 0] * (1 - blendFactor) + posB[idx3 + 0] * blendFactor;
      const targetY = posA[idx3 + 1] * (1 - blendFactor) + posB[idx3 + 1] * blendFactor;
      const targetZ = posA[idx3 + 2] * (1 - blendFactor) + posB[idx3 + 2] * blendFactor;

      // Organic Noise & Breathing Motion
      const phase = data.phases[i];
      const speed = data.speeds[i];
      const breathX = Math.sin(time * speed + phase) * 0.04;
      const breathY = Math.cos(time * speed * 1.2 + phase) * 0.04;
      const breathZ = Math.sin(time * speed * 0.8 + phase) * 0.04;

      const restX = targetX + breathX;
      const restY = targetY + breathY;
      const restZ = targetZ + breathZ;

      // Current Particle Position
      let px = currentPos[idx3 + 0];
      let py = currentPos[idx3 + 1];
      let pz = currentPos[idx3 + 2];

      // Cursor Repulsion in 3D World Space
      const dx = px - cursorWorld.x;
      const dy = py - cursorWorld.y;
      const dz = pz - cursorWorld.z;
      const distSq = dx * dx + dy * dy + dz * dz;
      const dist = Math.sqrt(distSq);

      let forceX = 0;
      let forceY = 0;
      let forceZ = 0;

      if (dist < repulsionRadius && dist > 0.001) {
        // Smoothstep falloff curve: 1 at center, 0 at outer edge
        const normDist = dist / repulsionRadius;
        const falloff = (1 - normDist) * (1 - normDist);
        const push = falloff * repulsionStrength;
        forceX = (dx / dist) * push;
        forceY = (dy / dist) * push;
        forceZ = (dz / dist) * push;
      }

      // Spring Restoration Force toward rest position
      const springX = (restX - px) * springStiffness;
      const springY = (restY - py) * springStiffness;
      const springZ = (restZ - pz) * springStiffness;

      // Physics Integration (Euler + Velocity Damping)
      let vx = (velocities[idx3 + 0] + (springX + forceX) * delta) * damping;
      let vy = (velocities[idx3 + 1] + (springY + forceY) * delta) * damping;
      let vz = (velocities[idx3 + 2] + (springZ + forceZ) * delta) * damping;

      velocities[idx3 + 0] = vx;
      velocities[idx3 + 1] = vy;
      velocities[idx3 + 2] = vz;

      px += vx * delta;
      py += vy * delta;
      pz += vz * delta;

      currentPos[idx3 + 0] = px;
      currentPos[idx3 + 1] = py;
      currentPos[idx3 + 2] = pz;

      // Set Instance Transform Matrix
      dummyPos.set(px, py, pz);
      const s = data.scales[i] * 0.024;
      dummyScale.set(s, s, s);
      dummyMatrix.compose(dummyPos, dummyQuat, dummyScale);

      meshRef.current.setMatrixAt(i, dummyMatrix);
    }

    // Flag GPU buffer update
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  const materialColor = themeConfig.primaryHex;

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, data.count]}
      castShadow
      receiveShadow
    >
      <sphereGeometry args={[1, 10, 10]} />
      <meshPhysicalMaterial
        color={materialColor}
        emissive={materialColor}
        emissiveIntensity={0.25}
        roughness={0.15}
        metalness={0.8}
        clearcoat={1.0}
        clearcoatRoughness={0.1}
      />
    </instancedMesh>
  );
}
