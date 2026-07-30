import Link from "next/link";
import { firebaseConfig } from "@/lib/firebase/config";
import { Rocket, Sparkles, ChevronRight, Activity, Cpu } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { GlassPanel } from "@/components/ui/GlassPanel";

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
    <div className="space-y-24 py-8 relative z-10">
      {/* MISSION HERO SECTION */}
      <section className="min-h-[60vh] flex flex-col justify-center items-center text-center max-w-4xl mx-auto py-12 relative">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 font-mono text-xs font-semibold text-primary uppercase tracking-widest mb-8">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
          </span>
          Autonomous AI Mission Control
        </div>

        <h1 className="font-heading text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-slate-100 leading-[1.08] max-w-3xl mx-auto">
          Autonomous Campaign <br className="hidden sm:inline" />
          <span className="bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">
            Orchestration.
          </span>
        </h1>

        <p className="font-sans text-sm sm:text-base text-muted/80 max-w-2xl mx-auto mt-6 leading-relaxed">
          A stateless, agentic marketing studio designed to synthesize product knowledge bases, formulate go-to-market positioning, and execute instant social broadcasting.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 pt-10">
          <Link
            href="/products/new"
            className="btn btn-lg flex items-center gap-2 shadow-lg shadow-primary/20 hover:shadow-primary/30"
          >
            <span>Add Brand Profile</span>
            <Rocket className="h-4.5 w-4.5" />
          </Link>
          <Link
            href="/campaigns"
            className="btn btn-ghost text-sm flex items-center gap-2 px-6 py-3"
          >
            <span>Open Studio</span>
            <ChevronRight className="h-4 w-4 text-muted" />
          </Link>
        </div>
      </section>

      {/* SYSTEM PIPELINE */}
      <section className="space-y-8 max-w-5xl mx-auto">
        <SectionHeader
          badge="Capability Architecture"
          title="Sequential Multi-Agent Pipeline"
          subtitle="Stateless agent operations executing in sequential stages, from onboarding to live network deployment."
        />

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s) => (
            <Card key={s.title} interactive className="flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-primary">{s.step}</span>
                  <Cpu className="h-4 w-4 text-primary/50" />
                </div>
                <h4 className="font-heading text-sm font-bold text-slate-100">{s.title}</h4>
                <p className="font-sans text-xs text-muted/70 leading-relaxed">{s.detail}</p>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* SYSTEM RELAY INTEGRATIONS */}
      <GlassPanel className="max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 rounded-lg bg-primary/10 border border-primary/20 text-primary">
            <Activity className="h-5 w-5 animate-pulse" />
          </div>
          <div>
            <h3 className="font-heading text-lg font-bold text-slate-100">Relay Integration Status</h3>
            <p className="font-mono text-xs text-muted/70">Real-time health telemetry for workspace data nodes and social APIs.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex items-center justify-between rounded-xl border border-border bg-surface/40 p-4">
            <div>
              <span className="font-sans text-xs font-semibold text-slate-200 block">Firebase Node</span>
              <span className="font-mono text-[10px] text-muted/60 block">Campaign Data Persistence</span>
            </div>
            <span className={`px-3 py-1 rounded-md font-mono text-xs font-semibold ${firebase ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-rose-500/10 text-rose-400 border border-rose-500/20"}`}>
              {firebase ? "Connected" : "Offline"}
            </span>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-border bg-surface/40 p-4">
            <div>
              <span className="font-sans text-xs font-semibold text-slate-200 block">Meta Graph Relay</span>
              <span className="font-mono text-[10px] text-muted/60 block">Instagram & Facebook Publishing</span>
            </div>
            <span className={`px-3 py-1 rounded-md font-mono text-xs font-semibold ${meta ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-rose-500/10 text-rose-400 border border-rose-500/20"}`}>
              {meta ? "Configured" : "Offline"}
            </span>
          </div>
        </div>
      </GlassPanel>
    </div>
  );
}
