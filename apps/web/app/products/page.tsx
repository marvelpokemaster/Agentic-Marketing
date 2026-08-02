import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { getServerRepo } from "@/lib/db/repo";
import { Package, Plus, ArrowRight } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { FrostText } from "@/components/ui/FrostText";

export const dynamic = "force-dynamic";

export default async function ProductsPage() {
  const user = await getCurrentUser();
  const repo = await getServerRepo();
  const products = await repo.listProducts(user.id);

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

      {products.length === 0 ? (
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
      ) : (
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
      )}
    </div>
  );
}
