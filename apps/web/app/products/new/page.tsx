"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Check, AlertTriangle } from "lucide-react";
import { AnimatedButton } from "@/components/ui/AnimatedButton";
import { SectionHeader } from "@/components/ui/SectionHeader";

const FILE_INPUT_CLASS =
  "w-full cursor-pointer text-xs text-muted file:mr-4 file:cursor-pointer file:rounded-md file:border file:border-border file:bg-surface file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-foreground";

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
    <div className="page max-w-[760px]">
      <Link
        href="/products"
        className="mb-8 inline-flex items-center gap-1.5 font-mono text-xs text-muted transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        <span>Products</span>
      </Link>

      <SectionHeader
        badge="Onboarding"
        title="Add a product"
        subtitle="Everything below becomes the brief the agents read from. The more specific it is, the better the research and copy."
      />

      <form onSubmit={onSubmit} className="space-y-8">
        <div className="space-y-5">
          <div>
            <label className="label">Product name *</label>
            <input
              name="name"
              className="input"
              placeholder="Acme Analytics Platform"
              required
              disabled={submitting}
            />
          </div>

          <div>
            <label className="label">Description</label>
            <textarea
              name="description"
              className="textarea h-24"
              placeholder="What the product does, who it's for, and the problem it solves."
              disabled={submitting}
            />
          </div>

          <div>
            <label className="label">Key features — one per line</label>
            <textarea
              name="features"
              className="textarea h-28 font-mono text-xs"
              placeholder={"Realtime event tracking\nMulti-touch attribution\nAutomated cohort reporting"}
              disabled={submitting}
            />
            <p className="mt-2 text-xs text-muted">Up to five features are used for copy generation.</p>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label className="label">Target audience</label>
              <input
                name="target_audience"
                className="input"
                placeholder="Growth marketers, developers"
                disabled={submitting}
              />
            </div>
            <div>
              <label className="label">Industry</label>
              <input
                name="industry"
                className="input"
                placeholder="Analytics / SaaS"
                disabled={submitting}
              />
            </div>
          </div>
        </div>

        <div className="grid gap-5 border-t border-border pt-8 md:grid-cols-2">
          <div>
            <label className="label">Logo</label>
            <input
              name="logo"
              type="file"
              accept="image/*"
              className={FILE_INPUT_CLASS}
              disabled={submitting}
            />
          </div>
          <div>
            <label className="label">Product imagery</label>
            <input
              name="images"
              type="file"
              accept="image/*"
              multiple
              className={FILE_INPUT_CLASS}
              disabled={submitting}
            />
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-md border border-danger bg-panel p-3 text-xs font-medium text-danger">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex items-center gap-3 border-t border-border pt-8">
          <AnimatedButton
            type="submit"
            isLoading={submitting}
            icon={<Check className="h-4 w-4" />}
          >
            Save and continue
          </AnimatedButton>

          <Link
            href="/products"
            className={`btn-ghost text-[13px] ${submitting ? "pointer-events-none opacity-50" : ""}`}
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
