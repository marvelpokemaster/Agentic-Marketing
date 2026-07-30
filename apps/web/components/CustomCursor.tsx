"use client";

import React, { useEffect, useState } from "react";
import { motion, useSpring } from "framer-motion";

export function CustomCursor() {
  const [enabled, setEnabled] = useState(false);
  const [hovered, setHovered] = useState(false);

  const cursorX = useSpring(0, { stiffness: 400, damping: 28 });
  const cursorY = useSpring(0, { stiffness: 400, damping: 28 });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const isTouch = window.matchMedia("(pointer: coarse)").matches;
    const isReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (!isTouch && !isReducedMotion) {
      setEnabled(true);
    }

    const moveHandler = (e: MouseEvent) => {
      cursorX.set(e.clientX);
      cursorY.set(e.clientY);

      const target = e.target as HTMLElement | null;
      if (target) {
        const isInteractive =
          target.closest("button, a, input, select, textarea, [role='button'], [data-magnetic='true']") !== null;
        setHovered(isInteractive);
      }
    };

    window.addEventListener("mousemove", moveHandler);
    return () => window.removeEventListener("mousemove", moveHandler);
  }, [cursorX, cursorY]);

  if (!enabled) return null;

  return (
    <motion.div
      style={{
        x: cursorX,
        y: cursorY,
        translateX: "-50%",
        translateY: "-50%",
      }}
      animate={{
        scale: hovered ? 1.6 : 1,
        opacity: hovered ? 0.8 : 0.4,
      }}
      transition={{ duration: 0.15 }}
      className="pointer-events-none fixed top-0 left-0 z-50 h-8 w-8 rounded-full border border-primary/60 bg-primary/10 backdrop-blur-[2px] shadow-[0_0_20px_var(--glow-color)]"
    />
  );
}
