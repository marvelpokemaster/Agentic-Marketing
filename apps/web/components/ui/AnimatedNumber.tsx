"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useSpring, useTransform } from "framer-motion";
import { loadGsap } from "@/lib/motion/registerGsap";

export interface AnimatedNumberProps {
  value: number;
  mode?: "spring" | "gsap";
  duration?: number;
}

export function AnimatedNumber({
  value,
  mode = "spring",
  duration = 0.8,
}: AnimatedNumberProps) {
  const spring = useSpring(0, { mass: 0.8, stiffness: 100, damping: 15 });
  const display = useTransform(spring, (current) => Math.round(current));

  const [gsapVal, setGsapVal] = useState(0);
  const containerRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (mode === "spring") {
      spring.set(value);
    }
  }, [value, spring, mode]);

  useEffect(() => {
    if (mode !== "gsap") return;

    let tween: any = null;

    loadGsap().then((instances) => {
      if (!instances) return;
      const { gsap } = instances;

      const obj = { val: gsapVal };
      tween = gsap.to(obj, {
        val: value,
        duration,
        ease: "power2.out",
        onUpdate: () => {
          setGsapVal(Math.round(obj.val));
        },
      });
    });

    return () => {
      if (tween && typeof tween.kill === "function") {
        tween.kill();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, mode, duration]);

  if (mode === "gsap") {
    return <span ref={containerRef}>{gsapVal}</span>;
  }

  return <motion.span>{display}</motion.span>;
}
