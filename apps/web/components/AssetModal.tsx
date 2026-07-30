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
        {/* Backdrop blur overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/80 backdrop-blur-xl"
        />

        {/* Floating Glass Showcase Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: "spring", stiffness: 350, damping: 25 }}
          className="relative z-10 w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl border border-primary/30 bg-panel/95 p-6 md:p-8 shadow-2xl space-y-6"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border/40 pb-4">
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs font-bold uppercase tracking-widest text-primary bg-primary/10 border border-primary/20 px-3 py-1 rounded-md">
                {PLATFORM_LABELS[asset.platform] || asset.platform}
              </span>
              <StatusBadge status={asset.status} />
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-surface/60 border border-border/60 text-muted hover:text-slate-100 transition"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Asset Body Grid */}
          <div className="grid gap-6 md:grid-cols-2 items-start">
            {/* Visual Creative Left */}
            {asset.creative_url ? (
              <div className="space-y-2">
                <span className="label">Rendered Visual Creative</span>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={asset.creative_url}
                  alt="Campaign Creative Showcase"
                  className="w-full h-80 object-cover rounded-xl border border-border/60 shadow-2xl"
                />
              </div>
            ) : (
              <div className="h-80 w-full rounded-xl bg-surface/40 border border-border/40 flex items-center justify-center text-xs text-muted">
                No visual creative asset attached
              </div>
            )}

            {/* Copy Content Right */}
            <div className="space-y-4">
              {asset.headline && (
                <div>
                  <span className="label">Headline Hook</span>
                  <h3 className="font-heading text-xl font-bold text-slate-100">{asset.headline}</h3>
                </div>
              )}

              <div>
                <span className="label">Caption Copy</span>
                <p className="font-sans text-xs text-slate-200 leading-relaxed bg-surface/60 p-4 rounded-xl border border-border/40 whitespace-pre-wrap">
                  {asset.body}
                </p>
              </div>

              {asset.hashtags?.length > 0 && (
                <div>
                  <span className="label">Hashtag Vector Stack</span>
                  <div className="flex flex-wrap gap-1.5">
                    {asset.hashtags.map((tag: string, i: number) => (
                      <span key={i} className="font-mono text-xs text-primary bg-primary/10 px-2.5 py-1 rounded-md border border-primary/20">
                        #{tag.replace(/^#/, "")}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Modal Footer Actions */}
          <div className="pt-4 border-t border-border/40 flex items-center justify-between">
            {isPublished ? (
              <div className="flex items-center gap-3">
                <span className="font-sans text-xs text-emerald-400 font-semibold flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4" />
                  Published & Verified on Meta
                </span>
                {asset.published_url && (
                  <a
                    href={asset.published_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-sans text-xs text-primary hover:underline font-semibold flex items-center gap-1"
                  >
                    <span>View Live Post</span>
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
                  Publish Asset to {PLATFORM_LABELS[asset.platform] || asset.platform}
                </AnimatedButton>
              )
            )}

            <button
              onClick={onClose}
              className="btn-ghost text-xs px-4 py-2"
            >
              Close Preview
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
