import Link from "next/link";
import { Suspense } from "react";
import { getCurrentUser } from "@/lib/auth";
import { getServerRepo } from "@/lib/db/repo";
import { Package, Plus, ArrowRight } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { FrostText } from "@/components/ui/FrostText";
import { Skeleton } from "@/components/ui/Skeleton";

export const dynamic = "force-dynamic";

function ProductsGridSkeleton() {
  return (
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
  );
}

async function ProductsList() {
  const start = Date.now();
  console.log(`[PRODUCTS DEBUG] ProductsList fetch started at ${start}`);
  const user = await getCurrentUser();
  const repo = await getServerRepo();
  const products = await repo.listProducts(user.id);
  console.log(`[PRODUCTS DEBUG] ProductsList fetch completed in ${Date.now() - start}ms`);

  if (products.length === 0) {
    return (
      <EmptyState
        icon={<Package className="h-7 w-7" />}
        title="No products yet"
        description="Add a product to seed the agents with a name, description, features, industry, and audience."
        action={
          <Link href="/products/new" className="btn text-[13px]">
            Add a product
          </Link>
        }
      />
    );
  }

  return (
    <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
      {products.map((p) => (
        <div key={p.id} className="group card card-interactive flex flex-col justify-between p-6 backdrop-blur-md">
          <div>
            <div className="flex items-center gap-3">
              {p.logo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={p.logo_url}
                  alt={p.name}
                  className="h-11 w-11 shrink-0 rounded-xl border border-border object-cover"
                />
              ) : (
                <div
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-primary/20 font-heading text-sm font-bold text-primary"
                  style={{ background: "var(--gradient-glow)" }}
                >
                  {p.name.slice(0, 1).toUpperCase()}
                </div>
              )}
              <div className="min-w-0">
                <h3 className="truncate font-heading text-[15px] font-semibold text-foreground">
                  {p.name}
                </h3>
                <span className="mt-0.5 block truncate font-mono text-[10px] uppercase tracking-wider text-muted">
                  {p.industry || "General"}
                </span>
              </div>
            </div>

            <p className="mt-4 line-clamp-3 min-h-[57px] text-sm leading-relaxed text-muted">
              {p.description}
            </p>

            {p.features && p.features.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-1.5">
                {p.features.slice(0, 3).map((f) => (
                  <span key={f} className="chip">
                    {f}
                  </span>
                ))}
                {p.features.length > 3 && (
                  <span className="chip">+{p.features.length - 3}</span>
                )}
              </div>
            )}
          </div>

          <div className="mt-6 flex items-center justify-between gap-3 border-t border-border pt-4">
            <span className="font-mono text-[10px] uppercase tracking-wider text-muted">
              {p.created_at
                ? new Date(p.created_at).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                  })
                : "Recent"}
            </span>

            <Link
              href={`/products/${p.id}/generate`}
              className="inline-flex items-center gap-1.5 text-[13px] font-medium text-primary transition-all hover:gap-2.5"
            >
              <span>New campaign</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function ProductsPage() {
  return (
    <div className="page space-y-10">
      <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-start">
        <div>
          <span className="eyebrow">Knowledge base</span>
          <div className="mt-3">
            <FrostText
              text="Product"
              highlightText="Briefs"
              as="h1"
              className="text-3xl font-semibold sm:text-4xl"
              subtitle="Each product profile seeds the multi-agent system with audience, positioning, and brand guidelines."
            />
          </div>
        </div>

        <Link href="/products/new" className="btn text-[13px] shrink-0">
          <Plus className="h-4 w-4" />
          <span>New product</span>
        </Link>
      </div>

      <Suspense fallback={<ProductsGridSkeleton />}>
        <ProductsList />
      </Suspense>
    </div>
  );
}
