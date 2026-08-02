import { Skeleton } from "@/components/ui/Skeleton";
import { Plus, ArrowRight } from "lucide-react";

export default function ProductsLoading() {
  return (
    <div className="page space-y-10">
      <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-start">
        <div>
          <span className="eyebrow">Knowledge base</span>
          <div className="mt-3">
            <h1 className="text-3xl font-semibold sm:text-4xl font-heading text-foreground">
              Product <span className="gradient-text">Briefs</span>
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-muted max-w-lg">
              Each product profile seeds the multi-agent system with audience, positioning, and brand guidelines.
            </p>
          </div>
        </div>

        <div className="btn text-[13px] shrink-0 opacity-50 cursor-not-allowed">
          <Plus className="h-4 w-4" />
          <span>New product</span>
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="group card flex flex-col justify-between p-6 backdrop-blur-md opacity-80">
            <div>
              <div className="flex items-center gap-3">
                <Skeleton className="h-11 w-11 shrink-0 rounded-xl" shimmer />
                <div className="min-w-0 space-y-2 flex-1">
                  <Skeleton className="h-4 w-3/4" shimmer />
                  <Skeleton className="h-2.5 w-1/3" shimmer />
                </div>
              </div>

              <div className="mt-4 space-y-2">
                <Skeleton className="h-3 w-full" shimmer />
                <Skeleton className="h-3 w-5/6" shimmer />
                <Skeleton className="h-3 w-2/3" shimmer />
              </div>

              <div className="mt-4 flex flex-wrap gap-1.5">
                <Skeleton className="h-5 w-16 rounded-full" shimmer />
                <Skeleton className="h-5 w-20 rounded-full" shimmer />
                <Skeleton className="h-5 w-14 rounded-full" shimmer />
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between gap-3 border-t border-border pt-4">
              <Skeleton className="h-3 w-16" shimmer />
              <div className="inline-flex items-center gap-1.5 text-[13px] font-medium text-primary/50">
                <span>New campaign</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
