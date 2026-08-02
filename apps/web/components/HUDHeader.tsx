"use client";

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "./ThemeToggle";

const ROUTE_LABELS: { match: (p: string) => boolean; label: string }[] = [
  { match: (p) => p === "/", label: "Overview" },
  { match: (p) => p === "/login", label: "Sign in" },
  { match: (p) => p === "/products/new", label: "Products / New" },
  { match: (p) => /^\/products\/[^/]+\/generate$/.test(p), label: "Products / New campaign" },
  { match: (p) => p.startsWith("/products"), label: "Products" },
  { match: (p) => /^\/campaigns\/[^/]+$/.test(p), label: "Campaigns / Detail" },
  { match: (p) => p.startsWith("/campaigns"), label: "Campaigns" },
];

export function HUDHeader() {
  const pathname = usePathname();
  const label = ROUTE_LABELS.find((r) => r.match(pathname))?.label ?? "Agentic";
  const [time, setTime] = useState("");

  useEffect(() => {
    const update = () => {
      setTime(
        new Date().toLocaleTimeString(undefined, {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        })
      );
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="sticky top-0 z-30 flex min-h-[57px] w-full items-center justify-between border-b border-border bg-bg/80 backdrop-blur-xl px-6">
      {/* Breadcrumb with gradient dot separator */}
      <div className="flex items-center gap-2.5">
        <span className="h-1.5 w-1.5 rounded-full" style={{ background: "var(--gradient-primary)" }} />
        <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted">
          {label}
        </span>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-4">
        {/* Live clock */}
        <span className="hidden font-mono text-[11px] tabular-nums text-muted/60 sm:block">
          {time}
        </span>

        {/* Status dots */}
        <div className="hidden items-center gap-1 sm:flex">
          <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
          <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" style={{ animationDelay: "0.3s" }} />
          <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" style={{ animationDelay: "0.6s" }} />
        </div>

        <ThemeToggle />
      </div>
    </header>
  );
}
