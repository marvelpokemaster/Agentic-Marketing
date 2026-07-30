"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Rocket,
  RefreshCw,
  SlidersHorizontal,
  CheckCircle2,
  Sparkles,
  ExternalLink,
  Search,
  Target,
  FileText,
  Share2,
  AlertTriangle,
  Play,
  Layers,
  ChevronDown,
  Globe,
  Zap,
  Maximize2,
} from "lucide-react";
import {
  PLATFORM_LABELS,
  type Campaign,
  type CampaignAsset,
  type CompetitorResult,
} from "@/lib/types";
import { Card } from "./ui/Card";
import { SectionHeader } from "./ui/SectionHeader";
import { AnimatedButton } from "./ui/AnimatedButton";
import { StatusBadge } from "./ui/StatusBadge";
import { TimelineNode } from "./ui/TimelineNode";
import { GlassPanel } from "./ui/GlassPanel";
import { EmptyState } from "./ui/EmptyState";
import { LoadingState } from "./ui/LoadingState";
import { Skeleton } from "./ui/Skeleton";
import { AnimatedNumber } from "./ui/AnimatedNumber";
import { NetworkGraph } from "./ui/NetworkGraph";
import { AICore3D } from "./AICore3D";
import { AssetModal } from "./AssetModal";
import { playUISound } from "@/lib/audio";

export function CampaignDashboard({
  campaign: initialCampaign,
  metaConfigured,
}: {
  campaign: Campaign;
  metaConfigured: boolean;
}) {
  const [campaign, setCampaign] = useState(initialCampaign);
  const [activeTab, setActiveTab] = useState<"strategy" | "research" | "content">(
    initialCampaign.results?.strategy ? "strategy" : "research"
  );
  const [isPolling, setIsPolling] = useState(false);
  const [triggeringResearch, setTriggeringResearch] = useState(false);
  const [researchError, setResearchError] = useState<string | null>(null);
  const [showRefreshMenu, setShowRefreshMenu] = useState(false);
  const [publishingAssets, setPublishingAssets] = useState<Record<string, "publishing" | "done" | "error">>({});
  const [publishErrors, setPublishErrors] = useState<Record<string, string>>({});
  const [batchPublishing, setBatchPublishing] = useState(false);
  const [batchProgress, setBatchProgress] = useState<{ current: number; total: number } | null>(null);
  const [selectedAsset, setSelectedAsset] = useState<CampaignAsset | null>(null);

  const currentStage = campaign.execution?.stage || "";
  const isExecuting =
    campaign.status === "running" ||
    campaign.status === "researching" ||
    ["planning", "researching", "analyzing", "strategizing", "generating_content", "generating_images"].includes(
      currentStage
    );

  const isReady = currentStage === "ready" || campaign.status === "ready" || campaign.status === "published";

  // Poll campaign status if active execution
  useEffect(() => {
    if (isExecuting || isPolling) {
      const interval = setInterval(async () => {
        try {
          const res = await fetch(`/api/campaigns/${campaign.id}`);
          if (res.ok) {
            const data = await res.json();
            if (data.campaign) {
              setCampaign(data.campaign);
              const stage = data.campaign.execution?.stage;
              const stat = data.campaign.status;
              if (stage === "ready" || stage === "failed" || (stat !== "running" && stat !== "researching" && !stage)) {
                setIsPolling(false);
                if (stage === "ready") playUISound("complete");
              }
            }
          }
        } catch (e) {
          console.error("Polling error:", e);
        }
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [campaign.id, campaign.status, campaign.execution?.stage, isPolling, isExecuting]);

  // Auto scroll to top
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleRunCampaign = async (
    refreshType: "none" | "research" | "strategy" | "everything" = "none",
    resume: boolean = false
  ) => {
    setTriggeringResearch(true);
    setResearchError(null);
    setShowRefreshMenu(false);
    playUISound("agent_start");
    try {
      const res = await fetch(`/api/campaigns/${campaign.id}/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_type: refreshType, resume }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        if (data.campaign) {
          setCampaign(data.campaign);
        }
        setIsPolling(true);
      } else {
        const errorMsg = data.error || data.detail || "Failed to trigger campaign execution.";
        setResearchError(errorMsg);
      }
    } catch (e) {
      console.error("Failed to run campaign", e);
      setResearchError("Network error: Unable to reach campaign execution service.");
    } finally {
      setTriggeringResearch(false);
    }
  };

  const refreshCampaign = async () => {
    try {
      const res = await fetch(`/api/campaigns/${campaign.id}`);
      if (res.ok) {
        const data = await res.json();
        if (data.campaign) setCampaign(data.campaign);
      }
    } catch (e) {
      console.error("Failed to refresh campaign:", e);
    }
  };

  const handlePublishAsset = async (asset: CampaignAsset) => {
    if (!asset.id) return;
    setPublishingAssets((prev) => ({ ...prev, [asset.id]: "publishing" }));
    setPublishErrors((prev) => { const n = { ...prev }; delete n[asset.id]; return n; });
    try {
      const res = await fetch(
        `/api/campaigns/${campaign.id}/assets/${asset.id}/publish`,
        { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || data.detail || `Publish failed (${res.status})`);
      }
      setPublishingAssets((prev) => ({ ...prev, [asset.id]: "done" }));
      playUISound("publish");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Publish failed.";
      setPublishingAssets((prev) => ({ ...prev, [asset.id]: "error" }));
      setPublishErrors((prev) => ({ ...prev, [asset.id]: msg }));
    }
  };

  const rawAssets = campaign.results?.assets || campaign.assets || [];
  const mappedAssets = rawAssets.map((a: any) => {
    if (a.id) return a;
    const base = campaign.assets?.find((b: any) => b.platform === a.platform);
    return {
      ...a,
      id: base?.id,
      status: base?.status || "draft",
      error: base?.error || null,
      external_id: base?.external_id || null,
      published_url: base?.published_url || a?.published_url || null,
    };
  });

  const handlePublishAll = async () => {
    const draftAssets = mappedAssets.filter(
      (a: any) => a.id && (a.status === "draft" || a.status === "failed")
    );
    if (draftAssets.length === 0) return;
    setBatchPublishing(true);
    setBatchProgress({ current: 0, total: draftAssets.length });
    for (let i = 0; i < draftAssets.length; i++) {
      setBatchProgress({ current: i + 1, total: draftAssets.length });
      await handlePublishAsset(draftAssets[i]);
    }
    setBatchPublishing(false);
    setBatchProgress(null);
    await refreshCampaign();
    setActiveTab("content");
  };

  const researchReport = campaign.results?.research_report;
  const strategy = campaign.results?.strategy;
  const planner = campaign.results?.planner;

  const renderExternalLink = (url: string | null | undefined, label: string = "View Source") => {
    if (!url) return null;
    const href = url.startsWith("http") ? url : `https://${url}`;
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-xs text-primary hover:underline inline-flex items-center gap-1 mb-2 break-all line-clamp-1"
      >
        <span>{label === "View Source" ? label : url}</span>
        <ExternalLink className="h-3 w-3 shrink-0" />
      </a>
    );
  };

  const numQueries = planner?.search_queries?.length || 0;
  const numCompetitors = researchReport?.intelligence?.competitors?.length || 0;
  const numAssets = mappedAssets.length;

  return (
    <div className="space-y-8 relative z-10">
      {/* FULLSCREEN ASSET SHOWCASE MODAL */}
      <AssetModal
        asset={selectedAsset}
        onClose={() => setSelectedAsset(null)}
        onPublish={handlePublishAsset}
        metaConfigured={metaConfigured}
      />

      {/* APPLE-KEYNOTE MISSION COMPLETE CELEBRATION BANNER */}
      {isReady && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          className="rounded-2xl border border-amber-500/40 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-amber-500/10 p-6 shadow-2xl backdrop-blur-xl flex flex-col md:flex-row items-center justify-between gap-4"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400">
              <Zap className="h-6 w-6 animate-pulse" />
            </div>
            <div>
              <span className="font-mono text-xs font-bold text-amber-400 uppercase tracking-widest block">
                MISSION COMPLETE // 6 AGENTS EXECUTED
              </span>
              <h2 className="font-heading text-xl font-extrabold text-slate-100">
                Autonomous Campaign Ready for Multi-Channel Broadcast
              </h2>
            </div>
          </div>
          <AnimatedButton
            variant="primary"
            onClick={handlePublishAll}
            icon={<Share2 className="h-4 w-4" />}
          >
            Broadcast Assets Now
          </AnimatedButton>
        </motion.div>
      )}

      {/* MISSION HERO & 3D AI CORE */}
      <GlassPanel className="p-8 relative overflow-hidden">
        <div className="grid gap-6 lg:grid-cols-3 items-center">
          <div className="lg:col-span-2 space-y-3">
            <div className="flex items-center gap-3">
              <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-primary bg-primary/10 border border-primary/20 px-3 py-1 rounded-full">
                {campaign.workflow.replace("_", " ")}
              </span>
              <StatusBadge status={campaign.status} pulse={isExecuting} />
            </div>
            <h1 className="font-heading text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-100">
              {campaign.product_name || "AI Marketing Mission"}
            </h1>
            <p className="font-mono text-xs text-muted/70 flex items-center gap-2">
              <span>MISSION_ID:</span>
              <span className="text-slate-300 font-semibold">{campaign.id}</span>
            </p>

            {/* TELEMETRY STAT COUNTERS */}
            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border/40 max-w-md">
              <div>
                <span className="label text-[10px]">Queries Executed</span>
                <span className="font-heading text-2xl font-bold text-primary flex items-center gap-1">
                  <AnimatedNumber value={numQueries} />
                </span>
              </div>
              <div>
                <span className="label text-[10px]">Competitors Found</span>
                <span className="font-heading text-2xl font-bold text-secondary flex items-center gap-1">
                  <AnimatedNumber value={numCompetitors} />
                </span>
              </div>
              <div>
                <span className="label text-[10px]">Assets Synthesized</span>
                <span className="font-heading text-2xl font-bold text-emerald-400 flex items-center gap-1">
                  <AnimatedNumber value={numAssets} />
                </span>
              </div>
            </div>
          </div>

          {/* 3D Orbiting AI Core */}
          <div className="flex flex-col items-center justify-center">
            <AICore3D stage={currentStage as any} />
            {/* Trigger Actions */}
            <div className="flex items-center gap-3 mt-2">
              <AnimatedButton
                variant="primary"
                size="md"
                isLoading={triggeringResearch || isExecuting}
                onClick={() => handleRunCampaign("none")}
                disabled={isExecuting || triggeringResearch}
                icon={<Rocket className="h-4 w-4" />}
              >
                {isExecuting ? "Executing..." : "Execute Campaign"}
              </AnimatedButton>
            </div>
          </div>
        </div>
      </GlassPanel>

      {/* ERROR ALERT BANNER */}
      {researchError && (
        <Card className="border-rose-500/30 bg-rose-500/10 p-4">
          <div className="flex items-center gap-3 text-rose-400 text-xs font-medium">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>{researchError}</span>
          </div>
        </Card>
      )}

      {/* MULTI-AGENT EXECUTION TIMELINE BANNER */}
      <MultiAgentTimelineBanner
        execution={campaign.execution}
        status={campaign.status}
        onRetry={() => handleRunCampaign("none", true)}
        isExecuting={isExecuting}
      />

      {/* NAVIGATION TABS */}
      <div className="flex items-center gap-2 border-b border-border/40 pb-3">
        {[
          { id: "strategy", label: "Strategy & Positioning", icon: Target, count: strategy ? 1 : 0 },
          { id: "research", label: "Executive Intelligence", icon: Search, count: researchReport ? 1 : 0 },
          { id: "content", label: "Content & Assets", icon: Layers, count: mappedAssets.length },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => {
                playUISound("click");
                setActiveTab(tab.id as any);
              }}
              className={`relative px-4 py-2.5 rounded-lg font-heading text-xs font-bold transition-all flex items-center gap-2 ${
                isActive ? "text-slate-100 bg-primary/10 border border-primary/30" : "text-muted hover:text-slate-200 hover:bg-surface/50"
              }`}
            >
              <Icon className={`h-4 w-4 ${isActive ? "text-primary" : "text-muted"}`} />
              <span>{tab.label}</span>
              {tab.count > 0 && (
                <span className="font-mono text-[10px] bg-surface px-2 py-0.5 rounded-full border border-border text-muted">
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* TAB CONTENT: STRATEGY */}
      {activeTab === "strategy" && (
        <div className="space-y-6">
          {isExecuting && !strategy && (
            <LoadingState stage={currentStage || "strategizing"} />
          )}

          {!strategy && !isExecuting && (
            <EmptyState
              icon={<Target className="h-6 w-6 text-primary" />}
              title="No Strategy Generated Yet"
              description="Run the multi-agent pipeline to synthesize competitor research into market positioning, audience personas, and messaging pillars."
              action={
                <AnimatedButton onClick={() => handleRunCampaign("strategy")} disabled={triggeringResearch}>
                  Generate Strategy
                </AnimatedButton>
              }
            />
          )}

          {strategy && (
            <div className="space-y-6">
              <Card className="border-l-4 border-l-primary space-y-4">
                <SectionHeader
                  badge="GTM Core Architecture"
                  title="Marketing Strategy & Positioning"
                  action={
                    <AnimatedButton
                      variant="outline"
                      size="sm"
                      onClick={() => handleRunCampaign("strategy")}
                      disabled={isExecuting || triggeringResearch}
                      icon={<RefreshCw className="h-3 w-3" />}
                    >
                      Refresh Strategy
                    </AnimatedButton>
                  }
                />
                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <span className="label">Campaign Objective</span>
                    <p className="font-sans text-sm font-medium text-slate-100">{strategy.campaign_objective}</p>
                  </div>
                  <div>
                    <span className="label">Value Proposition</span>
                    <p className="font-sans text-sm font-medium text-slate-200">{strategy.value_proposition}</p>
                  </div>
                </div>
              </Card>

              <div className="grid gap-6 md:grid-cols-2">
                <Card className="space-y-3">
                  <h4 className="font-heading text-sm font-bold text-primary uppercase tracking-wide">Positioning & Tone</h4>
                  <div>
                    <span className="label">Market Positioning</span>
                    <p className="font-sans text-xs text-slate-200">{strategy.positioning}</p>
                  </div>
                  <div>
                    <span className="label">Messaging Angle</span>
                    <p className="font-sans text-xs text-slate-200">{strategy.messaging_angle}</p>
                  </div>
                  <div>
                    <span className="label">Brand Tone</span>
                    <span className="inline-block px-3 py-1 bg-primary/10 text-primary border border-primary/20 rounded-full font-mono text-xs font-semibold">
                      {strategy.tone}
                    </span>
                  </div>
                </Card>

                <Card className="space-y-3">
                  <h4 className="font-heading text-sm font-bold text-primary uppercase tracking-wide">Audience Persona</h4>
                  <div>
                    <span className="label">Target Audience</span>
                    <p className="font-sans text-xs text-slate-200">{strategy.target_audience}</p>
                  </div>
                  <div>
                    <span className="label">Call to Action Strategy</span>
                    <p className="font-sans text-xs text-slate-200">{strategy.cta_strategy}</p>
                  </div>
                </Card>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: RESEARCH */}
      {activeTab === "research" && (
        <div className="space-y-6">
          {isExecuting && !researchReport && (
            <LoadingState stage={currentStage || "researching"} />
          )}

          {!researchReport && !isExecuting && (
            <EmptyState
              icon={<Search className="h-6 w-6 text-primary" />}
              title="No Executive Intelligence Gathered"
              description="Execute market research via SerpAPI multi-query analysis to extract competitor benchmarks, search trends, and target audience segments."
              action={
                <AnimatedButton onClick={() => handleRunCampaign("research")} disabled={triggeringResearch}>
                  Run Research Agent
                </AnimatedButton>
              }
            />
          )}

          {researchReport && (
            <div className="space-y-6">
              <Card className="border-l-4 border-l-primary flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                  <h3 className="font-heading text-lg font-bold text-slate-100">Executive Intelligence Brief</h3>
                  <p className="font-mono text-xs text-muted/70 mt-1">
                    Execution Time: {researchReport.metadata?.execution_time ? `${researchReport.metadata.execution_time.toFixed(2)}s` : "Fast"}
                    {campaign.results?.cache_metadata?.cache_hit && (
                      <span className="ml-2 text-emerald-400 font-semibold">(Reused Cached Intelligence)</span>
                    )}
                  </p>
                </div>
                <AnimatedButton
                  variant="outline"
                  size="sm"
                  onClick={() => handleRunCampaign("research")}
                  disabled={isExecuting || triggeringResearch}
                  icon={<RefreshCw className="h-3.5 w-3.5" />}
                >
                  Refresh Research
                </AnimatedButton>
              </Card>

              {/* LIVING NETWORK GRAPH VISUALIZATION */}
              <NetworkGraph
                queries={planner?.search_queries}
                competitors={researchReport.intelligence?.competitors}
              />

              {/* COMPETITORS */}
              <div className="space-y-3">
                <h3 className="font-heading text-base font-bold text-slate-100">Competitor Insights</h3>
                {researchReport.intelligence?.competitors?.length > 0 ? (
                  <div className="grid gap-4 md:grid-cols-3">
                    {researchReport.intelligence.competitors.map((c: CompetitorResult, i: number) => (
                      <Card key={i} interactive className="space-y-2 p-4">
                        <h4 className="font-heading text-sm font-bold text-slate-100">{c.name}</h4>
                        {renderExternalLink(c.domain, "URL")}
                        {c.reason && (
                          <p className="font-sans text-xs text-slate-300 bg-surface/60 p-2.5 rounded border border-border/40 leading-snug">
                            {c.reason}
                          </p>
                        )}
                        {renderExternalLink(c.source_url, "View Source")}
                      </Card>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted">No competitor data extracted.</p>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: CONTENT & ASSETS */}
      {activeTab === "content" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface/50 p-4 rounded-xl border border-border/60">
            <div>
              <h3 className="font-heading text-lg font-bold text-slate-100">Generated Campaign Assets</h3>
              <p className="font-sans text-xs text-muted/70">
                Multi-platform creative assets ready for review and Meta social broadcasting. Click any card to expand full presentation.
              </p>
            </div>

            <div className="flex items-center gap-3">
              {batchPublishing && batchProgress && (
                <span className="font-mono text-xs text-primary font-semibold animate-pulse">
                  Publishing ({batchProgress.current}/{batchProgress.total})
                </span>
              )}
              <AnimatedButton
                variant="primary"
                size="md"
                onClick={handlePublishAll}
                disabled={batchPublishing || mappedAssets.length === 0}
                icon={<Share2 className="h-4 w-4" />}
              >
                Publish All Draft Assets
              </AnimatedButton>
            </div>
          </div>

          {/* ASSET CARDS GRID */}
          <div className="grid gap-6 md:grid-cols-2">
            {mappedAssets.map((asset: CampaignAsset, idx: number) => {
              const pubState = publishingAssets[asset.id];
              const pubError = publishErrors[asset.id] || asset.error;
              const isPublishing = pubState === "publishing";
              const isPublished = asset.status === "published" || pubState === "done";
              const canPublish = metaConfigured && !isPublishing && !isPublished;

              return (
                <Card
                  key={asset.id || idx}
                  interactive
                  onClick={() => setSelectedAsset(asset)}
                  className="space-y-4 cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold uppercase tracking-wider text-primary bg-primary/10 border border-primary/20 px-3 py-1 rounded-md">
                      {PLATFORM_LABELS[asset.platform] || asset.platform}
                    </span>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={isPublished ? "published" : pubState || asset.status} />
                      <button className="text-muted hover:text-slate-100 p-1" title="Expand Presentation">
                        <Maximize2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {asset.headline ? (
                    <h4 className="font-heading text-base font-bold text-slate-100">{asset.headline}</h4>
                  ) : isExecuting ? (
                    <Skeleton className="h-6 w-3/4" />
                  ) : null}

                  {asset.body ? (
                    <p className="font-sans text-xs text-slate-300 leading-relaxed bg-surface/50 p-3 rounded-lg border border-border/40 whitespace-pre-wrap line-clamp-3">
                      {asset.body}
                    </p>
                  ) : isExecuting ? (
                    <Skeleton className="h-20 w-full" />
                  ) : null}

                  {asset.creative_url ? (
                    <div className="space-y-1.5">
                      <span className="label">Visual Creative</span>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={asset.creative_url}
                        alt="Campaign Visual Asset"
                        className="w-full h-52 object-cover rounded-xl border border-border/60"
                      />
                    </div>
                  ) : isExecuting ? (
                    <Skeleton className="h-52 w-full" />
                  ) : null}

                  {pubError && (
                    <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg font-sans text-xs text-rose-400">
                      {pubError}
                    </div>
                  )}

                  <div className="pt-3 border-t border-border/40 flex items-center justify-between" onClick={(e) => e.stopPropagation()}>
                    {isPublished ? (
                      <div className="flex items-center justify-between gap-2 w-full">
                        <span className="font-sans text-xs text-emerald-400 font-semibold flex items-center gap-1.5">
                          <CheckCircle2 className="h-4 w-4" />
                          Published to {PLATFORM_LABELS[asset.platform] || asset.platform}
                        </span>
                        {asset.published_url ? (
                          <a
                            href={asset.published_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-sans text-xs text-primary hover:underline font-semibold flex items-center gap-1"
                          >
                            <span>View Live Post</span>
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        ) : (
                          <span className="font-sans text-xs text-muted/60">Permalink unavailable</span>
                        )}
                      </div>
                    ) : (
                      <AnimatedButton
                        variant="primary"
                        size="sm"
                        isLoading={isPublishing}
                        onClick={() => handlePublishAsset(asset)}
                        disabled={!canPublish}
                        icon={<Share2 className="h-3.5 w-3.5" />}
                      >
                        {pubState === "error" ? "Retry Publish" : `Publish to ${PLATFORM_LABELS[asset.platform] || asset.platform}`}
                      </AnimatedButton>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function MultiAgentTimelineBanner({
  execution,
  status,
  onRetry,
  isExecuting,
}: {
  execution?: any;
  status: string;
  onRetry: () => void;
  isExecuting: boolean;
}) {
  if (!execution && status !== "running" && status !== "researching" && status !== "failed") {
    return null;
  }

  const stagesList = [
    { key: "planning", label: "Planning", agent: "Planner Agent", desc: "Understanding target product context & search intent" },
    { key: "researching", label: "Research", agent: "Research Agent", desc: "Executing SerpAPI multi-query intelligence" },
    { key: "analyzing", label: "Analyst", agent: "Analyst Agent", desc: "Filtering market noise & competitor benchmarks" },
    { key: "strategizing", label: "Strategy", agent: "Strategy Agent", desc: "Formulating GTM positioning & messaging pillars" },
    { key: "generating_content", label: "Content", agent: "Content Agent", desc: "Generating platform-tailored captions & hooks" },
    { key: "generating_images", label: "Creative", agent: "Creative Agent", desc: "Generating visual creative assets" },
    { key: "ready", label: "Ready", agent: "Mission Ready", desc: "Campaign deliverables complete" },
  ];

  const currentStageKey = execution?.stage || (status === "researching" ? "researching" : status === "running" ? "planning" : "idle");
  const isFailed = execution?.stage === "failed" || status === "failed";
  const isReady = execution?.stage === "ready" || (status !== "running" && status !== "researching" && !isFailed && execution);

  return (
    <Card className="space-y-4 border-l-4 border-l-primary bg-panel/95">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10 border border-primary/20 text-primary">
            <Sparkles className="h-5 w-5 animate-pulse" />
          </div>
          <div>
            <h3 className="font-heading text-sm font-bold text-slate-100">
              {execution?.current_agent || (isFailed ? "System Alert" : "Multi-Agent Pipeline Execution")}
            </h3>
            <p className="font-mono text-[11px] text-muted/70">
              {execution?.current_message || "Orchestrating autonomous agents across sequential capability pipeline..."}
            </p>
          </div>
        </div>
        {isFailed && (
          <AnimatedButton variant="danger" size="sm" onClick={onRetry}>
            Retry Pipeline
          </AnimatedButton>
        )}
      </div>

      <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 pt-2">
        {stagesList.map((st, idx) => {
          let nodeStatus: "idle" | "running" | "completed" | "failed" = "idle";
          if (isFailed && currentStageKey === st.key) nodeStatus = "failed";
          else if (currentStageKey === st.key) nodeStatus = "running";
          else if (isReady || stagesList.findIndex((s) => s.key === currentStageKey) > idx) nodeStatus = "completed";

          return (
            <TimelineNode
              key={st.key}
              index={idx}
              label={st.label}
              agent={st.agent}
              desc={st.desc}
              status={nodeStatus}
            />
          );
        })}
      </div>
    </Card>
  );
}
