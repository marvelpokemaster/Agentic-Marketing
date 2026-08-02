"use client";

import React, { useRef, useEffect } from "react";

interface FrostTextProps {
  text: string;
  highlightText?: string;
  as?: "h1" | "h2" | "h3" | "span";
  className?: string;
  subtitle?: string;
}

export function FrostText({
  text,
  highlightText,
  as: Component = "h1",
  className = "",
  subtitle,
}: FrostTextProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (prefersReducedMotion) return;

    let ticking = false;

    const handlePointerMove = (e: PointerEvent) => {
      if (ticking) return;
      ticking = true;

      requestAnimationFrame(() => {
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const fx = e.clientX - rect.left;
        const fy = e.clientY - rect.top;

        el.style.setProperty("--fx", `${fx}px`);
        el.style.setProperty("--fy", `${fy}px`);
        ticking = false;
      });
    };

    el.addEventListener("pointermove", handlePointerMove, { passive: true });
    return () => {
      el.removeEventListener("pointermove", handlePointerMove);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={`group relative inline-block select-none ${className}`}
      style={{
        ["--fx" as string]: "50%",
        ["--fy" as string]: "50%",
      }}
    >
      <Component className="relative font-heading tracking-tight">
        {/* Base Layer Text */}
        <span className="text-foreground">{text} </span>

        {highlightText && (
          <span
            className="relative inline-block bg-clip-text text-transparent"
            style={{
              backgroundImage: "var(--gradient-text)",
              backgroundSize: "200% 200%",
              animation: "gradientShift 6s ease-in-out infinite",
            }}
          >
            {highlightText}
          </span>
        )}

        {/* Cursor-Reactive Frost Sheen Layer */}
        <span
          className="pointer-events-none absolute inset-0 bg-clip-text text-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 hidden sm:block"
          style={{
            backgroundImage: `radial-gradient(200px circle at var(--fx, 50%) var(--fy, 50%), var(--color-primary), transparent 70%)`,
            WebkitBackgroundClip: "text",
          }}
          aria-hidden="true"
        >
          {text} {highlightText}
        </span>
      </Component>

      {subtitle && (
        <p className="mt-3 text-sm leading-relaxed text-muted prose-col">
          {subtitle}
        </p>
      )}
    </div>
  );
}
