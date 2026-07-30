"use client";

import { useState, useEffect } from "react";
import {
  PLATFORM_LABELS,
  type Campaign,
  type CampaignAsset,
  type CompetitorResult,
  type AudienceResult,
  type NewsResult,
  type TrendResult,
  type TechnologyResult,
  type ResearchPlan,
  type MarketingStrategy,
  type ExecutionMetadata,
  type ExecutionStageInfo,
} from "@/lib/types";

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

  const isExecuting =
    campaign.status === "running" ||
    campaign.status === "researching" ||
    ["planning", "researching", "analyzing", "strategizing", "generating_content", "generating_images"].includes(
      campaign.execution?.stage || ""
    );

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
        className="text-xs text-blue-500 hover:underline block mb-2 break-all line-clamp-1"
      >
        {label === "View Source" ? label : url}
      </a>
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Main Action Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-surface/80 p-4 rounded-xl border border-border/40 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-foreground">{campaign.product_name || "Campaign Orchestrator"}</h2>
          <p className="text-xs text-muted mt-0.5">
            Workflow: <span className="font-semibold text-primary uppercase">{campaign.workflow}</span> • Status:{" "}
            <span className="font-semibold uppercase">{campaign.status}</span>
          </p>
        </div>

        <div className="flex items-center gap-3 relative">
          <button
            className={`btn px-5 py-2.5 font-bold text-sm shadow-md transition flex items-center gap-2 ${
              isExecuting
                ? "bg-muted cursor-not-allowed text-muted-foreground"
                : "bg-primary hover:bg-primary/90 text-white"
            }`}
            onClick={() => handleRunCampaign("none")}
            disabled={isExecuting || triggeringResearch}
          >
            {triggeringResearch ? (
              <>
                <span className="animate-spin">⟳</span> Initiating Pipeline...
              </>
            ) : isExecuting ? (
              <>
                <span className="animate-spin text-primary">⟳</span> Campaign Currently Executing...
              </>
            ) : (
              <>
                <span>🚀</span> Run Campaign
              </>
            )}
          </button>

          {/* Granular Refresh Dropdown */}
          <div className="relative">
            <button
              className="btn-outline px-3 py-2 text-xs font-semibold flex items-center gap-1"
              onClick={() => setShowRefreshMenu(!showRefreshMenu)}
              disabled={isExecuting || triggeringResearch}
            >
              <span>⚙️</span> Options ▾
            </button>

            {showRefreshMenu && (
              <div className="absolute right-0 mt-2 w-52 bg-surface border border-border/80 rounded-lg shadow-xl z-50 py-1.5 space-y-1 text-xs">
                <button
                  className="w-full text-left px-4 py-2 hover:bg-primary/10 font-medium text-foreground flex items-center gap-2"
                  onClick={() => handleRunCampaign("none")}
                >
                  <span>🚀</span> Run (Smart Cache)
                </button>
                <button
                  className="w-full text-left px-4 py-2 hover:bg-primary/10 font-medium text-foreground flex items-center gap-2"
                  onClick={() => handleRunCampaign("research")}
                >
                  <span>🔍</span> Refresh Research
                </button>
                <button
                  className="w-full text-left px-4 py-2 hover:bg-primary/10 font-medium text-foreground flex items-center gap-2"
                  onClick={() => handleRunCampaign("strategy")}
                >
                  <span>🎯</span> Refresh Strategy
                </button>
                <div className="border-t border-border/40 my-1"></div>
                <button
                  className="w-full text-left px-4 py-2 hover:bg-destructive/10 font-medium text-destructive flex items-center gap-2"
                  onClick={() => handleRunCampaign("everything")}
                >
                  <span>🔄</span> Refresh Everything
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Live Agent Timeline Banner */}
      <MultiAgentTimelineBanner
        execution={campaign.execution}
        status={campaign.status}
        onRetry={() => handleRunCampaign("none", true)}
        isExecuting={isExecuting}
      />

      {/* Success Screen Banner */}
      {campaign.execution?.stage === "ready" && (
        <CampaignReadyBanner
          assetCount={mappedAssets.filter(a => a.status === "draft" || a.status === "failed").length}
          onPublish={handlePublishAll}
          isPublishing={batchPublishing}
          progress={batchProgress}
        />
      )}

      {/* Navigation Tabs */}
      <div className="flex border-b border-border/40">
        <button
          className={`py-3 px-6 font-semibold text-sm transition ${
            activeTab === "strategy" ? "text-primary border-b-2 border-primary" : "text-muted hover:text-foreground"
          }`}
          onClick={() => setActiveTab("strategy")}
        >
          Marketing Strategy
        </button>
        <button
          className={`py-3 px-6 font-semibold text-sm transition ${
            activeTab === "research" ? "text-primary border-b-2 border-primary" : "text-muted hover:text-foreground"
          }`}
          onClick={() => setActiveTab("research")}
        >
          Research Intelligence
        </button>
        <button
          className={`py-3 px-6 font-semibold text-sm transition ${
            activeTab === "content" ? "text-primary border-b-2 border-primary" : "text-muted hover:text-foreground"
          }`}
          onClick={() => setActiveTab("content")}
        >
          {campaign.workflow === "lead_generation" ? "Discovered Leads" : `Generated Content (${mappedAssets.length})`}
        </button>
      </div>

      {/* STRATEGY TAB */}
      {activeTab === "strategy" && (
        <div className="space-y-6">
          {/* Error Display */}
          {(researchError || campaign.status === "failed") && (
            <div className="card border-destructive/40 bg-destructive/5 p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-destructive text-base">Execution Interrupted</h3>
                <p className="text-sm text-foreground/80 mt-1">
                  {researchError || campaign.execution?.error_message || campaign.results?.errors?.[0] || "An error occurred during multi-agent execution."}
                </p>
              </div>
              <button
                className="btn px-5 py-2 text-sm bg-destructive hover:bg-destructive/90 text-white shrink-0 font-semibold"
                onClick={() => handleRunCampaign("none", true)}
                disabled={triggeringResearch}
              >
                {triggeringResearch ? "Retrying..." : "Resume Execution"}
              </button>
            </div>
          )}

          {!strategy && !isExecuting && campaign.status !== "failed" && (
            <div className="card py-12 flex flex-col items-center gap-4 text-center">
              <p className="text-muted text-sm">Marketing strategy has not been generated yet.</p>
              <button
                className="btn px-6 py-2.5 font-bold"
                onClick={() => handleRunCampaign("none")}
                disabled={triggeringResearch}
              >
                {triggeringResearch ? "Initiating Agents..." : "🚀 Run Campaign"}
              </button>
            </div>
          )}

          {strategy && (
            <div className="space-y-6">
              {/* Strategy Header Card */}
              <div className="card space-y-4 border-l-4 border-l-primary">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-lg text-primary">Marketing Strategy & GTM Positioning</h3>
                  <button
                    className="btn-outline text-xs px-3 py-1 font-medium"
                    onClick={() => handleRunCampaign("strategy")}
                    disabled={isExecuting || triggeringResearch}
                  >
                    {triggeringResearch ? "Refreshing..." : "Re-run Strategy Agent"}
                  </button>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted font-semibold">Campaign Objective</p>
                  <p className="text-base font-medium text-foreground mt-1">{strategy.campaign_objective}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted font-semibold">Core Value Proposition</p>
                  <p className="text-sm font-medium text-foreground/90 mt-1">{strategy.value_proposition}</p>
                </div>
              </div>

              {/* Grid of Strategy Attributes */}
              <div className="grid gap-6 md:grid-cols-2">
                <div className="card space-y-3">
                  <h4 className="font-bold text-sm text-primary uppercase tracking-wide">Positioning & Tone</h4>
                  <div>
                    <p className="text-xs text-muted">Market Positioning</p>
                    <p className="text-sm font-medium text-foreground">{strategy.positioning}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted">Messaging Angle</p>
                    <p className="text-sm font-medium text-foreground">{strategy.messaging_angle}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted">Brand Tone & Voice</p>
                    <span className="inline-block px-2.5 py-1 bg-primary/10 text-primary rounded-full text-xs font-semibold mt-1">
                      {strategy.tone}
                    </span>
                  </div>
                </div>

                <div className="card space-y-3">
                  <h4 className="font-bold text-sm text-primary uppercase tracking-wide">Audience & CTA Strategy</h4>
                  <div>
                    <p className="text-xs text-muted">Target Audience Persona</p>
                    <p className="text-sm font-medium text-foreground">{strategy.target_audience}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted">Call-To-Action (CTA) Strategy</p>
                    <p className="text-sm font-medium text-foreground">{strategy.cta_strategy}</p>
                  </div>
                </div>

                <div className="card space-y-3">
                  <h4 className="font-bold text-sm text-primary uppercase tracking-wide">Content Strategy</h4>
                  <div>
                    <p className="text-xs text-muted mb-2">Strategic Content Pillars</p>
                    <div className="flex flex-wrap gap-2">
                      {strategy.content_pillars?.map((pillar, i) => (
                        <span key={i} className="px-2.5 py-1 bg-surface border border-border/60 rounded-md text-xs font-medium text-foreground">
                          {pillar}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-muted mt-2">Organic vs Paid Mix</p>
                    <p className="text-sm font-medium text-foreground">{strategy.organic_vs_paid}</p>
                  </div>
                </div>

                <div className="card space-y-3">
                  <h4 className="font-bold text-sm text-primary uppercase tracking-wide">Distribution & Budget</h4>
                  <div>
                    <p className="text-xs text-muted mb-2">Recommended Channels</p>
                    <div className="flex flex-wrap gap-2">
                      {strategy.recommended_platforms?.map((plat, i) => (
                        <span key={i} className="px-2.5 py-1 bg-primary/10 text-primary rounded-md text-xs font-semibold capitalize">
                          {plat}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-muted mt-2">Recommended Budget Strategy</p>
                    <p className="text-sm font-medium text-foreground">{strategy.recommended_budget}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* RESEARCH TAB */}
      {activeTab === "research" && (
        <div className="space-y-6">
          {!researchReport && !isExecuting && (
            <div className="card py-12 flex flex-col items-center gap-4 text-center">
              <p className="text-muted text-sm">No research data has been gathered for this campaign yet.</p>
              <button
                className="btn px-6 py-2.5 font-bold"
                onClick={() => handleRunCampaign("research")}
                disabled={triggeringResearch}
              >
                {triggeringResearch ? "Running Agents..." : "🚀 Run Research Agent"}
              </button>
            </div>
          )}

          {researchReport && (
            <div className="space-y-6">
              {/* Metadata Banner */}
              <div className="card flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-l-4 border-l-primary">
                <div>
                  <h3 className="font-bold text-lg text-primary">Executive Research Brief</h3>
                  <p className="text-xs text-muted mt-1">
                    Completed Providers: {researchReport.metadata?.completed_providers?.join(", ") || "SerpAPI Senior Analyst"} • Execution Time:{" "}
                    {researchReport.metadata?.execution_time ? `${researchReport.metadata.execution_time.toFixed(2)}s` : "Fast"}
                    {campaign.results?.cache_metadata?.cache_hit && (
                      <span className="ml-2 font-bold text-emerald-600 dark:text-emerald-400">(Reused Cached Research)</span>
                    )}
                  </p>
                </div>
                <button
                  className="btn-outline text-xs px-3 py-1 font-medium"
                  onClick={() => handleRunCampaign("research")}
                  disabled={isExecuting || triggeringResearch}
                >
                  {triggeringResearch ? "Running..." : "Refresh Research"}
                </button>
              </div>

              {/* Research Planner Inferred Search Queries */}
              {planner && planner.search_queries?.length > 0 && (
                <div className="card space-y-3 bg-surface/60 border border-primary/20">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-xs uppercase tracking-wider text-primary">Inferred Market Search Queries</h4>
                    <span className="text-[11px] text-muted font-medium">{planner.search_queries.length} Queries Executed</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {planner.search_queries.map((q: string, idx: number) => (
                      <span key={idx} className="px-3 py-1.5 bg-primary/10 text-primary border border-primary/20 rounded-lg text-xs font-semibold">
                        🔍 &quot;{q}&quot;
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Competitors Section */}
              <div className="card space-y-3">
                <h3 className="font-bold text-primary">Competitors</h3>
                {researchReport.intelligence?.competitors?.length > 0 ? (
                  <div className="grid gap-4 md:grid-cols-3">
                    {researchReport.intelligence.competitors.map((c: CompetitorResult, i: number) => (
                      <div key={i} className="p-3 bg-surface rounded-lg border border-border/40 space-y-1.5">
                        <h4 className="font-semibold text-sm">{c.name}</h4>
                        {renderExternalLink(c.domain, "URL")}
                        {c.reason && (
                          <p className="text-xs text-foreground/80 bg-primary/5 p-2 rounded border border-primary/10 leading-snug">
                            <span className="font-semibold text-primary">Analyst Rationale: </span>
                            {c.reason}
                          </p>
                        )}
                        {c.similarity_score != null && <p className="text-xs text-muted">Similarity: {c.similarity_score}</p>}
                        {c.confidence != null && <p className="text-[11px] text-muted">Confidence: {(c.confidence * 100).toFixed(0)}%</p>}
                        {c.provider && <p className="text-[11px] text-muted">Source: {c.provider}</p>}
                        {renderExternalLink(c.source_url, "View Source")}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-foreground/80">No competitors found.</p>
                )}
              </div>

              {/* Audience Section */}
              <div className="card space-y-3">
                <h3 className="font-bold text-primary">Target Audience</h3>
                {researchReport.intelligence?.audience?.length > 0 ? (
                  <div className="grid gap-4 md:grid-cols-3">
                    {researchReport.intelligence.audience.map((a: AudienceResult, i: number) => (
                      <div key={i} className="p-3 bg-surface rounded-lg border border-border/40 space-y-1.5">
                        <h4 className="font-semibold text-sm">{a.segment}</h4>
                        {a.reason && (
                          <p className="text-xs text-foreground/80 bg-primary/5 p-2 rounded border border-primary/10 leading-snug">
                            <span className="font-semibold text-primary">Persona Rationale: </span>
                            {a.reason}
                          </p>
                        )}
                        {a.size != null && <p className="text-xs text-muted">Size: {a.size}</p>}
                        {a.confidence != null && <p className="text-[11px] text-muted">Confidence: {a.confidence}</p>}
                        {a.provider && <p className="text-[11px] text-muted">Source: {a.provider}</p>}
                        {renderExternalLink(a.source_url, "View Source")}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-foreground/80">No audience segments found.</p>
                )}
              </div>

              {/* News Section */}
              <div className="card space-y-3">
                <h3 className="font-bold text-primary">Recent News</h3>
                {researchReport.intelligence?.news?.length > 0 ? (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {researchReport.intelligence.news.map((n: NewsResult, i: number) => (
                      <div key={i} className="p-3 bg-surface rounded-lg border border-border/40 space-y-1.5">
                        <h4 className="font-semibold text-sm">{n.title}</h4>
                        <p className="text-xs text-muted">
                          {n.source} {n.published_at ? `• ${n.published_at}` : ""}
                        </p>
                        {n.summary && <p className="text-xs text-foreground/90 font-medium leading-snug">{n.summary}</p>}
                        {n.reason && (
                          <p className="text-xs text-foreground/80 bg-primary/5 p-2 rounded border border-primary/10 leading-snug">
                            <span className="font-semibold text-primary">Impact Rationale: </span>
                            {n.reason}
                          </p>
                        )}
                        {renderExternalLink(n.url, "Read Article")}
                        {n.confidence != null && <p className="text-[11px] text-muted">Confidence: {n.confidence}</p>}
                        {n.provider && <p className="text-[11px] text-muted">Source Provider: {n.provider}</p>}
                        {renderExternalLink(n.source_url, "View Source")}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-foreground/80">No recent news found.</p>
                )}
              </div>

              {/* Trends Section */}
              <div className="card space-y-3">
                <h3 className="font-bold text-primary">Trends</h3>
                {researchReport.intelligence?.trends?.length > 0 ? (
                  <div className="grid gap-4 md:grid-cols-3">
                    {researchReport.intelligence.trends.map((t: TrendResult, i: number) => (
                      <div key={i} className="p-3 bg-surface rounded-lg border border-border/40 space-y-1.5">
                        <h4 className="font-semibold text-sm">{t.keyword}</h4>
                        {t.reason && (
                          <p className="text-xs text-foreground/80 bg-primary/5 p-2 rounded border border-primary/10 leading-snug">
                            <span className="font-semibold text-primary">Trend Rationale: </span>
                            {t.reason}
                          </p>
                        )}
                        {t.volume != null && <p className="text-xs text-muted">Volume: {t.volume}</p>}
                        {t.region && <p className="text-xs text-muted">Region: {t.region}</p>}
                        {t.confidence != null && <p className="text-[11px] text-muted">Confidence: {t.confidence}</p>}
                        {t.provider && <p className="text-[11px] text-muted">Source: {t.provider}</p>}
                        {renderExternalLink(t.source_url, "View Source")}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-foreground/80">No trends found.</p>
                )}
              </div>

              {/* Technologies Section */}
              <div className="card space-y-3">
                <h3 className="font-bold text-primary">Technologies</h3>
                {researchReport.intelligence?.technologies?.length > 0 ? (
                  <div className="grid gap-4 md:grid-cols-3">
                    {researchReport.intelligence.technologies.map((tech: TechnologyResult, i: number) => (
                      <div key={i} className="p-3 bg-surface rounded-lg border border-border/40 space-y-1.5">
                        <h4 className="font-semibold text-sm">{tech.name}</h4>
                        {tech.reason && (
                          <p className="text-xs text-foreground/80 bg-primary/5 p-2 rounded border border-primary/10 leading-snug">
                            <span className="font-semibold text-primary">Tech Rationale: </span>
                            {tech.reason}
                          </p>
                        )}
                        {tech.category && <p className="text-xs text-muted">Category: {tech.category}</p>}
                        {tech.maturity && <p className="text-xs text-muted">Maturity: {tech.maturity}</p>}
                        {tech.confidence != null && <p className="text-[11px] text-muted">Confidence: {tech.confidence}</p>}
                        {tech.provider && <p className="text-[11px] text-muted">Source: {tech.provider}</p>}
                        {renderExternalLink(tech.source_url, "View Source")}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-foreground/80">No technologies found.</p>
                )}
              </div>

              {/* Strategic Opportunities & Risks Section */}
              {((researchReport.intelligence?.opportunities?.length || 0) > 0 ||
                (researchReport.intelligence?.risks?.length || 0) > 0) && (
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="card space-y-3 border-l-4 border-l-emerald-500">
                    <h3 className="font-bold text-emerald-600">Strategic Opportunities</h3>
                    <div className="space-y-3">
                      {researchReport.intelligence.opportunities?.map((opp, i) => (
                        <div key={i} className="p-3 bg-surface rounded-lg border border-emerald-500/20 space-y-1">
                          <h4 className="font-semibold text-sm text-emerald-700 dark:text-emerald-400">{opp.opportunity}</h4>
                          {opp.reason && <p className="text-xs text-foreground/80 leading-snug">{opp.reason}</p>}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="card space-y-3 border-l-4 border-l-amber-500">
                    <h3 className="font-bold text-amber-600">Market Risks & Threats</h3>
                    <div className="space-y-3">
                      {researchReport.intelligence.risks?.map((r, i) => (
                        <div key={i} className="p-3 bg-surface rounded-lg border border-amber-500/20 space-y-1">
                          <h4 className="font-semibold text-sm text-amber-700 dark:text-amber-400">{r.risk}</h4>
                          {r.reason && <p className="text-xs text-foreground/80 leading-snug">{r.reason}</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* CONTENT TAB */}
      {activeTab === "content" && (
        <>
          {campaign.workflow === "lead_generation" ? (
            <LeadsDashboard leads={campaign.results?.leads || []} />
          ) : (
            <AssetsDashboard
              assets={mappedAssets}
              campaignId={campaign.id}
              metaConfigured={metaConfigured}
              publishingAssets={publishingAssets}
              publishErrors={publishErrors}
              onPublishAsset={handlePublishAsset}
            />
          )}
        </>
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
  execution?: ExecutionMetadata;
  status: string;
  onRetry: () => void;
  isExecuting: boolean;
}) {
  if (!execution && status !== "running" && status !== "researching" && status !== "failed") {
    return null;
  }

  const stagesList = [
    { key: "planning", label: "Planning & Context", agent: "🧠 Planner Agent", desc: "Understanding product features & search intent" },
    { key: "researching", label: "Market Research", agent: "🔍 Research Agent", desc: "Executing SerpAPI searches (max 5 queries x 10 results)" },
    { key: "analyzing", label: "Intelligence Analysis", agent: "📊 Intelligence Agent", desc: "Filtering noise & inferring direct competitors" },
    { key: "strategizing", label: "Go-To-Market Strategy", agent: "🎯 Strategy Agent", desc: "Formulating GTM positioning & messaging pillars" },
    { key: "generating_content", label: "Content Generation", agent: "✍️ Content Agent", desc: "Writing platform-tailored social media copy" },
    { key: "generating_images", label: "Creative Generation", agent: "🎨 Creative Agent", desc: "Generating campaign visual assets" },
    { key: "ready", label: "Campaign Ready", agent: "🏁 Campaign Ready", desc: "All campaign deliverables are ready for review" },
  ];

  const currentStageKey = execution?.stage || (status === "researching" ? "researching" : status === "running" ? "planning" : "idle");
  const isFailed = execution?.stage === "failed" || status === "failed";
  const isReady = execution?.stage === "ready" || (status !== "running" && status !== "researching" && !isFailed && execution);

  return (
    <div className="card space-y-5 border-l-4 border-l-primary shadow-lg bg-surface/90">
      {/* Current Active Agent Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-4 rounded-lg bg-primary/5 border border-primary/10">
        <div className="flex items-center gap-3">
          <div
            className={`p-2.5 rounded-full ${
              isFailed
                ? "bg-destructive/10 text-destructive"
                : isReady
                ? "bg-emerald-500/10 text-emerald-500"
                : "bg-primary/10 text-primary animate-pulse"
            }`}
          >
            <span className="text-xl">{execution?.current_agent?.slice(0, 2) || "🧠"}</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-base text-foreground">
                {execution?.current_agent || (isFailed ? "✕ System Alert" : isExecuting ? "🧠 Multi-Agent Orchestrator" : "Campaign Execution Status")}
              </h3>
              {isExecuting && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-primary/10 text-primary animate-pulse">
                  ⟳ Executing Pipeline
                </span>
              )}
              {isReady && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  ✓ Pipeline Complete
                </span>
              )}
              {isFailed && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-destructive/10 text-destructive">
                  ✕ Execution Failed
                </span>
              )}
            </div>
            <p className="text-sm text-foreground/80 mt-0.5 font-medium">
              {execution?.current_message ||
                (isExecuting
                  ? "Executing autonomous campaign agents..."
                  : isFailed
                  ? execution?.error_message || "An unexpected error occurred during execution."
                  : "Campaign assets are ready.")}
            </p>
          </div>
        </div>

        {isFailed && (
          <button
            className="btn px-4 py-2 text-sm bg-destructive hover:bg-destructive/90 text-white shrink-0 font-semibold"
            onClick={onRetry}
          >
            Retry / Resume Execution
          </button>
        )}
      </div>

      {/* Progress Timeline List */}
      <div className="space-y-3 pt-1">
        <h4 className="text-xs uppercase tracking-wider text-muted font-bold">Autonomous Execution Timeline</h4>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {stagesList.map((st) => {
            const stageData = execution?.stages?.[st.key];
            const isCurrent = currentStageKey === st.key;
            const stStatus = stageData?.status || (isCurrent ? (isFailed ? "failed" : isExecuting ? "running" : "completed") : "waiting");

            let statusIcon = "○";
            let statusBadge = "Waiting";
            let badgeStyle = "bg-muted/10 text-muted border-border/40";

            if (stStatus === "completed") {
              statusIcon = "✓";
              statusBadge = stageData?.duration != null ? `Completed in ${stageData.duration}s` : "Completed";
              badgeStyle = "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20";
            } else if (stStatus === "running") {
              statusIcon = "⟳";
              statusBadge = stageData?.query_progress ? `Running (${stageData.query_progress})` : "Running...";
              badgeStyle = "bg-primary/10 text-primary border-primary/20 animate-pulse font-semibold";
            } else if (stStatus === "failed") {
              statusIcon = "✕";
              statusBadge = "Failed";
              badgeStyle = "bg-destructive/10 text-destructive border-destructive/20 font-semibold";
            }

            return (
              <div
                key={st.key}
                className={`p-3 rounded-lg border transition ${
                  isCurrent
                    ? "border-primary/50 bg-primary/5 shadow-sm"
                    : stStatus === "completed"
                    ? "border-border/60 bg-surface/50"
                    : "border-border/30 bg-surface/20 opacity-70"
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <span>{st.agent.split(" ")[0]}</span> {st.label}
                  </span>
                  <span className={`text-[11px] px-2 py-0.5 rounded border ${badgeStyle}`}>
                    <span className="mr-1">{statusIcon}</span> {statusBadge}
                  </span>
                </div>
                <p className="text-[11px] text-muted leading-tight">{st.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function CampaignReadyBanner({
  assetCount,
  onPublish,
  isPublishing,
  progress,
}: {
  assetCount: number;
  onPublish: () => void;
  isPublishing: boolean;
  progress: { current: number; total: number } | null;
}) {
  return (
    <div className="card border-l-4 border-l-emerald-500 bg-gradient-to-r from-emerald-500/10 via-surface to-surface p-6 space-y-4">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">{isPublishing ? "📡" : "🎉"}</span>
            <h3 className="font-bold text-lg text-emerald-600 dark:text-emerald-400">
              {isPublishing ? "Publishing Campaign Assets..." : "Campaign Execution Complete"}
            </h3>
          </div>
          <p className="text-sm text-foreground/80 mt-1">
            {isPublishing && progress
              ? `Publishing asset ${progress.current} of ${progress.total}...`
              : "All autonomous marketing agents have completed execution. Your market intelligence brief, positioning strategy, and platform assets are ready for review."
            }
          </p>
        </div>
        <button
          className={`btn px-6 py-2.5 font-bold text-sm shadow-md shrink-0 transition flex items-center gap-2 ${
            isPublishing
              ? "bg-muted cursor-not-allowed text-muted-foreground"
              : assetCount === 0
                ? "bg-emerald-700 text-white/70 cursor-default"
                : "bg-emerald-600 hover:bg-emerald-700 text-white"
          }`}
          onClick={onPublish}
          disabled={isPublishing || assetCount === 0}
        >
          {isPublishing ? (
            <><span className="animate-spin">⟳</span> Publishing {progress?.current}/{progress?.total}...</>
          ) : assetCount === 0 ? (
            <>✓ All Assets Published</>
          ) : (
            <>Publish Campaign Assets ({assetCount} Ready)</>
          )}
        </button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2 text-xs border-t border-emerald-500/20">
        <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-medium">
          <span>✓</span> Market Intelligence Brief
        </div>
        <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-medium">
          <span>✓</span> GTM Positioning Strategy
        </div>
        <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-medium">
          <span>✓</span> Social Media Content
        </div>
        <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-medium">
          <span>✓</span> Visual Campaign Creatives
        </div>
      </div>
    </div>
  );
}

function AssetsDashboard({
  assets,
  campaignId,
  metaConfigured,
  publishingAssets,
  publishErrors,
  onPublishAsset,
}: {
  assets: CampaignAsset[];
  campaignId: string;
  metaConfigured: boolean;
  publishingAssets: Record<string, "publishing" | "done" | "error">;
  publishErrors: Record<string, string>;
  onPublishAsset: (asset: CampaignAsset) => Promise<void>;
}) {
  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        {assets.map((asset, i) => {
          const pubState = asset.id ? publishingAssets[asset.id] : undefined;
          const pubError = asset.id ? publishErrors[asset.id] : undefined;
          const isPublished = asset.status === "published" || asset.status === "scheduled" || pubState === "done";
          const isPublishing = pubState === "publishing";
          const canPublish = !isPublished && !isPublishing && asset.id;

          return (
            <div key={asset.id || i} className="card space-y-4">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 bg-primary/10 text-primary rounded-md text-xs font-semibold uppercase">
                  {PLATFORM_LABELS[asset.platform] || asset.platform}
                </span>
                {isPublished ? (
                  <span className="px-2.5 py-1 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 rounded-md text-xs font-semibold">Published ✓</span>
                ) : isPublishing ? (
                  <span className="px-2.5 py-1 bg-amber-500/15 text-amber-600 dark:text-amber-400 rounded-md text-xs font-semibold flex items-center gap-1">
                    <span className="animate-spin">⟳</span> Publishing...
                  </span>
                ) : pubState === "error" ? (
                  <span className="px-2.5 py-1 bg-red-500/15 text-red-600 dark:text-red-400 rounded-md text-xs font-semibold">Failed</span>
                ) : (
                  <span className="text-xs text-muted font-medium capitalize">{asset.status}</span>
                )}
              </div>

              {asset.headline && <h4 className="font-bold text-base text-foreground">{asset.headline}</h4>}
              {asset.body && <p className="text-sm text-foreground/90 whitespace-pre-wrap">{asset.body}</p>}

              {asset.hashtags?.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {asset.hashtags.map((tag, idx) => (
                    <span key={idx} className="text-xs text-primary/80">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              {asset.cta && (
                <div className="p-2.5 bg-surface/80 rounded border border-border/40 text-xs">
                  <span className="font-semibold text-primary">CTA: </span>
                  {asset.cta}
                </div>
              )}

              {asset.creative_url && (
                <div className="space-y-1.5">
                  <p className="text-xs text-muted font-semibold">Visual Creative:</p>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={asset.creative_url}
                    alt="Campaign Creative"
                    className="w-full h-48 object-cover rounded-lg border border-border/40"
                  />
                </div>
              )}

              {/* Per-asset publish action */}
              {pubError && (
                <div className="p-2.5 bg-red-500/10 border border-red-500/30 rounded text-xs text-red-600 dark:text-red-400">
                  {pubError}
                </div>
              )}
              <div className="pt-2 border-t border-border/30">
                {isPublished ? (
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                      ✓ Published to {PLATFORM_LABELS[asset.platform] || asset.platform}
                    </span>
                    {asset.published_url ? (
                      <a
                        href={asset.published_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary hover:underline font-semibold flex items-center gap-1"
                      >
                        View Live Post ↗
                      </a>
                    ) : (
                      <span className="text-xs text-muted font-normal">Permalink unavailable</span>
                    )}
                  </div>
                ) : (
                  <button
                    className={`btn text-xs px-4 py-2 font-semibold transition flex items-center gap-2 ${
                      isPublishing
                        ? "bg-muted cursor-not-allowed text-muted-foreground"
                        : "bg-primary hover:bg-primary/90 text-white"
                    }`}
                    onClick={() => onPublishAsset(asset)}
                    disabled={!canPublish}
                  >
                    {isPublishing ? (
                      <><span className="animate-spin">⟳</span> Publishing...</>
                    ) : pubState === "error" ? (
                      <>Retry Publish</>
                    ) : (
                      <>Publish to {PLATFORM_LABELS[asset.platform] || asset.platform}</>
                    )}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function LeadsDashboard({ leads }: { leads: any[] }) {
  return (
    <div className="space-y-4">
      <h3 className="font-bold text-lg text-primary">Discovered Leads</h3>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {leads.map((lead, i) => (
          <div key={i} className="card space-y-2">
            <h4 className="font-semibold text-base">{lead.name}</h4>
            {lead.category && <p className="text-xs text-muted">{lead.category}</p>}
            {lead.email && <p className="text-xs text-primary">{lead.email}</p>}
            {lead.score_reason && <p className="text-xs text-foreground/80 mt-1">{lead.score_reason}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
