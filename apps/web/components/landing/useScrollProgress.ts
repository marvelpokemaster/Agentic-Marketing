"use client";

import { useState, useEffect } from "react";

export function useScrollProgress() {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [scrollVelocity, setScrollVelocity] = useState(0);

  useEffect(() => {
    let lastScrollY = window.scrollY;
    let lastTime = performance.now();
    let ticking = false;

    const updateScroll = () => {
      const scrollY = window.scrollY;
      const currentTime = performance.now();
      const maxScroll = Math.max(
        1,
        document.documentElement.scrollHeight - window.innerHeight
      );

      const progress = Math.min(1, Math.max(0, scrollY / maxScroll));
      setScrollProgress(progress);

      const dt = Math.max(1, currentTime - lastTime);
      const dy = scrollY - lastScrollY;
      const velocity = Math.abs(dy / dt) * 100; // Normalized velocity factor

      setScrollVelocity((prev) => prev * 0.8 + velocity * 0.2); // Smooth lerp

      lastScrollY = scrollY;
      lastTime = currentTime;
      ticking = false;
    };

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(updateScroll);
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    updateScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return { scrollProgress, scrollVelocity };
}
