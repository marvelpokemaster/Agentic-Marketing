"use client";

import React, { useState, useEffect, useTransition } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Package,
  Megaphone,
  PlusCircle,
  LogIn,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";
import HeaderAuth from "./HeaderAuth";

interface SidebarNavProps {
  userEmail: string | null;
}

export function SidebarNav({ userEmail }: SidebarNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [pendingPath, setPendingPath] = useState<string | null>(null);

  useEffect(() => {
    setPendingPath(null);
  }, [pathname]);

  const navItems = [
    { label: "Overview", href: "/", icon: LayoutDashboard },
    { label: "Products", href: "/products", icon: Package },
    { label: "Campaigns", href: "/campaigns", icon: Megaphone },
    { label: "New product", href: "/products/new", icon: PlusCircle },
  ];

  const handleNav = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    // If it's the exact same path, let standard Link behavior apply or do nothing.
    // However, in Next.js pushing the same path might still trigger a refresh if we want,
    // but usually we just let it go.
    if (href === pathname) return;

    // Open in new tab check (allow standard behavior if ctrl/meta key pressed)
    if (e.ctrlKey || e.metaKey || e.shiftKey) return;

    e.preventDefault();
    setPendingPath(href);
    startTransition(() => {
      router.push(href);
    });
  };

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 68 : 240 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      className="sticky top-0 z-40 flex h-screen shrink-0 select-none flex-col justify-between overflow-hidden border-r border-border bg-panel/80 backdrop-blur-xl"
    >
      <div>
        {/* Wordmark */}
        <div
          className={`flex min-h-[57px] items-center border-b border-border ${
            collapsed ? "justify-center px-0" : "justify-between gap-2 px-5"
          }`}
        >
          <Link href="/" className="flex min-w-0 items-center gap-2.5 overflow-hidden">
            {/* Gradient logo mark */}
            <span className="relative h-6 w-6 shrink-0 rounded-lg" style={{ background: "var(--gradient-primary)" }}>
              <span className="absolute inset-0 rounded-lg animate-glow-pulse opacity-50" />
            </span>
            <AnimatePresence mode="wait">
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: "auto" }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.18 }}
                  className="block truncate whitespace-nowrap font-heading text-sm font-bold tracking-tight gradient-text"
                >
                  Agentic
                </motion.span>
              )}
            </AnimatePresence>
          </Link>

          {!collapsed && (
            <button
              onClick={() => setCollapsed(true)}
              className="shrink-0 rounded-lg p-1.5 text-muted transition-all hover:bg-surface hover:text-foreground"
              title="Collapse sidebar"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          )}
        </div>

        {collapsed && (
          <div className="flex justify-center border-b border-border py-2">
            <button
              onClick={() => setCollapsed(false)}
              className="rounded-lg p-1.5 text-muted transition-all hover:bg-surface hover:text-foreground"
              title="Expand sidebar"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Navigation */}
        <nav className="space-y-1 p-3 pt-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
            const isItemPending = isPending && pendingPath === item.href;

            return (
              <Link 
                key={item.href} 
                href={item.href} 
                onClick={(e) => handleNav(e, item.href)}
                className="relative block group"
              >
                <div
                  className={`relative flex items-center rounded-xl text-[13px] transition-all duration-200 ${
                    collapsed ? "justify-center px-0 py-2.5" : "gap-3 px-3 py-2.5"
                  } ${
                    isActive || isItemPending
                      ? "font-medium text-foreground"
                      : "text-muted hover:text-foreground"
                  } ${isItemPending ? "animate-pulse" : ""}`}
                  title={collapsed ? item.label : undefined}
                >
                  {/* Active indicator — gradient left bar */}
                  {isActive && !isItemPending && (
                    <motion.span
                      layoutId="activeNavTab"
                      className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r-full"
                      style={{ background: "var(--gradient-primary)" }}
                      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                    />
                  )}

                  {/* Active background glow */}
                  {(isActive || isItemPending) && (
                    <motion.span
                      layoutId="activeNavBg"
                      className="absolute inset-0 rounded-xl bg-surface"
                      style={{ boxShadow: "inset 0 0 0 1px var(--border-color)" }}
                      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                    />
                  )}

                  {/* Hover glow for non-active */}
                  {!isActive && !isItemPending && (
                    <span className="absolute inset-0 rounded-xl bg-surface opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
                  )}

                  {isItemPending ? (
                    <Loader2 className="relative z-10 h-4 w-4 shrink-0 animate-spin text-primary" />
                  ) : (
                    <Icon
                      className={`relative z-10 h-4 w-4 shrink-0 transition-colors duration-200 ${
                        isActive ? "text-primary" : "group-hover:text-foreground"
                      }`}
                    />
                  )}
                  
                  {!collapsed && (
                    <span className="relative z-10 truncate whitespace-nowrap">{item.label}</span>
                  )}
                </div>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Account */}
      <div className="border-t border-border p-3">
        {userEmail ? (
          <div
            className={`flex items-center overflow-hidden ${
              collapsed ? "justify-center" : "justify-between gap-2"
            }`}
          >
            {!collapsed && (
              <div className="min-w-0 flex-1 overflow-hidden">
                <span className="block truncate text-xs font-medium text-foreground">
                  {userEmail}
                </span>
                <span className="mt-0.5 block font-mono text-[10px] uppercase tracking-wider text-muted">
                  Signed in
                </span>
              </div>
            )}
            <HeaderAuth initialEmail={userEmail} />
          </div>
        ) : (
          <Link
            href="/login"
            className={`btn-ghost w-full py-2 text-xs ${collapsed ? "px-0" : ""}`}
            title={collapsed ? "Sign in" : undefined}
          >
            <LogIn className="h-4 w-4 shrink-0" />
            {!collapsed && <span>Sign in</span>}
          </Link>
        )}
      </div>
    </motion.aside>
  );
}
