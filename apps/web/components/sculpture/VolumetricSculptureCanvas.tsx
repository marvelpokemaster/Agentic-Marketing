"use client";

import React, { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import * as THREE from "three";
import { StudioLighting } from "./StudioLighting";
import { InstancedSphereRenderer } from "./InstancedSphereRenderer";
import { useSculptureScrollMorph } from "./ScrollController";

interface VolumetricSculptureCanvasProps {
  instanceCount?: number;
}

export function VolumetricSculptureCanvas({ instanceCount = 50000 }: VolumetricSculptureCanvasProps) {
  const morphProgress = useSculptureScrollMorph();

  return (
    <div className="h-64 sm:h-80 w-full relative flex items-center justify-center select-none overflow-hidden">
      <Canvas
        shadows
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
            instanceCount={instanceCount}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}
