"use client";

import React, { useEffect, useState, useRef } from "react";
import { useTheme } from "@/lib/theme";

export function CustomCursor() {
  const [enabled, setEnabled] = useState(false);
  const [hovered, setHovered] = useState(false);
  const { themeConfig } = useTheme();

  // Motion physics refs to avoid React state re-render latency
  const cursorRef = useRef<HTMLDivElement>(null);
  const svgFilterScaleRef = useRef<SVGFEDisplacementMapElement>(null);

  const pos = useRef({ x: 0, y: 0 });
  const target = useRef({ x: 0, y: 0 });
  const vel = useRef({ x: 0, y: 0 });
  const scale = useRef({ x: 1, y: 1 });
  const angle = useRef(0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const isTouch = window.matchMedia("(pointer: coarse)").matches;
    const isReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (!isTouch && !isReducedMotion) {
      setEnabled(true);
    }

    const handleMouseMove = (e: MouseEvent) => {
      target.current.x = e.clientX;
      target.current.y = e.clientY;

      const targetEl = e.target as HTMLElement | null;
      if (targetEl) {
        const isInteractive =
          targetEl.closest(
            "button, a, input, select, textarea, [role='button'], [data-magnetic='true'], h1, h2, h3, p, .interactive"
          ) !== null;
        setHovered(isInteractive);
      }
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // Spring physics & dynamic velocity deformation RAF render loop
  useEffect(() => {
    if (!enabled) return;

    let animationFrameId: number;

    const lerp = (a: number, b: number, n: number) => a + (b - a) * n;

    const render = () => {
      // Smooth lerp tracking (Spring interpolation)
      const prevX = pos.current.x;
      const prevY = pos.current.y;

      pos.current.x = lerp(pos.current.x, target.current.x, 0.18);
      pos.current.y = lerp(pos.current.y, target.current.y, 0.18);

      // Compute velocity vector
      const dx = pos.current.x - prevX;
      const dy = pos.current.y - prevY;
      const speed = Math.sqrt(dx * dx + dy * dy);

      // Squash and stretch deformation based on velocity
      const targetScaleX = 1 + Math.min(speed * 0.015, 0.45);
      const targetScaleY = 1 - Math.min(speed * 0.008, 0.3);
      scale.current.x = lerp(scale.current.x, targetScaleX, 0.2);
      scale.current.y = lerp(scale.current.y, targetScaleY, 0.2);

      // Directional rotation angle
      if (speed > 0.5) {
        angle.current = Math.atan2(dy, dx) * (180 / Math.PI);
      }

      // Update Displacement Map intensity based on speed + hover state
      if (svgFilterScaleRef.current) {
        const baseDisplacement = hovered ? 32 : 14;
        const dynamicDisplacement = baseDisplacement + Math.min(speed * 0.8, 24);
        svgFilterScaleRef.current.setAttribute("scale", dynamicDisplacement.toString());
      }

      // Direct DOM mutation for 60 FPS hardware acceleration
      if (cursorRef.current) {
        const hoverScale = hovered ? 1.65 : 1.0;
        const finalScaleX = scale.current.x * hoverScale;
        const finalScaleY = scale.current.y * hoverScale;

        cursorRef.current.style.transform = `translate3d(${pos.current.x}px, ${pos.current.y}px, 0px) translate(-50%, -50%) rotate(${angle.current}deg) scale(${finalScaleX}, ${finalScaleY})`;
      }

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animationFrameId);
  }, [enabled, hovered]);

  if (!enabled) return null;

  return (
    <>
      {/* SVG Optical Refraction & Chromatic Distortion Filter */}
      <svg className="pointer-events-none fixed inset-0 z-0 h-0 w-0 opacity-0">
        <defs>
          <filter id="liquid-glass-lens" x="-50%" y="-50%" width="200%" height="200%">
            {/* Perlin noise map for organic fluid refraction */}
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.02 0.02"
              numOctaves="2"
              result="noise"
            />
            {/* Optical UV Displacement */}
            <feDisplacementMap
              ref={svgFilterScaleRef}
              in="SourceGraphic"
              in2="noise"
              scale="16"
              xChannelSelector="R"
              yChannelSelector="G"
              result="displaced"
            />
            {/* Soft edge blur for Fresnel dispersion */}
            <feGaussianBlur in="displaced" stdDeviation="0.4" result="blurred" />
            <feBlend mode="normal" in="SourceGraphic" in2="blurred" />
          </filter>
        </defs>
      </svg>

      {/* Refractive Liquid Glass Lens Cursor Container */}
      <div
        ref={cursorRef}
        className="pointer-events-none fixed top-0 left-0 z-50 transition-shadow duration-300 ease-out"
        style={{
          width: hovered ? "76px" : "48px",
          height: hovered ? "76px" : "48px",
          borderRadius: "50%",
          // Glass Refraction Backdrop Filter
          backdropFilter: "url(#liquid-glass-lens) blur(5px) saturate(1.8) contrast(1.15) brightness(1.1)",
          WebkitBackdropFilter: "url(#liquid-glass-lens) blur(5px) saturate(1.8) contrast(1.15) brightness(1.1)",
          background: "radial-gradient(circle at 35% 35%, rgba(255, 255, 255, 0.25) 0%, rgba(255, 255, 255, 0.05) 50%, rgba(0, 0, 0, 0.15) 100%)",
          boxShadow: `
            inset 0 0 12px rgba(255, 255, 255, 0.5),
            inset 0 -4px 8px rgba(0, 0, 0, 0.3),
            0 0 20px ${themeConfig.primaryHex}40,
            0 8px 32px rgba(0, 0, 0, 0.25)
          `,
          border: "1px solid rgba(255, 255, 255, 0.4)",
          willChange: "transform",
        }}
      >
        {/* Specular Highlight Arc (Fresnel Edge Refraction) */}
        <div
          className="absolute inset-1 rounded-full pointer-events-none"
          style={{
            background:
              "linear-gradient(135deg, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0) 45%, rgba(255,255,255,0) 70%, rgba(255,255,255,0.3) 100%)",
          }}
        />

        {/* Subtle Chromatic Aberration Fringe (RGB separation ring) */}
        <div
          className="absolute -inset-[1px] rounded-full pointer-events-none opacity-40 mix-blend-screen"
          style={{
            boxShadow: `inset 1.5px 0 0 rgba(255, 0, 80, 0.8), inset -1.5px 0 0 rgba(0, 230, 255, 0.8)`,
          }}
        />

        {/* Center Magnification Glint Point */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full transition-all duration-300"
          style={{
            width: hovered ? "10px" : "6px",
            height: hovered ? "10px" : "6px",
            backgroundColor: themeConfig.coreHex,
            boxShadow: `0 0 12px ${themeConfig.coreHex}`,
          }}
        />
      </div>
    </>
  );
}
