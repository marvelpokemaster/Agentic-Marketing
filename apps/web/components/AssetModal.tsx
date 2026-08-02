"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ExternalLink, CheckCircle2, Share2 } from "lucide-react";
import { PLATFORM_LABELS, getPublishedLinkInfo, type CampaignAsset } from "@/lib/types";
import { StatusBadge } from "./ui/StatusBadge";
import { AnimatedButton } from "./ui/AnimatedButton";
import { Skeleton } from "./ui/Skeleton";

interface AssetModalProps {
  asset: CampaignAsset | null;
  onClose: () => void;
  onPublish?: (asset: CampaignAsset) => void;
  metaConfigured?: boolean;
}

export function AssetModal({ asset, onClose, onPublish, metaConfigured }: AssetModalProps) {
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);

  if (!asset) return null;

  const isGenerating = (asset.status as string) === "generating";
  const isPublishing = asset.status === "publishing";
  const isPublished = asset.status === "published";
  const canPublish = metaConfigured && !!asset.creative_url && !isGenerating && !isPublishing && !isPublished;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-10">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-bg-deeper/80 backdrop-blur-lg"
        />

        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.98 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="panel relative z-10 max-h-[90vh] w-full max-w-4xl overflow-y-auto p-6 backdrop-blur-xl md:p-8"
        >
          {/* Gradient top accent */}
          <div
            className="absolute top-0 left-6 right-6 h-[2px] rounded-full"
            style={{ background: "var(--gradient-primary)" }}
          />

          {/* Header */}
          <div className="flex items-center justify-between gap-4 border-b border-border pb-5 pt-2">
            <div className="flex items-center gap-2.5">
              <span className="font-mono text-[11px] font-medium uppercase tracking-wider text-foreground">
                {PLATFORM_LABELS[asset.platform] || asset.platform}
              </span>
              <StatusBadge status={isGenerating ? "generating" : asset.status} size="sm" />
            </div>

            <button
              onClick={onClose}
              className="rounded-xl border border-border p-2 text-muted transition-all hover:border-border-hover hover:text-foreground hover:shadow-glow"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Body */}
          <div className="grid items-start gap-8 py-7 md:grid-cols-2">
            <div>
              <span className="label">Creative</span>
              {isGenerating ? (
                <div className="relative h-80 w-full overflow-hidden rounded-xl border border-glass-border bg-glass-bg backdrop-blur-md">
                  <Skeleton shimmer className="h-80 w-full" />
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary">
                      <Share2 className="h-6 w-6 animate-pulse" />
                    </div>
                    <div>
                      <span className="block font-mono text-sm font-semibold text-foreground">
                        Rendering creative image…
                      </span>
                      <span className="mt-1 block font-mono text-xs text-muted">
                        Generative AI model is creating platform payload
                      </span>
                    </div>
                  </div>
                </div>
              ) : asset.creative_url ? (
                <div className="relative h-80 w-full overflow-hidden rounded-xl border border-border bg-panel">
                  {!imgLoaded && !imgError && <Skeleton shimmer className="h-80 w-full" />}
                  {imgError ? (
                    <div className="flex h-80 w-full items-center justify-center text-xs text-muted">
                      Image failed to load
                    </div>
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={asset.creative_url}
                      alt="Campaign creative"
                      onLoad={() => setImgLoaded(true)}
                      onError={() => setImgError(true)}
                      className={`h-80 w-full object-cover transition-opacity duration-300 ${!imgLoaded ? "opacity-0" : "opacity-100"}`}
                    />
                  )}
                </div>
              ) : (
                <div className="flex h-80 w-full items-center justify-center rounded-xl border border-dashed border-border text-xs text-muted">
                  No creative attached
                </div>
              )}
            </div>

            <div className="space-y-6">
              {asset.headline && (
                <div>
                  <span className="label">Headline</span>
                  <h2 className="font-heading text-xl font-semibold tracking-tight text-foreground">
                    {asset.headline}
                  </h2>
                </div>
              )}

              <div>
                <span className="label">Caption</span>
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                  {asset.body}
                </p>
              </div>

              {asset.hashtags?.length > 0 && (
                <div>
                  <span className="label">Hashtags</span>
                  <div className="flex flex-wrap gap-1.5">
                    {asset.hashtags.map((tag: string, i: number) => (
                      <span key={i} className="chip">
                        #{tag.replace(/^#/, "")}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between gap-4 border-t border-border pt-5">
            {isPublished ? (
              (() => {
                const linkInfo = getPublishedLinkInfo(asset);
                return (
                  <div className="flex items-center gap-4">
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
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </div>
                );
              })()
            ) : (
              onPublish && (
                <AnimatedButton
                  variant="primary"
                  onClick={() => onPublish(asset)}
                  isLoading={isPublishing}
                  disabled={!canPublish}
                  icon={<Share2 className="h-4 w-4" />}
                >
                  {isGenerating
                    ? "Preparing image…"
                    : isPublishing
                    ? "Publishing…"
                    : `Publish to ${PLATFORM_LABELS[asset.platform] || asset.platform}`}
                </AnimatedButton>
              )
            )}

            <button onClick={onClose} className="btn-ghost text-[13px]">
              Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
