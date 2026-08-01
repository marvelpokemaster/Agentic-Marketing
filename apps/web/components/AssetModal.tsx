"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ExternalLink, CheckCircle2, Share2 } from "lucide-react";
import { PLATFORM_LABELS, type CampaignAsset } from "@/lib/types";
import { StatusBadge } from "./ui/StatusBadge";
import { AnimatedButton } from "./ui/AnimatedButton";

interface AssetModalProps {
  asset: CampaignAsset | null;
  onClose: () => void;
  onPublish?: (asset: CampaignAsset) => void;
  metaConfigured?: boolean;
}

export function AssetModal({ asset, onClose, onPublish, metaConfigured }: AssetModalProps) {
  if (!asset) return null;

  const isPublished = asset.status === "published";

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-10">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-ink/70"
        />

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 12 }}
          transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
          className="panel relative z-10 max-h-[90vh] w-full max-w-4xl overflow-y-auto p-6 md:p-8"
        >
          {/* Header */}
          <div className="flex items-center justify-between gap-4 border-b border-border pb-5">
            <div className="flex items-center gap-2.5">
              <span className="font-mono text-[11px] font-medium uppercase tracking-wider text-foreground">
                {PLATFORM_LABELS[asset.platform] || asset.platform}
              </span>
              <StatusBadge status={asset.status} size="sm" />
            </div>

            <button
              onClick={onClose}
              className="rounded-md border border-border p-1.5 text-muted transition-colors hover:border-border-hover hover:text-foreground"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Body */}
          <div className="grid items-start gap-8 py-7 md:grid-cols-2">
            {asset.creative_url ? (
              <div>
                <span className="label">Creative</span>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={asset.creative_url}
                  alt="Campaign creative"
                  className="h-80 w-full rounded-md border border-border object-cover"
                />
              </div>
            ) : (
              <div className="flex h-80 w-full items-center justify-center rounded-md border border-dashed border-border text-xs text-muted">
                No creative attached
              </div>
            )}

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
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5 text-xs font-medium text-success">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Published
                </span>
                {asset.published_url && (
                  <a
                    href={asset.published_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-medium text-primary transition-opacity hover:opacity-70"
                  >
                    <span>View post</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                )}
              </div>
            ) : (
              onPublish && (
                <AnimatedButton
                  variant="primary"
                  onClick={() => onPublish(asset)}
                  disabled={!metaConfigured}
                  icon={<Share2 className="h-4 w-4" />}
                >
                  Publish to {PLATFORM_LABELS[asset.platform] || asset.platform}
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
