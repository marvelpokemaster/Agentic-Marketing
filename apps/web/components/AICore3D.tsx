"use client";

import React, { useRef, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF, Float } from "@react-three/drei";
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

function Model({ url }: { url: string }) {
  const { scene } = useGLTF(url);
  return <primitive object={scene} scale={2.2} position={[0, -0.2, 0]} />;
}

function Trellis3DCore({ currentStage }: { currentStage?: CampaignStageColor }) {
  const groupRef = useRef<THREE.Group>(null!);
  const { themeConfig } = useTheme();

  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.4;
    }
  });

  const coreColor = currentStage === "ready" ? "#eab308" : themeConfig.primaryHex;

  return (
    <group ref={groupRef}>
      {/* NVIDIA Trellis Generated 3D Asset */}
      <Suspense
        fallback={
          <mesh>
            <sphereGeometry args={[0.75, 32, 32]} />
            <meshStandardMaterial
              color={coreColor}
              emissive={coreColor}
              emissiveIntensity={0.8}
              wireframe
            />
          </mesh>
        }
      >
        <Float speed={2} rotationIntensity={0.4} floatIntensity={0.4}>
          <Model url="/models/ai_core.glb" />
        </Float>
      </Suspense>

      {/* Orbiting Agent Nodes */}
      {AGENT_NODES.map((node) => {
        const radius = 2.6;
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
    <div className="h-56 w-full relative flex items-center justify-center">
      <Canvas camera={{ position: [0, 2.5, 5], fov: 50 }}>
        <ambientLight intensity={1.2} />
        <directionalLight position={[5, 10, 7]} intensity={1.5} />
        <pointLight position={[-5, -5, -5]} intensity={0.8} color="#00ffff" />
        <Trellis3DCore currentStage={stage} />
      </Canvas>
    </div>
  );
}
