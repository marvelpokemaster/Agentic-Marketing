"use client";

import React, { useRef, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Rocket } from "lucide-react";
import { AICore } from "./AICore";
import { AnimatedButton } from "@/components/ui/AnimatedButton";

interface SceneHeroProps {
  velocity?: number;
}

export function SceneHero({ velocity = 0 }: SceneHeroProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Subtle interactive pointer highlight
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (prefersReducedMotion) return;

    const handlePointerMove = (e: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      container.style.setProperty("--mouse-x", `${x}px`);
      container.style.setProperty("--mouse-y", `${y}px`);
    };

    container.addEventListener("pointermove", handlePointerMove, { passive: true });
    return () => {
      container.removeEventListener("pointermove", handlePointerMove);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative mx-auto flex w-full max-w-[1180px] flex-col items-center justify-center px-6 text-center md:px-10"
    >
      {/* Background Spatial AICore */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-40">
        <AICore size="hero" velocity={velocity} />
      </div>

      {/* Eyebrow Status Badge */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 font-mono text-xs font-semibold uppercase tracking-widest text-primary shadow-lg backdrop-blur-md"
      >
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
        </span>
        Autonomous AI Campaign System
      </motion.div>

      {/* Pure CSS Frosted Glass & Gradient Hero Typography */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 max-w-4xl"
      >
        <h1 className="font-heading text-4xl font-extrabold leading-[1.08] tracking-tight sm:text-6xl lg:text-[4rem]">
          <span className="block text-foreground">Your AI Marketing</span>
          <span className="mt-1 block bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">
            Department.
          </span>
        </h1>
      </motion.div>

      {/* Subtitle */}
      <motion.p
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
        className="prose-col relative z-10 mt-6 max-w-2xl text-base leading-relaxed text-muted sm:text-lg"
      >
        A stateless multi-agent platform that researches target niches, formulates GTM strategy, generates copy and visuals, and broadcasts live to Meta.
      </motion.p>

      {/* Action Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 mt-10 flex flex-wrap items-center justify-center gap-4"
      >
        <Link href="/products/new">
          <AnimatedButton
            variant="primary"
            size="lg"
            icon={<Rocket className="h-4 w-4" />}
          >
            Add Product Profile
          </AnimatedButton>
        </Link>

        <Link href="/campaigns">
          <AnimatedButton
            variant="outline"
            size="lg"
            icon={<ArrowRight className="h-4 w-4" />}
          >
            Launch Mission Control
          </AnimatedButton>
        </Link>
      </motion.div>
    </div>
  );
}
