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
  const [optimalInstanceCount, setOptimalInstanceCount] = useState(35000);
  const [dpr, setDpr] = useState(1.5);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Adaptive hardware performance detection
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const cores = navigator.hardwareConcurrency || 4;

    if (isMobile || cores <= 4) {
      setOptimalInstanceCount(20000);
      setDpr(1.0);
    } else {
      setOptimalInstanceCount(instanceCount || 45000);
      setDpr(Math.min(2.0, window.devicePixelRatio || 1.5));
    }
  }, [instanceCount]);

  return (
    <div className="h-64 sm:h-80 w-full relative flex items-center justify-center select-none overflow-hidden">
      <Canvas
        shadows
        dpr={dpr}
        camera={{ position: [0, 0, 5.5], fov: 45 }}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.1,
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
