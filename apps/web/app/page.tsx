import Link from "next/link";
import { firebaseConfig } from "@/lib/firebase/config";
import { Rocket, ChevronRight, Activity, Cpu } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { AICore3D } from "@/components/AICore3D";

const BACKEND_API_URL = process.env.BACKEND_API_URL || "http://localhost:8000";

async function isMetaConfiguredOnBackend(): Promise<boolean> {
  try {
    const res = await fetch(
      `${BACKEND_API_URL.replace(/\/$/, "")}/publish/status`,
      { cache: "no-store" },
    );
    if (!res.ok) return false;
    const data = await res.json();
    return data.configured === true;
  } catch {
    return false;
  }
}

const steps = [
  {
    step: "01",
    title: "Synthesize Product Context",
    detail: "Onboard brand guides, target niches, core product features, and media assets into the active workspace database.",
  },
  {
    step: "02",
    title: "Channel & Capability Selection",
    detail: "Direct campaign pipelines to organic social broadcasting or local B2B lead discovery scrapers.",
  },
  {
    step: "03",
    title: "Multi-Agent Orchestration",
    detail: "Stateless LLM agents execute reasoning, competitor analysis, GTM positioning, caption generation, and graphics rendering.",
  },
  {
    step: "04",
    title: "Social Broadcasting",
    detail: "Review generated visual creatives, perform copy edits, and publish live to Instagram and Facebook feeds.",
  },
];

export default async function HomePage() {
  const firebase = Boolean(firebaseConfig.projectId);
  const meta = await isMetaConfiguredOnBackend();

  return (
    <div className="space-y-28 py-8 relative z-10">
      {/* SCENE 1 — CINEMATIC LANDING HERO */}
      <section className="min-h-[75vh] flex flex-col justify-center items-center text-center max-w-5xl mx-auto py-12 relative">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 font-mono text-xs font-semibold text-primary uppercase tracking-widest mb-6 shadow-xl">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
          </span>
          Autonomous AI Operating System
        </div>

        <h1 className="font-heading text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-foreground leading-[1.08] max-w-4xl mx-auto">
          Autonomous Campaign <br className="hidden sm:inline" />
          <span className="bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">
            Orchestration.
          </span>
        </h1>

        <p className="font-sans text-sm sm:text-base text-muted max-w-2xl mx-auto mt-6 leading-relaxed">
          A stateless multi-agent intelligence platform designed to synthesize brand profiles, analyze market competition via SerpAPI, formulate GTM strategy, and broadcast live to Meta feeds.
        </p>

        {/* 3D Orbiting AI Core Centerpiece */}
        <div className="w-full my-6">
          <AICore3D stage="ready" />
        </div>

        <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
          <Link
            href="/products/new"
            className="btn btn-lg flex items-center gap-2 shadow-xl shadow-primary/25 hover:shadow-primary/40"
          >
            <span>Add Product Profile</span>
            <Rocket className="h-5 w-5" />
          </Link>
          <Link
            href="/campaigns"
            className="btn btn-ghost text-sm flex items-center gap-2 px-6 py-3"
          >
            <span>Launch Mission Control</span>
            <ChevronRight className="h-4 w-4 text-muted" />
          </Link>
        </div>
      </section>

      {/* SCENE 2 — MULTI-AGENT PIPELINE ARCHITECTURE */}
      <section className="space-y-8 max-w-5xl mx-auto">
        <SectionHeader
          badge="Capability Architecture"
          title="Sequential Multi-Agent Pipeline"
          subtitle="Stateless agent operations executing in sequential capability stages."
        />

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s) => (
            <Card key={s.title} interactive className="flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-primary">{s.step}</span>
                  <Cpu className="h-4 w-4 text-primary/50" />
                </div>
                <h4 className="font-heading text-sm font-bold text-foreground">{s.title}</h4>
                <p className="font-sans text-xs text-muted leading-relaxed">{s.detail}</p>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* SYSTEM RELAY HEALTH TELEMETRY */}
      <GlassPanel className="max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 rounded-lg bg-primary/10 border border-primary/20 text-primary">
            <Activity className="h-5 w-5 animate-pulse" />
          </div>
          <div>
            <h3 className="font-heading text-lg font-bold text-foreground">Relay Integration Telemetry</h3>
            <p className="font-mono text-xs text-muted">Real-time health status for workspace data nodes and social APIs.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex items-center justify-between rounded-xl border border-border bg-surface p-4">
            <div>
              <span className="font-sans text-xs font-semibold text-foreground block">Firebase Node</span>
              <span className="font-mono text-[10px] text-muted block">Campaign Data Persistence</span>
            </div>
            <span className={`px-3 py-1 rounded-md font-mono text-xs font-semibold ${firebase ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" : "bg-rose-500/10 text-rose-500 border border-rose-500/20"}`}>
              {firebase ? "Connected" : "Offline"}
            </span>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-border bg-surface p-4">
            <div>
              <span className="font-sans text-xs font-semibold text-foreground block">Meta Graph Relay</span>
              <span className="font-mono text-[10px] text-muted block">Instagram & Facebook Publishing</span>
            </div>
            <span className={`px-3 py-1 rounded-md font-mono text-xs font-semibold ${meta ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" : "bg-rose-500/10 text-rose-500 border border-rose-500/20"}`}>
              {meta ? "Configured" : "Offline"}
            </span>
          </div>
        </div>
      </GlassPanel>
    </div>
  );
}
