"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Rocket,
  RefreshCw,
  SlidersHorizontal,
  CheckCircle2,
  ExternalLink,
  Search,
  Target,
  Share2,
  AlertTriangle,
  Play,
  Layers,
  ChevronDown,
  ArrowLeft,
  Maximize2,
} from "lucide-react";
import {
  PLATFORM_LABELS,
  getPublishedLinkInfo,
  type Campaign,
  type CampaignAsset,
  type CompetitorResult,
} from "@/lib/types";
import { AnimatedButton } from "./ui/AnimatedButton";
import { StatusBadge } from "./ui/StatusBadge";
import { TimelineNode } from "./ui/TimelineNode";
import { EmptyState } from "./ui/EmptyState";
import { LoadingState } from "./ui/LoadingState";
import { Skeleton } from "./ui/Skeleton";
import { AnimatedNumber } from "./ui/AnimatedNumber";
import { NetworkGraph } from "./ui/NetworkGraph";
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

  // Auto scroll to top on mount
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
    if (publishingAssets[asset.id] === "publishing" || asset.status === "publishing") return;
    if ((asset.status as string) === "generating" || !asset.creative_url) return;

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
      await refreshCampaign();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Publish failed.";
      setPublishingAssets((prev) => ({ ...prev, [asset.id]: "error" }));
      setPublishErrors((prev) => ({ ...prev, [asset.id]: msg }));
    }
  };

  const baseAssets = campaign.assets || [];
  const aiAssets = campaign.results?.assets || [];
  const mappedAssets = baseAssets.length > 0
    ? baseAssets.map((base: any) => {
        const ai: any = aiAssets.find((a: any) => a.platform === base.platform) || {};
        return {
          ...ai,
          ...base,
          headline: base.headline || ai.headline || "",
          body: base.body || ai.body || "",
          hashtags: base.hashtags || ai.hashtags || [],
          cta: base.cta || ai.cta || "",
          creative_prompt: base.creative_prompt || ai.creative_prompt || "",
          creative_url: base.creative_url || ai.creative_url || null,
          status: base.status || "draft",
          external_id: base.external_id || null,
          published_url: base.published_url || ai.published_url || null,
          error: base.error || null,
        };
      })
    : aiAssets;

  const handlePublishAll = async () => {
    const draftAssets = mappedAssets.filter(
      (a: any) =>
        a.id &&
        (a.status === "draft" || a.status === "ready" || a.status === "failed") &&
        !!a.creative_url &&
        a.status !== "generating" &&
        a.status !== "publishing"
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

  const renderExternalLink = (url: string | null | undefined, label: string = "View source") => {
    if (!url) return null;
    const href = url.startsWith("http") ? url : `https://${url}`;
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 break-all text-xs text-primary transition-opacity hover:opacity-70"
      >
        <span className="line-clamp-1">{label === "View source" ? label : url}</span>
        <ExternalLink className="h-3 w-3 shrink-0" />
      </a>
    );
  };

  const numQueries = planner?.search_queries?.length || 0;
  const numCompetitors = researchReport?.intelligence?.competitors?.length || 0;
  const numAssets = mappedAssets.length;

  return (
    <div>
      <AssetModal
        asset={selectedAsset}
        onClose={() => setSelectedAsset(null)}
        onPublish={handlePublishAsset}
        metaConfigured={metaConfigured}
      />

      {/* HEADER */}
      <header className="pb-8">
        <Link
          href="/campaigns"
          className="mb-6 inline-flex items-center gap-1.5 font-mono text-xs text-muted transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Campaigns</span>
        </Link>

        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-start">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <StatusBadge status={campaign.status} pulse={isExecuting} size="sm" />
              <span className="chip">{campaign.workflow.replace("_", " ")}</span>
              <span className="font-mono text-[11px] text-muted">
                {campaign.id.slice(0, 8)}
              </span>
            </div>

            <h1 className="mt-4 font-heading text-3xl font-semibold tracking-tight text-foreground">
              {campaign.product_name || "Campaign"}
            </h1>

            <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1 font-mono text-xs text-muted">
              <span>
                <AnimatedNumber value={numQueries} /> queries
              </span>
              <span>
                <AnimatedNumber value={numCompetitors} /> competitors
              </span>
              <span>
                <AnimatedNumber value={numAssets} /> assets
              </span>
            </div>
          </div>

          {/* ACTIONS */}
          <div className="flex shrink-0 items-center gap-2.5">
            <AnimatedButton
              variant="primary"
              size="md"
              isLoading={triggeringResearch || isExecuting}
              onClick={() => handleRunCampaign("none")}
              disabled={isExecuting || triggeringResearch}
              icon={<Rocket className="h-4 w-4" />}
            >
              {isExecuting ? "Running…" : "Run campaign"}
            </AnimatedButton>

            <div className="relative">
              <AnimatedButton
                variant="ghost"
                size="md"
                onClick={() => setShowRefreshMenu(!showRefreshMenu)}
                disabled={isExecuting || triggeringResearch}
                icon={<SlidersHorizontal className="h-4 w-4" />}
              >
                <span className="flex items-center gap-1.5">
                  Options
                  <ChevronDown className="h-3.5 w-3.5" />
                </span>
              </AnimatedButton>

              <AnimatePresence>
                {showRefreshMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 4 }}
                    transition={{ duration: 0.12 }}
                    className="panel absolute right-0 z-50 mt-2 w-60 overflow-hidden p-1"
                  >
                    <MenuItem
                      icon={<Play className="h-3.5 w-3.5" />}
                      label="Run with cache"
                      onClick={() => handleRunCampaign("none")}
                    />
                    <MenuItem
                      icon={<Search className="h-3.5 w-3.5" />}
                      label="Refresh research"
                      onClick={() => handleRunCampaign("research")}
                    />
                    <MenuItem
                      icon={<Target className="h-3.5 w-3.5" />}
                      label="Refresh strategy"
                      onClick={() => handleRunCampaign("strategy")}
                    />
                    <div className="mt-1 border-t border-border pt-1">
                      <MenuItem
                        icon={<RefreshCw className="h-3.5 w-3.5" />}
                        label="Re-run everything"
                        onClick={() => handleRunCampaign("everything")}
                        danger
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </header>

      {/* READY BANNER */}
      {isReady && (
        <div className="mb-6 flex flex-col items-start justify-between gap-3 rounded-md border border-border bg-panel p-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-success" />
            <div>
              <span className="block text-sm font-medium text-foreground">Campaign ready</span>
              <span className="mt-0.5 block text-xs text-muted">
                All stages complete. Assets are ready for review.
              </span>
            </div>
          </div>
          <AnimatedButton
            variant="ghost"
            size="sm"
            onClick={handlePublishAll}
            icon={<Share2 className="h-3.5 w-3.5" />}
          >
            Publish all assets
          </AnimatedButton>
        </div>
      )}

      {/* ERROR */}
      {researchError && (
        <div className="mb-6 flex items-center gap-2 rounded-md border border-danger bg-panel p-4 text-xs font-medium text-danger">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>{researchError}</span>
        </div>
      )}

      {/* PERSISTENT STAGE RAIL LOADING BANNER */}
      {isExecuting && (
        <div className="mb-6">
          <LoadingState stage={currentStage || "planning"} isExecuting={isExecuting} />
        </div>
      )}

      {/* PIPELINE TIMELINE */}
      <MultiAgentTimelineBanner
        execution={campaign.execution}
        status={campaign.status}
        onRetry={() => handleRunCampaign("none", true)}
        isExecuting={isExecuting}
      />

      {/* TABS */}
      <div className="mt-10 flex gap-8 border-b border-border">
        {[
          { id: "strategy", label: "Strategy", count: strategy ? 1 : 0 },
          { id: "research", label: "Research", count: researchReport ? 1 : 0 },
          { id: "content", label: "Assets", count: mappedAssets.length },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                playUISound("click");
                setActiveTab(tab.id as any);
              }}
              className={`relative -mb-px flex items-center gap-2 pb-3 text-[13px] font-medium transition-colors ${
                isActive ? "text-foreground" : "text-muted hover:text-foreground"
              }`}
            >
              <span>{tab.label}</span>
              {tab.count > 0 && (
                <span className="font-mono text-[10px] text-muted">{tab.count}</span>
              )}
              {isActive && <span className="absolute bottom-0 left-0 h-[2px] w-full bg-primary" />}
            </button>
          );
        })}
      </div>

      {/* TAB: STRATEGY */}
      {activeTab === "strategy" && (
        <div className="pt-8">
          {!strategy && !isExecuting && (
            <EmptyState
              icon={<Target className="h-7 w-7" />}
              title="No strategy yet"
              description="Run the pipeline to turn competitor research into positioning, audience, and messaging pillars."
              action={
                <AnimatedButton
                  onClick={() => handleRunCampaign("strategy")}
                  disabled={triggeringResearch}
                >
                  Generate strategy
                </AnimatedButton>
              }
            />
          )}

          {strategy && (
            <div className="space-y-10">
              <div className="flex items-center justify-between gap-4">
                <h2 className="font-heading text-xl font-semibold tracking-tight text-foreground">
                  Marketing strategy
                </h2>
                <AnimatedButton
                  variant="outline"
                  size="sm"
                  onClick={() => handleRunCampaign("strategy")}
                  disabled={isExecuting || triggeringResearch}
                  icon={<RefreshCw className="h-3 w-3" />}
                >
                  Refresh
                </AnimatedButton>
              </div>

              <dl className="grid gap-px border border-border bg-border md:grid-cols-2">
                <Field label="Campaign objective" value={strategy.campaign_objective} />
                <Field label="Value proposition" value={strategy.value_proposition} />
                <Field label="Market positioning" value={strategy.positioning} />
                <Field label="Messaging angle" value={strategy.messaging_angle} />
                <Field label="Target audience" value={strategy.target_audience} />
                <Field label="Call to action" value={strategy.cta_strategy} />
                <Field label="Brand tone" value={strategy.tone} className="md:col-span-2" />
              </dl>
            </div>
          )}
        </div>
      )}

      {/* TAB: RESEARCH */}
      {activeTab === "research" && (
        <div className="pt-8">
          {!researchReport && !isExecuting && (
            <EmptyState
              icon={<Search className="h-7 w-7" />}
              title="No research yet"
              description="Run market research to pull competitor benchmarks, search trends, and audience segments from SerpAPI."
              action={
                <AnimatedButton
                  onClick={() => handleRunCampaign("research")}
                  disabled={triggeringResearch}
                >
                  Run research
                </AnimatedButton>
              }
            />
          )}

          {researchReport && (
            <div className="space-y-10">
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                  <h2 className="font-heading text-xl font-semibold tracking-tight text-foreground">
                    Market research
                  </h2>
                  <p className="mt-1.5 font-mono text-xs text-muted">
                    {researchReport.metadata?.execution_time
                      ? `Completed in ${researchReport.metadata.execution_time.toFixed(2)}s`
                      : "Completed"}
                    {campaign.results?.cache_metadata?.cache_hit && " · served from cache"}
                  </p>
                </div>
                <AnimatedButton
                  variant="outline"
                  size="sm"
                  onClick={() => handleRunCampaign("research")}
                  disabled={isExecuting || triggeringResearch}
                  icon={<RefreshCw className="h-3 w-3" />}
                >
                  Refresh
                </AnimatedButton>
              </div>

              <NetworkGraph
                queries={planner?.search_queries}
                competitors={researchReport.intelligence?.competitors}
              />

              <div>
                <h3 className="font-heading text-base font-semibold text-foreground">
                  Competitor insights
                </h3>

                {researchReport.intelligence?.competitors?.length > 0 ? (
                  <div className="mt-5 grid gap-px border border-border bg-border md:grid-cols-3">
                    {researchReport.intelligence.competitors.map((c: CompetitorResult, i: number) => (
                      <div key={i} className="space-y-2.5 bg-panel p-5">
                        <h4 className="font-heading text-sm font-semibold text-foreground">
                          {c.name}
                        </h4>
                        {renderExternalLink(c.domain, "URL")}
                        {c.reason && (
                          <p className="text-xs leading-relaxed text-muted">{c.reason}</p>
                        )}
                        {renderExternalLink(c.source_url, "View source")}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-4 text-sm text-muted">No competitor data extracted.</p>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB: ASSETS */}
      {activeTab === "content" && (
        <div className="pt-8">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h2 className="font-heading text-xl font-semibold tracking-tight text-foreground">
                Generated assets
              </h2>
              <p className="mt-1.5 text-sm text-muted">
                Select any asset to open it full size, edit the copy, or regenerate the image.
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-3">
              {batchPublishing && batchProgress && (
                <span className="font-mono text-xs text-muted">
                  {batchProgress.current}/{batchProgress.total}
                </span>
              )}
              <AnimatedButton
                variant="primary"
                size="md"
                onClick={handlePublishAll}
                disabled={batchPublishing || mappedAssets.length === 0}
                icon={<Share2 className="h-4 w-4" />}
              >
                Publish all drafts
              </AnimatedButton>
            </div>
          </div>

          <div className="mt-8 grid gap-px border border-border bg-border md:grid-cols-2">
            {mappedAssets.map((asset: CampaignAsset, idx: number) => {
              const pubState = publishingAssets[asset.id];
              const pubError = publishErrors[asset.id] || asset.error;
              const isGenerating = (asset.status as string) === "generating" || (currentStage === "generating_images" && !asset.creative_url);
              const isPublishing = pubState === "publishing" || asset.status === "publishing";
              const isPublished = asset.status === "published" || pubState === "done";
              const canPublish = metaConfigured && !isGenerating && !isPublishing && !isPublished && !!asset.creative_url;

              const badgeStatus = isPublished
                ? "published"
                : isPublishing
                ? "publishing"
                : isGenerating
                ? "generating"
                : asset.status;

              return (
                <div
                  key={asset.id || idx}
                  onClick={() => setSelectedAsset(asset)}
                  className="group cursor-pointer space-y-4 bg-panel p-6 transition-colors hover:bg-surface"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-mono text-[11px] font-medium uppercase tracking-wider text-foreground">
                      {PLATFORM_LABELS[asset.platform] || asset.platform}
                    </span>
                    <div className="flex items-center gap-2">
                      <StatusBadge
                        status={badgeStatus}
                        size="sm"
                      />
                      <Maximize2 className="h-3.5 w-3.5 text-muted opacity-0 transition-opacity group-hover:opacity-100" />
                    </div>
                  </div>

                  {asset.headline ? (
                    <h3 className="font-heading text-base font-semibold text-foreground">
                      {asset.headline}
                    </h3>
                  ) : isExecuting ? (
                    <Skeleton className="h-6 w-3/4" />
                  ) : null}

                  {asset.body ? (
                    <p className="line-clamp-3 whitespace-pre-wrap text-sm leading-relaxed text-muted">
                      {asset.body}
                    </p>
                  ) : isExecuting ? (
                    <Skeleton className="h-20 w-full" />
                  ) : null}

                  <AssetCardImage
                    src={asset.creative_url}
                    isGenerating={isGenerating}
                    isExecuting={isExecuting}
                  />

                  {pubError && (
                    <div className="rounded-md border border-danger p-3 text-xs text-danger">
                      {pubError}
                    </div>
                  )}

                  <div
                    className="flex items-center justify-between border-t border-border pt-4"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {isPublished ? (
                      (() => {
                        const linkInfo = getPublishedLinkInfo(asset);
                        return (
                          <div className="flex w-full items-center justify-between gap-2">
                            <span className="flex items-center gap-1.5 text-xs font-medium text-success">
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              Published
                            </span>
                            <a
                              href={linkInfo.href}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs font-medium text-primary transition-opacity hover:opacity-70"
                            >
                              <span>{linkInfo.label}</span>
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          </div>
                        );
                      })()
                    ) : (
                      <AnimatedButton
                        variant="outline"
                        size="sm"
                        isLoading={isPublishing}
                        onClick={() => handlePublishAsset(asset)}
                        disabled={!canPublish}
                        icon={<Share2 className="h-3.5 w-3.5" />}
                      >
                        {isGenerating
                          ? "Preparing image…"
                          : isPublishing
                          ? "Publishing…"
                          : pubState === "error" || asset.status === "failed"
                          ? "Retry publish"
                          : "Publish"}
                      </AnimatedButton>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function AssetCardImage({
  src,
  platform = "",
  isGenerating,
  isExecuting,
}: {
  src?: string | null;
  platform?: string;
  isGenerating: boolean;
  isExecuting: boolean;
}) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  if (isGenerating || (isExecuting && !src)) {
    return (
      <div className="relative h-52 w-full overflow-hidden rounded-lg border border-glass-border bg-glass-bg backdrop-blur-md">
        <Skeleton shimmer className="h-52 w-full" />
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2.5 p-4 text-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-full border border-primary/30 bg-primary/10 text-primary">
            <Share2 className="h-5 w-5 animate-pulse" />
          </div>
          <div>
            <span className="block font-mono text-xs font-semibold text-foreground">
              Generating creative asset…
            </span>
            <span className="mt-0.5 block font-mono text-[10px] text-muted">
              Rendering platform-sized visual payload
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (!src) return null;

  return (
    <div className="relative h-52 w-full overflow-hidden rounded-lg border border-border bg-panel">
      {!loaded && !error && (
        <div className="relative h-52 w-full">
          <Skeleton shimmer className="h-52 w-full" />
          <span className="absolute inset-0 flex items-center justify-center font-mono text-xs text-muted">
            Loading image…
          </span>
        </div>
      )}
      {error ? (
        <div className="flex h-52 w-full flex-col items-center justify-center gap-2 text-xs text-muted">
          <AlertTriangle className="h-4 w-4 text-amber-500" />
          <span>Image loading failed</span>
        </div>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt="Campaign creative"
          onLoad={() => setLoaded(true)}
          onError={() => setError(true)}
          className={`h-52 w-full object-cover transition-opacity duration-300 ${!loaded ? "opacity-0" : "opacity-100"}`}
        />
      )}
    </div>
  );
}

function Field({
  label,
  value,
  className = "",
}: {
  label: string;
  value?: string;
  className?: string;
}) {
  return (
    <div className={`bg-panel px-5 py-5 ${className}`}>
      <dt className="eyebrow">{label}</dt>
      <dd className="mt-2.5 text-sm leading-relaxed text-foreground">{value || "—"}</dd>
    </div>
  );
}

function MenuItem({
  icon,
  label,
  onClick,
  danger = false,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-left text-[13px] transition-colors hover:bg-surface ${
        danger ? "text-danger" : "text-foreground"
      }`}
    >
      <span className={danger ? "text-danger" : "text-muted"}>{icon}</span>
      <span>{label}</span>
    </button>
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
    { key: "planning", label: "Planning", agent: "Planner", desc: "Reading the product brief and drafting search intents" },
    { key: "researching", label: "Research", agent: "Research", desc: "Running SerpAPI queries across the market" },
    { key: "analyzing", label: "Analysis", agent: "Analyst", desc: "Filtering results into competitors and trends" },
    { key: "strategizing", label: "Strategy", agent: "Strategy", desc: "Forming positioning and messaging pillars" },
    { key: "generating_content", label: "Content", agent: "Content", desc: "Writing captions, hooks, and hashtags" },
    { key: "generating_images", label: "Creative", agent: "Creative", desc: "Rendering platform-sized visuals" },
    { key: "ready", label: "Ready", agent: "Complete", desc: "All deliverables generated" },
  ];

  const currentStageKey = execution?.stage || (status === "researching" ? "researching" : status === "running" ? "planning" : "idle");
  const isFailed = execution?.stage === "failed" || status === "failed";
  const isReady = execution?.stage === "ready" || (status !== "running" && status !== "researching" && !isFailed && execution);

  return (
    <section className="border-t border-border pt-8">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <span className="eyebrow">Pipeline</span>
          <h2 className="mt-2 font-heading text-base font-semibold text-foreground">
            {execution?.current_agent || (isFailed ? "Execution failed" : "Agent pipeline")}
          </h2>
          <p className="mt-1 text-xs text-muted">
            {execution?.current_message ||
              (isExecuting ? "Running stages in sequence." : "Idle — run the campaign to start.")}
          </p>
        </div>
        {isFailed && (
          <AnimatedButton variant="danger" size="sm" onClick={onRetry}>
            Retry from last stage
          </AnimatedButton>
        )}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7">
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
    </section>
  );
}
