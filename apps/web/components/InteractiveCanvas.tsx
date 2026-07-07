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

    // Check prefers-reduced-motion
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

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

    window.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseleave", handleMouseLeave);
    window.addEventListener("resize", handleResize);

    // Particle definition
    class Star {
      x: number;
      y: number;
      baseX: number;
      baseY: number;
      size: number;
      speed: number;
      angle: number;
      alpha: number;
      dAlpha: number;

      constructor() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.baseX = this.x;
        this.baseY = this.y;
        this.size = Math.random() * 1.5 + 0.5;
        this.speed = Math.random() * 0.15 + 0.05;
        this.angle = Math.random() * Math.PI * 2;
        this.alpha = Math.random() * 0.7 + 0.1;
        this.dAlpha = (Math.random() * 0.005 + 0.002) * (Math.random() > 0.5 ? 1 : -1);
      }

      update() {
        // Drifting motion
        if (!prefersReducedMotion) {
          this.angle += 0.001;
          this.x += Math.cos(this.angle) * this.speed;
          this.y += Math.sin(this.angle) * this.speed;

          // Wrap boundaries
          if (this.x < 0) this.x = width;
          if (this.x > width) this.x = 0;
          if (this.y < 0) this.y = height;
          if (this.y > height) this.y = 0;
        }

        // Twinkle effect
        this.alpha += this.dAlpha;
        if (this.alpha <= 0.05 || this.alpha >= 0.85) {
          this.dAlpha = -this.dAlpha;
        }

        // Magnetic attraction to mouse
        if (mouse.x > -500 && !prefersReducedMotion) {
          const dx = mouse.x - this.x;
          const dy = mouse.y - this.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 180) {
            const force = (180 - dist) / 180;
            // Gently pull toward mouse
            this.x += (dx / dist) * force * 0.7;
            this.y += (dy / dist) * force * 0.7;
          }
        }
      }

      draw() {
        if (!ctx) return;
        ctx.fillStyle = `rgba(78, 222, 163, ${this.alpha})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    const starCount = prefersReducedMotion ? 40 : Math.min(100, Math.floor((width * height) / 12000));
    const stars: Star[] = Array.from({ length: starCount }, () => new Star());

    // Drifting Mesh Blobs
    class GlowBlob {
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
      color: string;

      constructor(color: string) {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.vx = (Math.random() - 0.5) * 0.4;
        this.vy = (Math.random() - 0.5) * 0.4;
        this.radius = Math.random() * 150 + 150;
        this.color = color;
      }

      update() {
        if (prefersReducedMotion) return;
        this.x += this.vx;
        this.y += this.vy;

        if (this.x < -this.radius) this.x = width + this.radius;
        if (this.x > width + this.radius) this.x = -this.radius;
        if (this.y < -this.radius) this.y = height + this.radius;
        if (this.y > height + this.radius) this.y = -this.radius;
      }

      draw() {
        if (!ctx) return;
        const grad = ctx.createRadialGradient(
          this.x,
          this.y,
          0,
          this.x,
          this.y,
          this.radius
        );
        grad.addColorStop(0, this.color);
        grad.addColorStop(1, "rgba(5, 8, 10, 0)");

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    const blobs = [
      new GlowBlob("rgba(16, 185, 129, 0.05)"), // Emerald
      new GlowBlob("rgba(6, 182, 212, 0.04)"), // Cyan
      new GlowBlob("rgba(14, 165, 233, 0.03)"), // Sky Blue
    ];

    // Main animation loop
    function loop() {
      if (!ctx || !canvas) return;

      // Smooth mouse interpolation
      mouse.x += (mouse.tx - mouse.x) * 0.08;
      mouse.y += (mouse.ty - mouse.y) * 0.08;

      ctx.clearRect(0, 0, width, height);

      // 1. Draw glowing blobs in the background
      blobs.forEach((b) => {
        b.update();
        b.draw();
      });

      // 2. Draw interactive spotlight circle at mouse position
      if (mouse.x > -500 && !prefersReducedMotion) {
        const spotGrad = ctx.createRadialGradient(
          mouse.x,
          mouse.y,
          0,
          mouse.x,
          mouse.y,
          300
        );
        spotGrad.addColorStop(0, "rgba(78, 222, 163, 0.035)");
        spotGrad.addColorStop(0.5, "rgba(6, 182, 212, 0.015)");
        spotGrad.addColorStop(1, "rgba(5, 8, 10, 0)");

        ctx.fillStyle = spotGrad;
        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, 300, 0, Math.PI * 2);
        ctx.fill();
      }

      // 3. Draw star field
      stars.forEach((star) => {
        star.update();
        star.draw();
      });

      // 4. Draw web connections between stars that are close
      if (!prefersReducedMotion) {
        for (let i = 0; i < stars.length; i++) {
          for (let j = i + 1; j < stars.length; j++) {
            const dx = stars[i].x - stars[j].x;
            const dy = stars[i].y - stars[j].y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < 100) {
              const alpha = (100 - dist) / 100 * 0.15;
              ctx.strokeStyle = `rgba(78, 222, 163, ${alpha})`;
              ctx.lineWidth = 0.5;
              ctx.beginPath();
              ctx.moveTo(stars[i].x, stars[i].y);
              ctx.lineTo(stars[j].x, stars[j].y);
              ctx.stroke();
            }
          }
        }
      }

      animationFrameId = requestAnimationFrame(loop);
    }

    loop();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseleave", handleMouseLeave);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none z-0"
      style={{ mixBlendMode: "screen" }}
    />
  );
}
