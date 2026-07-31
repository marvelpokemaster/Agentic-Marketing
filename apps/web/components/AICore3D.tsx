"use client";

import React, { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useTheme } from "@/lib/theme";
import type { CampaignStageColor } from "./BackgroundCanvas";

const AGENT_NODES = [
  { key: "planning", label: "Planner", angle: 0 },
  { key: "researching", label: "Research", angle: (Math.PI * 2) / 6 },
  { key: "analyzing", label: "Analyst", angle: ((Math.PI * 2) / 6) * 2 },
  { key: "strategizing", label: "Strategy", angle: ((Math.PI * 2) / 6) * 3 },
  { key: "generating_content", label: "Content", angle: ((Math.PI * 2) / 6) * 4 },
  { key: "generating_images", label: "Creative", angle: ((Math.PI * 2) / 6) * 5 },
];

function CoreRingScene({ currentStage }: { currentStage?: CampaignStageColor }) {
  const groupRef = useRef<THREE.Group>(null!);
  const { themeConfig } = useTheme();

  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.25;
    }
  });

  const coreColor = currentStage === "ready" ? "#eab308" : themeConfig.primaryHex;

  return (
    <group ref={groupRef}>
      {/* Central AI Core Sphere */}
      <mesh>
        <sphereGeometry args={[0.75, 32, 32]} />
        <meshStandardMaterial
          color={coreColor}
          emissive={coreColor}
          emissiveIntensity={0.8}
          roughness={0.2}
          wireframe
        />
      </mesh>

      {/* Orbiting Agent Nodes */}
      {AGENT_NODES.map((node) => {
        const radius = 2.4;
        const x = Math.cos(node.angle) * radius;
        const z = Math.sin(node.angle) * radius;
        const isActive = currentStage === node.key;
        const nodeColor = isActive ? themeConfig.coreHex : themeConfig.primaryHex;

        return (
          <group key={node.key} position={[x, 0, z]}>
            <mesh>
              <sphereGeometry args={[isActive ? 0.28 : 0.18, 16, 16]} />
              <meshBasicMaterial color={nodeColor} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

export function AICore3D({ stage }: { stage?: CampaignStageColor }) {
  return (
    <div className="h-44 w-full relative flex items-center justify-center">
      <Canvas camera={{ position: [0, 2.5, 4.5], fov: 50 }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} />
        <CoreRingScene currentStage={stage} />
      </Canvas>
    </div>
  );
}
