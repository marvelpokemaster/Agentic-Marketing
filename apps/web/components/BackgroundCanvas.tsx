"use client";

import React, { useRef, useMemo, useEffect, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useTheme } from "@/lib/theme";

export type CampaignStageColor = "planning" | "researching" | "analyzing" | "strategizing" | "generating_content" | "generating_images" | "ready" | "published" | "default";

const STAGE_COLORS: Record<CampaignStageColor, string> = {
  default: "#0066ff",
  planning: "#0066ff",
  researching: "#38bdf8",
  analyzing: "#8b5cf6",
  strategizing: "#ec4899",
  generating_content: "#f97316",
  generating_images: "#10b981",
  ready: "#eab308",
  published: "#10b981",
};

function EvolvingParticleField({ stage = "default" }: { stage?: CampaignStageColor }) {
  const pointsRef = useRef<THREE.Points>(null!);
  const { themeConfig } = useTheme();
  const count = 220; // Bound particle count for 60fps performance

  // If default stage, fallback to active theme's primary particle hex
  const targetColorHex = stage !== "default" ? (STAGE_COLORS[stage] || themeConfig.particleHex) : themeConfig.particleHex;
  const currentColorRef = useRef(new THREE.Color(targetColorHex));

  const [positions, colors] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const c = new THREE.Color(targetColorHex);

    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 16;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 16;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 16;

      col[i * 3] = c.r;
      col[i * 3 + 1] = c.g;
      col[i * 3 + 2] = c.b;
    }
    return [pos, col];
  }, [targetColorHex]);

  useFrame((state, delta) => {
    if (!pointsRef.current) return;
    pointsRef.current.rotation.y += delta * 0.05;
    pointsRef.current.rotation.x += delta * 0.02;

    // Smoothly interpolate color transitions to theme particle color
    const targetC = new THREE.Color(targetColorHex);
    currentColorRef.current.lerp(targetC, 0.05);

    const colorAttr = pointsRef.current.geometry.attributes.color;
    if (colorAttr) {
      const array = colorAttr.array as Float32Array;
      for (let i = 0; i < count; i++) {
        array[i * 3] = currentColorRef.current.r;
        array[i * 3 + 1] = currentColorRef.current.g;
        array[i * 3 + 2] = currentColorRef.current.b;
      }
      colorAttr.needsUpdate = true;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
        <bufferAttribute
          attach="attributes-color"
          args={[colors, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.06}
        vertexColors
        transparent
        opacity={0.65}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}

export function BackgroundCanvas({ stage }: { stage?: CampaignStageColor }) {
  const [shouldRender, setShouldRender] = useState(true);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mediaQuery.matches) {
      setShouldRender(false);
    }

    const handleVisibility = () => {
      setShouldRender(!document.hidden && !mediaQuery.matches);
    };

    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, []);

  if (!shouldRender) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-0 h-full w-full opacity-60">
      <Canvas
        camera={{ position: [0, 0, 8], fov: 60 }}
        gl={{ antialias: false, powerPreference: "high-performance" }}
      >
        <ambientLight intensity={0.2} />
        <EvolvingParticleField stage={stage} />
      </Canvas>
    </div>
  );
}
