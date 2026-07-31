"use client";

import React from "react";
import { useTheme } from "@/lib/theme";

export function StudioLighting() {
  const { themeConfig } = useTheme();

  return (
    <>
      {/* Soft Ambient Baseline */}
      <ambientLight intensity={0.4} />

      {/* Key Studio Shadow Light */}
      <directionalLight
        position={[6, 8, 6]}
        intensity={2.2}
        color="#ffffff"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-near={0.5}
        shadow-camera-far={25}
        shadow-bias={-0.0001}
      />

      {/* Primary Brand Rim Light */}
      <pointLight
        position={[-6, 4, -4]}
        intensity={3.5}
        color={themeConfig.primaryHex}
        distance={18}
      />

      {/* Core Accent Fill Light */}
      <pointLight
        position={[0, -5, 4]}
        intensity={2.0}
        color={themeConfig.coreHex}
        distance={15}
      />

      {/* Top Studio Soft Area Light */}
      <directionalLight position={[0, 10, 0]} intensity={0.6} color="#e2e8f0" />
    </>
  );
}
