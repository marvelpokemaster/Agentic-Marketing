"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
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
      className="relative flex flex-col justify-between h-screen sticky top-0 bg-panel border-r border-border backdrop-blur-xl z-40 shrink-0 select-none overflow-hidden"
    >
      {/* Top Header & Branding */}
      <div>
        <div className={`flex items-center ${collapsed ? "justify-center px-0 py-4" : "justify-between px-3.5 py-4 gap-2"} border-b border-border/40 overflow-hidden min-h-[64px]`}>
          <Link href="/" className="flex items-center gap-3 min-w-0 flex-1 overflow-hidden">
            {/* Logo Icon Container - Fixed Proportions & Strict Flex Isolation */}
            <div className="relative flex h-8 w-8 min-w-[32px] min-h-[32px] items-center justify-center rounded-lg bg-primary/10 border border-primary/30 text-primary shrink-0 overflow-hidden">
              <Cpu className="h-[18px] w-[18px] shrink-0 animate-pulse" />
            </div>

            {/* Logo Typography - Animated Width, Opacity & Truncation */}
            <AnimatePresence mode="wait">
              {!collapsed && (
                <motion.div
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: "auto" }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                  className="flex flex-col whitespace-nowrap overflow-hidden min-w-0 flex-1"
                >
                  <span className="font-heading font-extrabold text-sm tracking-tight text-foreground truncate block leading-none">
                    AGENTIC<span className="text-primary">.AI</span>
                  </span>
                  <span className="font-mono text-[9px] font-bold text-muted tracking-widest uppercase truncate block mt-1 leading-none">
                    Mission Control
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </Link>

          {/* Collapse/Expand Toggle Button */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded-md hover:bg-surface text-muted hover:text-foreground transition-colors shrink-0 flex items-center justify-center overflow-hidden"
            title={collapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {collapsed ? <ChevronRight className="h-4 w-4 shrink-0" /> : <ChevronLeft className="h-4 w-4 shrink-0" />}
          </button>
        </div>

        {/* Telemetry Status Bar */}
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="mx-3 mt-4 p-2.5 rounded-lg bg-surface border border-border/40 flex items-center justify-between overflow-hidden"
            >
              <div className="flex items-center gap-2 min-w-0 overflow-hidden">
                <span className="relative flex h-2 w-2 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <span className="font-mono text-[10px] font-semibold text-foreground truncate">SYS_READY</span>
              </div>
              <ShieldCheck className="h-[18px] w-[18px] text-primary shrink-0" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation Items */}
        <nav className="p-3 space-y-1.5 mt-4 overflow-hidden">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));

            return (
              <Link key={item.href} href={item.href} className="relative block overflow-hidden rounded-lg">
                <div
                  className={`relative flex items-center ${
                    collapsed ? "justify-center px-0 py-2.5" : "justify-start px-3 py-2.5 gap-3"
                  } rounded-lg text-xs font-medium transition-all duration-200 overflow-hidden ${
                    isActive
                      ? "text-foreground font-semibold"
                      : "text-muted hover:text-foreground hover:bg-surface"
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeNavTab"
                      className="absolute inset-0 rounded-lg bg-primary/10 border border-primary/30 z-0 overflow-hidden"
                      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                    />
                  )}
                  <div className="flex items-center justify-center shrink-0 relative z-10">
                    <Icon className={`h-[18px] w-[18px] shrink-0 ${isActive ? "text-primary" : "text-muted"}`} />
                  </div>
                  {!collapsed && (
                    <span className="relative z-10 whitespace-nowrap truncate">{item.label}</span>
                  )}
                </div>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom Auth User Bar */}
      <div className="p-3 border-t border-border/40 overflow-hidden">
        {userEmail ? (
          <div className={`flex items-center ${collapsed ? "justify-center" : "justify-between gap-2"} overflow-hidden`}>
            {!collapsed && (
              <div className="min-w-0 flex-1 overflow-hidden">
                <span className="font-mono text-[9px] font-bold text-muted block uppercase tracking-wider truncate">
                  OPERATOR
                </span>
                <span className="font-sans text-xs font-semibold text-foreground truncate block">
                  {userEmail}
                </span>
              </div>
            )}
            <HeaderAuth initialEmail={userEmail} />
          </div>
        ) : (
          <Link
            href="/login"
            className={`w-full btn btn-ghost text-xs py-2 flex items-center ${
              collapsed ? "justify-center px-0" : "justify-center gap-2"
            } overflow-hidden rounded-lg`}
          >
            <Activity className="h-[18px] w-[18px] shrink-0" />
            {!collapsed && <span className="truncate">Authenticate</span>}
          </Link>
        )}
      </div>
    </motion.aside>
  );
}
