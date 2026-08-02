"use client";

import { RefObject, useEffect } from "react";
import { loadGsap } from "./registerGsap";

export interface GsapRevealOptions {
  y?: number;
  duration?: number;
  stagger?: number;
  delay?: number;
  ease?: string;
}

export function useGsapReveal(
  targetRef: RefObject<HTMLElement | null>,
  options: GsapRevealOptions = {}
) {
  const {
    y = 16,
    duration = 0.6,
    stagger = 0.08,
    delay = 0,
    ease = "power2.out",
  } = options;

  useEffect(() => {
    let ctx: any = null;

    loadGsap().then((instances) => {
      if (!instances) return;
      const { gsap } = instances;

      const el = targetRef.current;
      if (!el) return;

      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const targets = el.children.length > 0 ? Array.from(el.children) : [el];
        gsap.fromTo(
          targets,
          { opacity: 0, y },
          {
            opacity: 1,
            y: 0,
            duration,
            stagger,
            delay,
            ease,
            clearProps: "transform",
          }
        );
      });

      mm.add("(prefers-reduced-motion: reduce)", () => {
        const targets = el.children.length > 0 ? Array.from(el.children) : [el];
        gsap.fromTo(
          targets,
          { opacity: 0 },
          { opacity: 1, duration: 0.2, delay, clearProps: "all" }
        );
      });

      ctx = mm;
    });

    return () => {
      if (ctx && typeof ctx.revert === "function") {
        ctx.revert();
      }
    };
  }, [targetRef, y, duration, stagger, delay, ease]);
}
