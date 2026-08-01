"use client";

import React from "react";
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

  return (
    <header className="sticky top-0 z-30 flex min-h-[57px] w-full items-center justify-between border-b border-border bg-bg px-6">
      <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted">
        {label}
      </span>
      <ThemeToggle />
    </header>
  );
}
