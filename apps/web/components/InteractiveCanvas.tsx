"use client";

import { useEffect, useRef } from "react";

export function InteractiveCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    // Track scroll depth
    let scrollY = 0;
    let targetScrollY = 0;

    function handleScroll() {
      targetScrollY = window.scrollY;
    }

    // Track mouse coords
    const mouse = { x: -1000, y: -1000, tx: -1000, ty: -1000 };

    function handleMouseMove(e: MouseEvent) {
      mouse.tx = e.clientX;
      mouse.ty = e.clientY;
    }

    function handleMouseLeave() {
      mouse.tx = -1000;
      mouse.ty = -1000;
    }

    function handleResize() {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    }

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseleave", handleMouseLeave);
    window.addEventListener("resize", handleResize);

    // Orchestration Path definition
    class OrchestratedPath {
      points: { x: number; y: number }[];
      speed: number;
      nodes: { progress: number; size: number; color: string; speedMult: number }[];

      constructor(index: number, count: number) {
        this.points = [];
        this.speed = Math.random() * 0.0008 + 0.0004;
        
        // Generate smooth sine paths running from left to right
        const segmentCount = 6;
        const segmentWidth = width / (segmentCount - 1);
        const yOffset = (index / count) * height * 0.8 + height * 0.1;

        for (let i = 0; i < segmentCount; i++) {
          this.points.push({
            x: i * segmentWidth,
            y: yOffset + (Math.random() - 0.5) * 120,
          });
        }

        // Add traveling nodes along this campaign path
        const nodeCount = Math.floor(Math.random() * 3) + 2;
        this.nodes = Array.from({ length: nodeCount }, () => ({
          progress: Math.random(),
          size: Math.random() * 2 + 1,
          color: Math.random() > 0.5 ? "rgba(99, 102, 241, 0.45)" : "rgba(139, 92, 246, 0.35)",
          speedMult: Math.random() * 0.5 + 0.75,
        }));
      }

      // Draw the pathway curve
      drawPath(scrollProgress: number) {
        if (!ctx || this.points.length < 2) return;

        ctx.beginPath();
        // Move to first point
        ctx.moveTo(this.points[0].x, this.points[0].y + scrollProgress * 100);

        for (let i = 0; i < this.points.length - 1; i++) {
          const p1 = this.points[i];
          const p2 = this.points[i + 1];
          const xc = (p1.x + p2.x) / 2;
          const yc = (p1.y + p2.y) / 2 + scrollProgress * 100;

          // React to mouse warp
          let targetY = yc;
          if (mouse.x > -500 && !prefersReducedMotion) {
            const dx = mouse.x - xc;
            const dy = mouse.y - (yc - scrollProgress * 100);
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 200) {
              const force = (200 - dist) / 200;
              targetY += (dy / dist) * force * 45;
            }
          }

          ctx.quadraticCurveTo(p1.x, p1.y + scrollProgress * 100, xc, targetY);
        }

        ctx.strokeStyle = `rgba(99, 102, 241, ${0.03 + scrollProgress * 0.04})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // Update and draw the traveling signals
      drawNodes(scrollProgress: number) {
        if (!ctx || this.points.length < 2) return;

        this.nodes.forEach((node) => {
          if (!prefersReducedMotion) {
            node.progress += this.speed * node.speedMult;
            if (node.progress > 1) {
              node.progress = 0;
            }
          }

          // Find current position on path by progress
          const index = Math.floor(node.progress * (this.points.length - 1));
          const localProgress = (node.progress * (this.points.length - 1)) % 1;

          if (index < this.points.length - 1) {
            const p1 = this.points[index];
            const p2 = this.points[index + 1];

            // Linear interpolation
            let nx = p1.x + (p2.x - p1.x) * localProgress;
            let ny = p1.y + (p2.y - p1.y) * localProgress + scrollProgress * 100;

            // React to mouse coordinates
            if (mouse.x > -500 && !prefersReducedMotion) {
              const dx = mouse.x - nx;
              const dy = mouse.y - ny;
              const dist = Math.sqrt(dx * dx + dy * dy);
              if (dist < 150) {
                const force = (150 - dist) / 150;
                nx -= (dx / dist) * force * 15;
                ny -= (dy / dist) * force * 15;
              }
            }

            // Draw glowing node
            const gradient = ctx.createRadialGradient(nx, ny, 0, nx, ny, node.size * 5);
            gradient.addColorStop(0, node.color);
            gradient.addColorStop(1, "rgba(99, 102, 241, 0)");

            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(nx, ny, node.size * 5, 0, Math.PI * 2);
            ctx.fill();

            // Core dot
            ctx.fillStyle = "rgba(244, 244, 245, 0.9)";
            ctx.beginPath();
            ctx.arc(nx, ny, node.size * 0.6, 0, Math.PI * 2);
            ctx.fill();
          }
        });
      }
    }

    const pathCount = 12;
    const paths = Array.from({ length: pathCount }, (_, i) => new OrchestratedPath(i, pathCount));

    let time = 0;

    // Animation Loop
    function loop() {
      if (!ctx || !canvas) return;

      time += 0.002;
      scrollY += (targetScrollY - scrollY) * 0.08;
      const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      const scrollProgress = Math.min(1, Math.max(0, scrollY / maxScroll));

      // Smooth mouse coordinates interpolation
      mouse.x += (mouse.tx - mouse.x) * 0.08;
      mouse.y += (mouse.ty - mouse.y) * 0.08;

      ctx.clearRect(0, 0, width, height);

      // Deep atmospheric background gradient
      ctx.fillStyle = "#09090B";
      ctx.fillRect(0, 0, width, height);

      // Slow glowing ambient lights
      if (!prefersReducedMotion) {
        const rad = Math.min(width, height) * 0.8;
        const ambient = ctx.createRadialGradient(
          width / 2 + Math.sin(time) * 150,
          height / 2 + Math.cos(time * 0.8) * 100,
          0,
          width / 2 + Math.sin(time) * 150,
          height / 2 + Math.cos(time * 0.8) * 100,
          rad
        );
        ambient.addColorStop(0, "rgba(99, 102, 241, 0.025)"); // Indigo bloom
        ambient.addColorStop(0.5, "rgba(139, 92, 246, 0.015)"); // Violet glow
        ambient.addColorStop(1, "rgba(0, 0, 0, 0)");
        ctx.fillStyle = ambient;
        ctx.fillRect(0, 0, width, height);
      }

      // Draw mouse spotlight
      if (mouse.x > -500 && !prefersReducedMotion) {
        const spot = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, 250);
        spot.addColorStop(0, "rgba(99, 102, 241, 0.03)");
        spot.addColorStop(1, "rgba(9, 9, 11, 0)");
        ctx.fillStyle = spot;
        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, 250, 0, Math.PI * 2);
        ctx.fill();
      }

      // Draw all orchestration pathways
      paths.forEach((path) => {
        path.drawPath(scrollProgress);
        path.drawNodes(scrollProgress);
      });

      animationFrameId = requestAnimationFrame(loop);
    }

    loop();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseleave", handleMouseLeave);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none z-0"
    />
  );
}
