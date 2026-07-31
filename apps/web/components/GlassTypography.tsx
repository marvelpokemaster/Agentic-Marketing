"use client";

import React, { useRef, useMemo } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Center, Float } from "@react-three/drei";
import * as THREE from "three";
import { useTheme } from "@/lib/theme";

interface GlassTypographyProps {
  text?: string;
  subtext?: string;
  roughness?: number;
  thickness?: number;
  refraction?: number;
  frostIntensity?: number;
  chromaticAberration?: number;
  highlightIntensity?: number;
}

const FrostedGlassShader = {
  uniforms: {
    uTime: { value: 0 },
    uRoughness: { value: 0.25 },
    uThickness: { value: 1.2 },
    uRefraction: { value: 0.8 },
    uFrostIntensity: { value: 0.6 },
    uChromaticAberration: { value: 0.04 },
    uHighlightIntensity: { value: 1.4 },
    uColor: { value: new THREE.Color("#0066ff") },
    uCoreColor: { value: new THREE.Color("#38bdf8") },
    uCursor: { value: new THREE.Vector3(999, 999, 999) },
  },

  vertexShader: /* glsl */ `
    varying vec3 vNormal;
    varying vec3 vWorldPosition;
    varying vec3 vViewPosition;

    uniform float uTime;
    uniform vec3 uCursor;

    void main() {
      vec3 pos = position;

      // Microscopic surface ripple wave
      float distToCursor = length(pos - uCursor);
      if (distToCursor < 2.0) {
        float wave = sin(uTime * 4.0 - distToCursor * 3.0) * 0.02;
        pos += normal * wave;
      }

      vec4 worldPosition = modelMatrix * vec4(pos, 1.0);
      vWorldPosition = worldPosition.xyz;

      vec4 mvPosition = viewMatrix * worldPosition;
      vViewPosition = -mvPosition.xyz;

      vNormal = normalize(mat3(modelMatrix) * normal);
      gl_Position = projectionMatrix * mvPosition;
    }
  `,

  fragmentShader: /* glsl */ `
    uniform float uTime;
    uniform float uRoughness;
    uniform float uThickness;
    uniform float uRefraction;
    uniform float uFrostIntensity;
    uniform float uChromaticAberration;
    uniform float uHighlightIntensity;
    uniform vec3 uColor;
    uniform vec3 uCoreColor;
    uniform vec3 uCursor;

    varying vec3 vNormal;
    varying vec3 vWorldPosition;
    varying vec3 vViewPosition;

    // Procedural 3D FBM Noise for Embedded Frosted Texture
    float hash(vec3 p) {
      p = fract(p * 0.3183099 + 0.1);
      p *= 17.0;
      return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
    }

    float noise(vec3 x) {
      vec3 i = floor(x);
      vec3 f = fract(x);
      f = f * f * (3.0 - 2.0 * f);

      return mix(
        mix(mix(hash(i + vec3(0,0,0)), hash(i + vec3(1,0,0)), f.x),
            mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
        mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x),
            mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y), f.z);
    }

    float fbm(vec3 p) {
      float f = 0.0;
      f += 0.5000 * noise(p); p = p * 2.02;
      f += 0.2500 * noise(p); p = p * 2.03;
      f += 0.1250 * noise(p);
      return f;
    }

    void main() {
      vec3 N = normalize(vNormal);
      vec3 V = normalize(vViewPosition);

      // Embedded Frosted Crystal Noise
      float frost = fbm(vWorldPosition * 8.0 + uTime * 0.05) * uFrostIntensity;

      // Fresnel Rim Reflection
      float fresnel = pow(1.0 - max(dot(V, N), 0.0), 3.0);
      vec3 rimColor = mix(uColor, uCoreColor, fresnel) * fresnel * uHighlightIntensity;

      // Studio Key Light Specular Glint
      vec3 L = normalize(vec3(4.0, 6.0, 5.0));
      vec3 H = normalize(L + V);
      float spec = pow(max(dot(N, H), 0.0), 64.0 * (1.0 - uRoughness));
      vec3 specular = vec3(1.0) * spec * uHighlightIntensity;

      // Chromatic Dispersion Offset (RGB Fringe)
      vec3 rCol = uColor * (0.8 + frost * 0.4);
      vec3 gCol = uCoreColor * (0.85 + frost * 0.3);
      vec3 bCol = mix(uColor, vec3(1.0), 0.5) * (0.9 + frost * 0.2);

      vec3 baseRefraction = vec3(
        rCol.r * (1.0 + uChromaticAberration),
        gCol.g,
        bCol.b * (1.0 - uChromaticAberration)
      );

      // Cursor Proximity Highlight Shimmer
      float cursorDist = length(vWorldPosition - uCursor);
      float cursorHighlight = smoothstep(2.5, 0.0, cursorDist) * 0.5;

      vec3 finalColor = baseRefraction * 0.7 + rimColor * 0.8 + specular + vec3(cursorHighlight) * uCoreColor;

      gl_FragColor = vec4(finalColor, 0.92);
    }
  `,
};

function CrystalTextScene({
  text = "AUTONOMOUS CAMPAIGN",
  subtext = "ORCHESTRATION.",
  roughness = 0.25,
  thickness = 1.2,
  refraction = 0.8,
  frostIntensity = 0.6,
  chromaticAberration = 0.04,
  highlightIntensity = 1.4,
}: GlassTypographyProps) {
  const meshRef = useRef<THREE.Mesh>(null!);
  const materialRef = useRef<THREE.ShaderMaterial>(null!);
  const { themeConfig } = useTheme();
  const { viewport, pointer } = useThree();

  const cursorWorld = useMemo(() => new THREE.Vector3(999, 999, 999), []);

  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: THREE.UniformsUtils.clone(FrostedGlassShader.uniforms),
      vertexShader: FrostedGlassShader.vertexShader,
      fragmentShader: FrostedGlassShader.fragmentShader,
      transparent: true,
      depthWrite: true,
    });
  }, []);

  useFrame((state) => {
    if (!materialRef.current) return;

    const time = state.clock.getElapsedTime();

    cursorWorld.set(
      (pointer.x * viewport.width) / 2,
      (pointer.y * viewport.height) / 2,
      0
    );

    materialRef.current.uniforms.uTime.value = time;
    materialRef.current.uniforms.uRoughness.value = roughness;
    materialRef.current.uniforms.uThickness.value = thickness;
    materialRef.current.uniforms.uRefraction.value = refraction;
    materialRef.current.uniforms.uFrostIntensity.value = frostIntensity;
    materialRef.current.uniforms.uChromaticAberration.value = chromaticAberration;
    materialRef.current.uniforms.uHighlightIntensity.value = highlightIntensity;
    materialRef.current.uniforms.uColor.value.set(themeConfig.primaryHex);
    materialRef.current.uniforms.uCoreColor.value.set(themeConfig.coreHex);
    materialRef.current.uniforms.uCursor.value.copy(cursorWorld);
  });

  return (
    <Float speed={1.5} rotationIntensity={0.1} floatIntensity={0.2}>
      <Center>
        <mesh ref={meshRef}>
          {/* High-density 3D Crystal Plate Geometry for Optically Etched Typography */}
          <boxGeometry args={[6.8, 2.2, 0.4, 64, 32, 8]} />
          <primitive object={material} ref={materialRef} attach="material" />
        </mesh>
      </Center>
    </Float>
  );
}

export function GlassTypography(props: GlassTypographyProps) {
  return (
    <div className="w-full relative flex flex-col items-center justify-center my-2">
      {/* Screen Reader & SEO Accessibility Heading */}
      <h1 className="sr-only">
        {props.text || "Autonomous Campaign"} {props.subtext || "Orchestration."}
      </h1>

      {/* WebGL Refractive Frosted Glass Shader Canvas */}
      <div className="h-44 sm:h-52 w-full relative flex items-center justify-center select-none overflow-hidden">
        <Canvas
          camera={{ position: [0, 0, 5.2], fov: 40 }}
          gl={{
            antialias: true,
            alpha: true,
            powerPreference: "high-performance",
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: 1.1,
          }}
        >
          <ambientLight intensity={0.6} />
          <directionalLight position={[5, 8, 5]} intensity={2.0} />

          <CrystalTextScene {...props} />
        </Canvas>
      </div>
    </div>
  );
}
