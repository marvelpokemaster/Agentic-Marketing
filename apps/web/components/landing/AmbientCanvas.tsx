"use client";

import React, { useEffect, useRef } from "react";

interface Orb {
  x: number;
  y: number;
  radius: number;
  vx: number;
  vy: number;
  alpha: number;
  hueOffset: number;
  colorType: "primary" | "accent" | "secondary";
}

export function AmbientCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    let mouseX = width / 2;
    let mouseY = height / 2;

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    };

    window.addEventListener("resize", handleResize, { passive: true });
    window.addEventListener("mousemove", handleMouseMove, { passive: true });

    const colorTypes: ("primary" | "accent" | "secondary")[] = ["primary", "accent", "secondary"];

    const orbCount = width < 640 ? 12 : 24;
    const orbs: Orb[] = Array.from({ length: orbCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: 4 + Math.random() * 8, // Smaller orbs for constellation
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
      alpha: 0.2 + Math.random() * 0.5,
      hueOffset: 0,
      colorType: colorTypes[Math.floor(Math.random() * colorTypes.length)],
    }));

    // For larger ambient glow orbs behind the constellation
    const glowOrbs: Orb[] = Array.from({ length: 4 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: 200 + Math.random() * 300,
      vx: (Math.random() - 0.5) * 0.2,
      vy: (Math.random() - 0.5) * 0.2,
      alpha: 0.05 + Math.random() * 0.08,
      hueOffset: 0,
      colorType: colorTypes[Math.floor(Math.random() * colorTypes.length)],
    }));

    let isVisible = true;
    const handleVisibilityChange = () => {
      isVisible = !document.hidden;
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    const render = () => {
      if (!isVisible) {
        animationFrameId = requestAnimationFrame(render);
        return;
      }

      ctx.clearRect(0, 0, width, height);
      const scrollY = window.scrollY;

      // Draw large glow orbs
      glowOrbs.forEach((orb) => {
        if (!prefersReducedMotion) {
          orb.x += orb.vx;
          orb.y += orb.vy;

          if (orb.x < -orb.radius) orb.x = width + orb.radius;
          if (orb.x > width + orb.radius) orb.x = -orb.radius;
          if (orb.y < -orb.radius) orb.y = height + orb.radius;
          if (orb.y > height + orb.radius) orb.y = -orb.radius;
        }

        const parallaxY = orb.y - scrollY * 0.04;

        let rgb = "139, 92, 246"; // primary
        if (orb.colorType === "accent") rgb = "34, 211, 238";
        if (orb.colorType === "secondary") rgb = "96, 165, 250";

        const gradient = ctx.createRadialGradient(
          orb.x,
          parallaxY,
          0,
          orb.x,
          parallaxY,
          orb.radius
        );

        gradient.addColorStop(0, `rgba(${rgb}, ${orb.alpha})`);
        gradient.addColorStop(0.5, `rgba(${rgb}, ${orb.alpha * 0.4})`);
        gradient.addColorStop(1, "rgba(0, 0, 0, 0)");

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(orb.x, parallaxY, orb.radius, 0, Math.PI * 2);
        ctx.fill();
      });

      // Update constellation orbs
      orbs.forEach((orb) => {
        if (!prefersReducedMotion) {
          orb.x += orb.vx;
          orb.y += orb.vy;

          // Mouse repulsion
          const dx = mouseX - orb.x;
          const dy = mouseY - (orb.y - scrollY * 0.1);
          const dist = Math.sqrt(dx * dx + dy * dy);
          
          if (dist < 150) {
            const force = (150 - dist) / 150;
            orb.x -= (dx / dist) * force * 2;
            orb.y -= (dy / dist) * force * 2;
          }

          if (orb.x < 0 || orb.x > width) orb.vx *= -1;
          if (orb.y < 0 || orb.y > height) orb.vy *= -1;
          
          // Constrain bounds after repulsion
          orb.x = Math.max(0, Math.min(width, orb.x));
          orb.y = Math.max(0, Math.min(height, orb.y));
        }
      });

      // Draw constellation lines
      ctx.lineWidth = 1;
      for (let i = 0; i < orbs.length; i++) {
        for (let j = i + 1; j < orbs.length; j++) {
          const dy = (orbs[i].y - scrollY * 0.1) - (orbs[j].y - scrollY * 0.1);
          const dx = orbs[i].x - orbs[j].x;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 150) {
            const opacity = (1 - dist / 150) * 0.2;
            ctx.strokeStyle = `rgba(139, 92, 246, ${opacity})`;
            ctx.beginPath();
            ctx.moveTo(orbs[i].x, orbs[i].y - scrollY * 0.1);
            ctx.lineTo(orbs[j].x, orbs[j].y - scrollY * 0.1);
            ctx.stroke();
          }
        }
      }

      // Draw constellation orbs
      orbs.forEach((orb) => {
        const parallaxY = orb.y - scrollY * 0.1;
        let rgb = "139, 92, 246";
        if (orb.colorType === "accent") rgb = "34, 211, 238";
        if (orb.colorType === "secondary") rgb = "96, 165, 250";

        ctx.fillStyle = `rgba(${rgb}, ${orb.alpha})`;
        ctx.beginPath();
        ctx.arc(orb.x, parallaxY, orb.radius, 0, Math.PI * 2);
        ctx.fill();

        // Core dot
        ctx.fillStyle = `rgba(255, 255, 255, ${orb.alpha + 0.3})`;
        ctx.beginPath();
        ctx.arc(orb.x, parallaxY, orb.radius * 0.3, 0, Math.PI * 2);
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0 mix-blend-screen"
      aria-hidden="true"
    />
  );
}
