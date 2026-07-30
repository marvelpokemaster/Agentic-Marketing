"use client";

import React, { useState, useEffect } from "react";
import { Activity, Cpu, Database, Clock } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";

export function HUDHeader() {
  const [timeStr, setTimeStr] = useState<string>("");

  useEffect(() => {
    const updateTime = () => {
      const d = new Date();
      setTimeStr(d.toLocaleTimeString("en-US", { hour12: false }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-md border-b border-border/40 bg-panel/70 px-6 py-2.5 flex items-center justify-between shadow-xl">
      <div className="flex items-center gap-6 font-mono text-[11px]">
        <div className="flex items-center gap-2 text-primary font-bold">
          <Activity className="h-4 w-4 animate-pulse" />
          <span>AI_OPERATING_SYSTEM // READY</span>
        </div>

        <div className="hidden md:flex items-center gap-2 text-muted">
          <Cpu className="h-3.5 w-3.5 text-accent" />
          <span>GPU_PIPELINE: 60FPS</span>
        </div>

        <div className="hidden lg:flex items-center gap-2 text-muted">
          <Database className="h-3.5 w-3.5 text-secondary" />
          <span>RESEARCH_CACHE: HIT_ENABLED</span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {timeStr && (
          <div className="font-mono text-xs text-muted flex items-center gap-1.5 bg-surface/50 px-3 py-1 rounded-lg border border-border/40">
            <Clock className="h-3.5 w-3.5 text-primary" />
            <span>{timeStr} UTC</span>
          </div>
        )}
        <ThemeToggle />
      </div>
    </header>
  );
}
