"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Check, AlertTriangle } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { AnimatedButton } from "@/components/ui/AnimatedButton";
import { SectionHeader } from "@/components/ui/SectionHeader";

export default function NewProductPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const formData = new FormData(e.currentTarget);
      const res = await fetch("/api/products", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create product");
      router.push(`/products/${data.product.id}/generate`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 relative z-10">
      <div>
        <Link href="/products" className="font-mono text-xs text-primary hover:underline flex items-center gap-1.5 transition">
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Product Profiles</span>
        </Link>
      </div>

      <SectionHeader
        badge="Brand Onboarding"
        title="Add Product Profile"
        subtitle="Seed the AI agent knowledge base with product positioning, feature highlights, and target niches."
      />

      <Card>
        <form onSubmit={onSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <label className="label">Product Name *</label>
              <input name="name" className="input font-heading text-base font-semibold" placeholder="e.g. Acme Analytics Platform" required disabled={submitting} />
            </div>

            <div>
              <label className="label">Product Overview</label>
              <textarea
                name="description"
                className="textarea h-24"
                placeholder="Detail what the product does, its core value proposition, and primary target problems solved."
                disabled={submitting}
              />
            </div>

            <div>
              <label className="label">Key Feature Highlights (One per line)</label>
              <textarea
                name="features"
                className="textarea h-28 font-mono text-xs"
                placeholder={"e.g.\nRealtime event tracking\nCustom multi-touch attribution\nAutomated cohort reporting"}
                disabled={submitting}
              />
              <p className="font-mono text-[10px] text-muted mt-1">Provide up to 5 feature highlights to drive copy generation.</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="label">Target Audience Persona</label>
                <input
                  name="target_audience"
                  className="input"
                  placeholder="e.g. Growth Marketers, Developers"
                  disabled={submitting}
                />
              </div>
              <div>
                <label className="label">Industry / Niche</label>
                <input name="industry" className="input" placeholder="e.g. Analytics / SaaS" disabled={submitting} />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 pt-3 border-t border-border/40">
              <div>
                <label className="label">Brand Logo Asset</label>
                <input
                  name="logo"
                  type="file"
                  accept="image/*"
                  className="w-full text-xs text-muted file:mr-4 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-surface file:text-foreground hover:file:bg-border/60 transition cursor-pointer"
                  disabled={submitting}
                />
              </div>
              <div>
                <label className="label">Product Screenshots / Media</label>
                <input
                  name="images"
                  type="file"
                  accept="image/*"
                  multiple
                  className="w-full text-xs text-muted file:mr-4 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-surface file:text-foreground hover:file:bg-border/60 transition cursor-pointer"
                  disabled={submitting}
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-xs font-medium text-rose-500 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex items-center gap-3 pt-4 border-t border-border/40">
            <AnimatedButton type="submit" isLoading={submitting} icon={<Check className="h-4 w-4" />}>
              Save & Continue
            </AnimatedButton>
            
            <Link href="/products" className={`btn-ghost text-xs px-4 py-2.5 ${submitting ? 'pointer-events-none opacity-50' : ''}`}>
              Cancel
            </Link>
          </div>
        </form>
      </Card>
    </div>
  );
}
