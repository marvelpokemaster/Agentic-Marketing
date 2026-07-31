"use client";

import React, { useRef, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { generateGPUSculptureBuffers } from "./MeshSampler";
import { VolumetricSculptureShader } from "./InstancedSculptureShader";
import { useTheme } from "@/lib/theme";

interface InstancedSphereRendererProps {
  morphProgress?: number;
  instanceCount?: number;
}

export function InstancedSphereRenderer({
  morphProgress = 0,
  instanceCount = 40000,
}: InstancedSphereRendererProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null!);
  const materialRef = useRef<THREE.ShaderMaterial>(null!);
  const { themeConfig } = useTheme();
  const { viewport, pointer } = useThree();

  const cursorWorld = useMemo(() => new THREE.Vector3(999, 999, 999), []);

  // 1. Generate Packed GPU Instanced Attributes (Cached via useMemo)
  const gpuBuffers = useMemo(() => {
    return generateGPUSculptureBuffers(instanceCount);
  }, [instanceCount]);

  // 2. Optimized Geometry with Attached GPU Instanced Attributes
  const geometry = useMemo(() => {
    // 20-face Icosahedron for pristine smooth normals & minimal vertex shader load
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

  // 4. Zero CPU Loop Render Engine (60 FPS GPU Execution)
  useFrame((state) => {
    if (!materialRef.current) return;

    const time = state.clock.getElapsedTime();

    // Map 2D Cursor NDC to 3D World Space Position
    cursorWorld.set(
      (pointer.x * viewport.width) / 2,
      (pointer.y * viewport.height) / 2,
      0
    );

    // Update GPU Shader Uniforms (Only 4 Uniform Assignments per frame)
    materialRef.current.uniforms.uTime.value = time;
    materialRef.current.uniforms.uMorphProgress.value = morphProgress;
    materialRef.current.uniforms.uCursor.value.copy(cursorWorld);
    materialRef.current.uniforms.uColor.value.set(themeConfig.primaryHex);
    materialRef.current.uniforms.uCoreColor.value.set(themeConfig.coreHex);
  });

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
