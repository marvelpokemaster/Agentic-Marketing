"use client";

import React, { Suspense, useState, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import * as THREE from "three";
import { StudioLighting } from "./StudioLighting";
import { InstancedSphereRenderer } from "./InstancedSphereRenderer";
import { useSculptureScrollMorph } from "./ScrollController";

interface VolumetricSculptureCanvasProps {
  instanceCount?: number;
}

export function VolumetricSculptureCanvas({ instanceCount }: VolumetricSculptureCanvasProps) {
  const morphProgress = useSculptureScrollMorph();
  const [optimalInstanceCount, setOptimalInstanceCount] = useState(22000);
  const [dpr, setDpr] = useState(1.5);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Performance-Oriented Hardware Scaling
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const cores = navigator.hardwareConcurrency || 4;

    if (isMobile || cores <= 4) {
      setOptimalInstanceCount(12000); // 12k instances for low-end hardware
      setDpr(1.0);
    } else {
      setOptimalInstanceCount(instanceCount || 22000); // 22k larger beads for desktop
      setDpr(Math.min(2.0, window.devicePixelRatio || 1.5));
    }
  }, [instanceCount]);

  return (
    <div className="h-80 sm:h-96 w-full relative flex items-center justify-center select-none overflow-hidden">
      <Canvas
        shadows
        dpr={dpr}
        camera={{ position: [0, 0, 6.2], fov: 42 }}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.15,
        }}
      >
        <StudioLighting />

        <Suspense fallback={null}>
          <InstancedSphereRenderer
            morphProgress={morphProgress}
            instanceCount={optimalInstanceCount}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}
