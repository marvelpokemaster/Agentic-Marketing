"use client";

import React, { useRef, useMemo, useState, useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { loadVolumetricParticleDatasets, VolumetricParticleBufferData } from "./BinaryParticleLoader";
import { VolumetricSculptureShader } from "./InstancedSculptureShader";
import { useTheme } from "@/lib/theme";

interface InstancedSphereRendererProps {
  morphProgress?: number;
  instanceCount?: number;
}

export function InstancedSphereRenderer({
  morphProgress = 0,
  instanceCount = 25000,
}: InstancedSphereRendererProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null!);
  const materialRef = useRef<THREE.ShaderMaterial>(null!);
  const { themeConfig } = useTheme();
  const { viewport, pointer } = useThree();

  const [gpuBuffers, setGpuBuffers] = useState<VolumetricParticleBufferData | null>(null);

  const targetCursor = useMemo(() => new THREE.Vector3(999, 999, 999), []);
  const smoothedCursor = useMemo(() => new THREE.Vector3(999, 999, 999), []);

  // 1. Fetch & Stream Volumetric Binary Particle Datasets (.bin)
  useEffect(() => {
    let isMounted = true;
    loadVolumetricParticleDatasets(instanceCount).then((data) => {
      if (isMounted) setGpuBuffers(data);
    });
    return () => {
      isMounted = false;
    };
  }, [instanceCount]);

  // 2. Geometry with Attached GPU Instanced Attributes
  const geometry = useMemo(() => {
    if (!gpuBuffers) return null;

    const geo = new THREE.IcosahedronGeometry(1, 1);

    geo.setAttribute(
      "aPosSphere",
      new THREE.InstancedBufferAttribute(gpuBuffers.posSphere, 3)
    );
    geo.setAttribute(
      "aPosTorus",
      new THREE.InstancedBufferAttribute(gpuBuffers.posTorus, 3)
    );
    geo.setAttribute(
      "aPosOctahedron",
      new THREE.InstancedBufferAttribute(gpuBuffers.posOctahedron, 3)
    );
    geo.setAttribute(
      "aParams",
      new THREE.InstancedBufferAttribute(gpuBuffers.params, 3)
    );

    return geo;
  }, [gpuBuffers]);

  // 3. GPU Custom Shader Material Definition
  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: THREE.UniformsUtils.clone(VolumetricSculptureShader.uniforms),
      vertexShader: VolumetricSculptureShader.vertexShader,
      fragmentShader: VolumetricSculptureShader.fragmentShader,
    });
  }, []);

  // 4. Zero CPU Execution Loop (60 FPS Shader Execution)
  useFrame((state) => {
    if (!materialRef.current) return;

    const time = state.clock.getElapsedTime();

    // Map Pointer NDC to 3D World Space Position
    targetCursor.set(
      (pointer.x * viewport.width) / 2,
      (pointer.y * viewport.height) / 2,
      0
    );

    // Smooth spring lerp tracking (0.14 factor for fluid organic momentum)
    smoothedCursor.lerp(targetCursor, 0.14);

    // Update GPU Shader Uniforms
    materialRef.current.uniforms.uTime.value = time;
    materialRef.current.uniforms.uMorphProgress.value = morphProgress;
    materialRef.current.uniforms.uCursor.value.copy(smoothedCursor);
    materialRef.current.uniforms.uColor.value.set(themeConfig.primaryHex);
    materialRef.current.uniforms.uCoreColor.value.set(themeConfig.coreHex);
  });

  if (!geometry || !gpuBuffers) return null;

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, undefined, gpuBuffers.count]}
      castShadow
      receiveShadow
    >
      <primitive object={material} ref={materialRef} attach="material" />
    </instancedMesh>
  );
}
