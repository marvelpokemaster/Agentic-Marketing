import { Skeleton } from "@/components/ui/Skeleton";
import { ArrowLeft } from "lucide-react";
import { SectionHeader } from "@/components/ui/SectionHeader";

export default function ProductGenerateLoading() {
  return (
    <div className="page max-w-[860px]">
      <div className="mb-8 inline-flex items-center gap-1.5 font-mono text-xs text-muted opacity-50 cursor-not-allowed">
        <ArrowLeft className="h-3.5 w-3.5" />
        <span>Products</span>
      </div>

      <SectionHeader
        badge="New campaign"
        title="Loading product..."
        subtitle="Choose what the agents should produce. Everything after this runs on its own."
      />

      <dl className="mb-10 grid gap-px border border-border bg-border sm:grid-cols-2 opacity-80">
        <div className="bg-panel px-5 py-4">
          <dt className="eyebrow">Industry</dt>
          <dd className="mt-2">
            <Skeleton className="h-4 w-24" shimmer />
          </dd>
        </div>
        <div className="bg-panel px-5 py-4">
          <dt className="eyebrow">Target audience</dt>
          <dd className="mt-2">
            <Skeleton className="h-4 w-32" shimmer />
          </dd>
        </div>
        <div className="bg-panel px-5 py-4 sm:col-span-2">
          <dt className="eyebrow">Description</dt>
          <dd className="mt-2 space-y-2">
            <Skeleton className="h-4 w-full" shimmer />
            <Skeleton className="h-4 w-5/6" shimmer />
            <Skeleton className="h-4 w-2/3" shimmer />
          </dd>
        </div>
      </dl>

      <div>
        <div className="flex gap-8 border-b border-border">
          {["Organic social", "Lead generation"].map((tab, i) => (
            <div
              key={i}
              className={`relative -mb-px pb-3 text-[13px] font-medium transition-colors ${
                i === 0 ? "text-foreground" : "text-muted"
              }`}
            >
              {tab}
              {i === 0 && (
                <span
                  className="absolute bottom-0 left-0 h-[2px] w-full rounded-full"
                  style={{ background: "var(--gradient-primary)" }}
                />
              )}
            </div>
          ))}
        </div>

        <div className="py-8 opacity-80">
          <div>
            <h3 className="font-heading text-base font-semibold text-foreground">
              Target platforms
            </h3>
            <p className="prose-col mt-2 text-sm leading-relaxed text-muted">
              The content agent writes a separate headline, caption, CTA, and hashtag set
              for each platform you select.
            </p>

            <div className="mt-6 flex flex-wrap gap-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-[42px] w-[120px] rounded-xl" shimmer />
              ))}
            </div>
          </div>
        </div>

        <div className="border-t border-border pt-8">
          <Skeleton className="h-11 w-36 rounded-xl" shimmer />
        </div>
      </div>
    </div>
  );
}
