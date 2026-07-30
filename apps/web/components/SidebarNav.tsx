"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Package,
  Megaphone,
  PlusCircle,
  Activity,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Cpu,
} from "lucide-react";
import HeaderAuth from "./HeaderAuth";

interface SidebarNavProps {
  userEmail: string | null;
}

export function SidebarNav({ userEmail }: SidebarNavProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const navItems = [
    { label: "Overview", href: "/", icon: LayoutDashboard },
    { label: "Products", href: "/products", icon: Package },
    { label: "Campaigns", href: "/campaigns", icon: Megaphone },
    { label: "New Product", href: "/products/new", icon: PlusCircle },
  ];

  return (
    <motion.aside
      animate={{ width: collapsed ? 72 : 256 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="relative flex flex-col justify-between h-screen sticky top-0 bg-panel/90 border-r border-border/80 backdrop-blur-xl z-40 shrink-0 select-none"
    >
      {/* Top Header & Branding */}
      <div>
        <div className="flex items-center justify-between px-4 py-5 border-b border-border/40">
          <Link href="/" className="flex items-center gap-3 overflow-hidden">
            <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 border border-primary/30 text-primary shrink-0">
              <Cpu className="h-4 w-4 animate-pulse" />
            </div>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col whitespace-nowrap"
              >
                <span className="font-heading font-extrabold text-sm tracking-tight text-slate-100">
                  AGENTIC<span className="text-primary">.AI</span>
                </span>
                <span className="font-mono text-[9px] font-bold text-muted/70 tracking-widest uppercase">
                  Mission Control
                </span>
              </motion.div>
            )}
          </Link>

          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded-md hover:bg-surface text-muted/70 hover:text-slate-200 transition-colors"
            title={collapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>

        {/* Telemetry Status Bar */}
        {!collapsed && (
          <div className="mx-3 mt-4 p-2.5 rounded-lg bg-surface/50 border border-border/40 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="font-mono text-[10px] font-semibold text-slate-300">SYS_READY</span>
            </div>
            <ShieldCheck className="h-3.5 w-3.5 text-primary/70" />
          </div>
        )}

        {/* Navigation Items */}
        <nav className="p-3 space-y-1.5 mt-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));

            return (
              <Link key={item.href} href={item.href} className="relative block">
                <div
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                    isActive
                      ? "text-slate-100 font-semibold"
                      : "text-muted hover:text-slate-200 hover:bg-surface/50"
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeNavTab"
                      className="absolute inset-0 rounded-lg bg-primary/10 border border-primary/30"
                      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                    />
                  )}
                  <Icon className={`h-4 w-4 shrink-0 relative z-10 ${isActive ? "text-primary" : "text-muted"}`} />
                  {!collapsed && <span className="relative z-10 whitespace-nowrap">{item.label}</span>}
                </div>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom Auth User Bar */}
      <div className="p-3 border-t border-border/40">
        {userEmail ? (
          <div className="flex items-center justify-between gap-2">
            {!collapsed && (
              <div className="min-w-0 flex-1">
                <span className="font-mono text-[9px] font-bold text-muted/60 block uppercase tracking-wider">
                  OPERATOR
                </span>
                <span className="font-sans text-xs font-semibold text-slate-200 truncate block">
                  {userEmail}
                </span>
              </div>
            )}
            <HeaderAuth initialEmail={userEmail} />
          </div>
        ) : (
          <Link
            href="/login"
            className="w-full btn btn-ghost text-xs py-2 flex items-center justify-center gap-2"
          >
            <Activity className="h-3.5 w-3.5" />
            {!collapsed && <span>Authenticate</span>}
          </Link>
        )}
      </div>
    </motion.aside>
  );
}
