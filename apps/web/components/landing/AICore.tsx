"use client";

import React, { useRef, useEffect } from "react";
import { loadGsap } from "@/lib/motion/registerGsap";

interface AICoreProps {
  size?: "hero" | "pipeline" | "cta";
  velocity?: number;
}

export function AICore({ size = "hero", velocity = 0 }: AICoreProps) {
  const sizeMap = {
    hero: "w-72 h-72 sm:w-96 sm:h-96 md:w-[480px] md:h-[480px]",
    pipeline: "w-56 h-56 sm:w-72 sm:h-72",
    cta: "w-40 h-40 sm:w-52 sm:h-52",
  };

  const containerRef = useRef<HTMLDivElement>(null);
  const ring1Ref = useRef<HTMLDivElement>(null);
  const ring2Ref = useRef<HTMLDivElement>(null);
  const ring3Ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cleanups: (() => void)[] = [];

    loadGsap().then((instances) => {
      if (!instances || !instances.ScrollTrigger) return;
      const { gsap, ScrollTrigger } = instances;

      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const speedMultiplier = 1 + Math.min(3, velocity * 0.05);

        // Ring 1 rotation
        const tween1 = gsap.to(ring1Ref.current, {
          rotation: 360,
          duration: 35 / speedMultiplier,
          repeat: -1,
          ease: "none",
        });

        // Ring 2 counter rotation
        const tween2 = gsap.to(ring2Ref.current, {
          rotation: -360,
          duration: 22 / speedMultiplier,
          repeat: -1,
          ease: "none",
        });

        // Ring 3 high-velocity inner ring
        const tween3 = gsap.to(ring3Ref.current, {
          rotation: 360,
          duration: 14 / speedMultiplier,
          repeat: -1,
          ease: "none",
        });

        // ScrollTrigger to pause animation when off-screen
        const trigger = ScrollTrigger.create({
          trigger: containerRef.current,
          start: "top bottom",
          end: "bottom top",
          onToggle: (self: any) => {
            if (self.isActive) {
              tween1.play();
              tween2.play();
              tween3.play();
            } else {
              tween1.pause();
              tween2.pause();
              tween3.pause();
            }
          },
        });

        cleanups.push(() => {
          trigger.kill();
          tween1.kill();
          tween2.kill();
          tween3.kill();
        });
      });

      cleanups.push(() => mm.revert());
    });

    return () => {
      cleanups.forEach((c) => c());
    };
  }, [velocity]);

  return (
    <div
      ref={containerRef}
      className={`relative flex items-center justify-center pointer-events-none select-none ${sizeMap[size]}`}
      aria-hidden="true"
    >
      {/* Outer Glow Halo */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-primary/20 via-accent/15 to-secondary/10 blur-3xl opacity-60" />

      {/* Ring 1 — Outer Track */}
      <div
        ref={ring1Ref}
        className="absolute inset-2 rounded-full border border-primary/25 border-dashed"
      >
        <div className="absolute -top-1.5 left-1/2 h-3 w-3 -translate-x-1/2 rounded-full bg-primary shadow-lg shadow-primary/50" />
        <div className="absolute -bottom-1.5 left-1/2 h-2.5 w-2.5 -translate-x-1/2 rounded-full bg-accent shadow-md" />
      </div>

      {/* Ring 2 — Counter Rotation Track */}
      <div
        ref={ring2Ref}
        className="absolute inset-10 rounded-full border border-accent/20"
      >
        <div className="absolute top-1/2 -left-1.5 h-2.5 w-2.5 -translate-y-1/2 rounded-full bg-primary" />
        <div className="absolute top-1/2 -right-1.5 h-3 w-3 -translate-y-1/2 rounded-full bg-secondary shadow-lg shadow-secondary/50" />
      </div>

      {/* Ring 3 — Inner High-Velocity Core */}
      <div
        ref={ring3Ref}
        className="absolute inset-20 rounded-full border border-primary/30 border-dashed"
      >
        <div className="absolute top-2 right-2 h-2 w-2 rounded-full bg-primary" />
      </div>

      {/* Central Illuminated Node */}
      <div className="relative flex h-16 w-16 items-center justify-center rounded-full border border-primary/40 bg-panel/80 backdrop-blur-md shadow-2xl shadow-primary/30 sm:h-20 sm:w-20">
        <div className="h-6 w-6 rounded-full bg-gradient-to-tr from-primary via-accent to-secondary opacity-75" />
        <div className="absolute h-5 w-5 rounded-full bg-primary shadow-lg shadow-primary/60" />
      </div>
    </div>
  );
}
