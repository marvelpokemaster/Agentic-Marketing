import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { getServerRepo } from "@/lib/db/repo";
import { Package, Plus, Rocket, Calendar } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { EmptyState } from "@/components/ui/EmptyState";

export const dynamic = "force-dynamic";

export default async function ProductsPage() {
  const user = await getCurrentUser();
  const repo = await getServerRepo();
  const products = await repo.listProducts(user.id);

  return (
    <div className="space-y-8 relative z-10">
      <SectionHeader
        badge="Brand Knowledge Base"
        title="Product Profiles"
        subtitle="Manage product knowledge bases used by autonomous AI agents during campaign orchestration."
        action={
          <Link href="/products/new" className="btn text-xs py-2 flex items-center gap-1.5">
            <Plus className="h-4 w-4" />
            <span>Add New Product</span>
          </Link>
        }
      />

      {products.length === 0 ? (
        <EmptyState
          icon={<Package className="h-6 w-6 text-primary" />}
          title="No Products Onboarded Yet"
          description="Add your first brand or product profile to seed agent knowledge bases and generate platform-tailored social campaigns."
          action={
            <Link href="/products/new" className="btn text-xs py-2">
              Add Product Profile
            </Link>
          }
        />
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {products.map((p) => (
            <Card key={p.id} interactive className="flex flex-col justify-between group space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  {p.logo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={p.logo_url}
                      alt={p.name}
                      className="h-11 w-11 rounded-lg object-cover border border-border bg-surface shadow-sm"
                    />
                  ) : (
                    <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 border border-primary/30 text-sm font-bold text-primary">
                      {p.name.slice(0, 1).toUpperCase()}
                    </div>
                  )}
                  <div className="truncate">
                    <h4 className="font-heading font-bold text-foreground group-hover:text-primary transition duration-200 truncate">
                      {p.name}
                    </h4>
                    <span className="font-mono text-[10px] text-muted block uppercase tracking-wider">
                      {p.industry || "General Industry"}
                    </span>
                  </div>
                </div>

                <p className="font-sans text-xs text-muted leading-relaxed line-clamp-3 min-h-[54px]">
                  {p.description}
                </p>

                {p.features && p.features.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {p.features.slice(0, 3).map((f) => (
                      <span key={f} className="font-mono text-[10px] bg-surface text-foreground border border-border py-0.5 px-2 rounded">
                        {f}
                      </span>
                    ))}
                    {p.features.length > 3 && (
                      <span className="font-mono text-[10px] bg-surface text-muted border border-border/40 py-0.5 px-2 rounded">
                        +{p.features.length - 3} more
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-border/40 flex items-center justify-between gap-3">
                <span className="font-mono text-[10px] text-muted flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {p.created_at ? new Date(p.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric" }) : "Recent"}
                </span>

                <Link
                  href={`/products/${p.id}/generate`}
                  className="btn text-xs px-3.5 py-1.5 flex items-center gap-1.5"
                >
                  <Rocket className="h-3.5 w-3.5" />
                  <span>Launch Campaign</span>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
