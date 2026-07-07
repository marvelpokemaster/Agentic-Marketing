import Link from "next/link";
import { isSupabaseConfigured } from "@/lib/supabase/config";

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
    title: "Onboard Products",
    detail: "Train the marketing agent by uploading branding guides, target audiences, key features, and logos.",
  },
  {
    step: "02",
    title: "Configure Channels",
    detail: "Choose from organic Instagram, Facebook, and LinkedIn channels or select B2B outreach scrapers.",
  },
  {
    step: "03",
    title: "Generate Campaign",
    detail: "Orchestrate agent workflows to draft tailored captions, copy, hashtags, and custom AI graphics.",
  },
  {
    step: "04",
    title: "Review & Broadcast",
    detail: "Approve copy edits, regenerate creatives, and publish directly to live social streams.",
  },
];

export default async function HomePage() {
  const supabase = isSupabaseConfigured();
  const meta = await isMetaConfiguredOnBackend();

  return (
    <div className="space-y-24 py-8 relative">
      {/* Background spotlights & auroras */}
      <div className="absolute top-[-100px] left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-primary/5 rounded-full blur-[140px] pointer-events-none animate-slow-pulse" />
      <div className="absolute top-[350px] left-1/4 w-[500px] h-[250px] bg-cyan-500/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Hero Section */}
      <section className="space-y-8 text-center max-w-4xl mx-auto py-12 animate-fade-in-up relative z-10">
        {/* Promotional pill */}
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-semibold text-primary shadow-sm shadow-primary/5">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary/40 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
          </span>
          Campaign Generation Engine v1.0
        </div>

        {/* Cinematic Title */}
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl text-foreground leading-[1.1] max-w-3xl mx-auto">
          Autopilot your brand. <br className="hidden sm:inline" />
          <span className="bg-gradient-to-r from-primary via-[#5ef7bc] to-cyan-400 bg-clip-text text-transparent animate-slow-pulse">
            Generate & Broadcast.
          </span>{" "}
          <br />
          Instant social campaigns.
        </h1>

        {/* Elegant Subtitle */}
        <p className="max-w-2xl mx-auto text-sm sm:text-base text-muted/90 leading-relaxed font-normal">
          Draft platform-specific social copy, scrape local B2B business profiles, and render custom AI creative templates using a stateless orchestration model. Direct schedule and publish execution.
        </p>

        {/* Call to Actions */}
        <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
          <Link href="/products/new" className="btn flex items-center gap-2 px-7 py-3 text-sm font-semibold shadow-lg hover:shadow-primary/20">
            <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Add New Product
          </Link>
          <Link href="/campaigns" className="btn-ghost flex items-center gap-2 px-7 py-3 text-sm font-semibold">
            <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
            Review Campaigns
          </Link>
        </div>

        {/* Subtle Scroll Down indicator */}
        <div className="pt-12 flex justify-center animate-bounce opacity-40">
          <svg className="h-5 w-5 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7-7-7m14-6l-7 7-7-7" />
          </svg>
        </div>
      </section>

      {/* Steps Reveal Grid */}
      <section className="space-y-10 relative z-10">
        <div className="text-center max-w-lg mx-auto space-y-2">
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Orchestrated Workflow</h2>
          <p className="text-xs text-muted/80 leading-normal">
            Four automated steps execution pipeline linking AI generation to live social networks.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {steps.map((s, idx) => (
            <div
              key={s.title}
              className="glow-card card flex flex-col justify-between group h-full border-border/40 hover:-translate-y-1 transition-all duration-300"
              style={{ animationDelay: `${idx * 150}ms` }}
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-primary/75 tracking-wider">
                    {s.step}
                  </span>
                  <div className="h-2 w-2 rounded-full bg-primary/20 group-hover:bg-primary transition-colors duration-300" />
                </div>
                <h3 className="font-bold text-base text-foreground/90 group-hover:text-primary transition-colors duration-200">
                  {s.title}
                </h3>
                <p className="text-xs text-muted/85 leading-relaxed">
                  {s.detail}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Integration Health Panel */}
      <section className="glow-card card max-w-xl mx-auto border-border/50 shadow-2xl relative overflow-hidden bg-panel/90 z-10">
        <div className="absolute top-0 left-0 h-[1px] w-full bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
        
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-surface border border-border/80 text-primary">
            <svg className="h-5.5 w-5.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.25">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <div>
            <h2 className="text-base font-bold text-foreground">API Integration Metrics</h2>
            <p className="text-[11px] text-muted">Verification logs for database engines and external publishing relays.</p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className={`flex items-center justify-between rounded-xl border p-4 bg-surface/50 transition-colors ${supabase ? "border-emerald-500/20" : "border-border"}`}>
            <div className="space-y-0.5">
              <span className="text-xs font-semibold text-foreground/90 block">Supabase Storage</span>
              <span className="text-[10px] text-muted/70 block">Database campaign sync</span>
            </div>
            <span className={`badge ${supabase ? "badge-success" : "badge-danger"} flex items-center gap-1`}>
              <span className={`h-1.5 w-1.5 rounded-full ${supabase ? "bg-emerald-400 animate-pulse" : "bg-rose-400"}`} />
              {supabase ? "Connected" : "Offline"}
            </span>
          </div>

          <div className={`flex items-center justify-between rounded-xl border p-4 bg-surface/50 transition-colors ${meta ? "border-emerald-500/20" : "border-border"}`}>
            <div className="space-y-0.5">
              <span className="text-xs font-semibold text-foreground/90 block">Meta Page Node</span>
              <span className="text-[10px] text-muted/70 block">Facebook / Instagram publishing</span>
            </div>
            <span className={`badge ${meta ? "badge-success" : "badge-danger"} flex items-center gap-1`}>
              <span className={`h-1.5 w-1.5 rounded-full ${meta ? "bg-emerald-400 animate-pulse" : "bg-rose-400"}`} />
              {meta ? "Configured" : "Offline"}
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}
