import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getServerRepo } from "@/lib/db/repo";
import { GenerateForm } from "@/components/GenerateForm";
import { ArrowLeft, Users, Package } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { SectionHeader } from "@/components/ui/SectionHeader";

export const dynamic = "force-dynamic";

export default async function GenerateCampaignPage({
  params,
}: {
  params: { id: string };
}) {
  const user = await getCurrentUser();
  const repo = await getServerRepo();
  const product = await repo.getProduct(user.id, params.id);
  if (!product) notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-6 relative z-10">
      <div>
        <Link href="/products" className="font-mono text-xs text-primary hover:underline flex items-center gap-1.5 transition">
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Product Profiles</span>
        </Link>
      </div>

      <SectionHeader
        badge="Mission Config"
        title="Launch AI Campaign Stream"
        subtitle={`Configure campaign parameters for ${product.name}.`}
      />

      {/* Product Scope Summary */}
      <Card className="space-y-3 bg-surface/40">
        <div className="flex items-center justify-between border-b border-border/40 pb-2">
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-primary" />
            <h4 className="font-heading text-sm font-bold text-slate-100">{product.name}</h4>
          </div>
          {product.industry && (
            <span className="font-mono text-[10px] bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded font-semibold uppercase">
              {product.industry}
            </span>
          )}
        </div>
        <p className="font-sans text-xs text-muted/80 leading-relaxed">
          {product.description || "No description provided."}
        </p>

        {product.target_audience && (
          <div className="pt-2 border-t border-border/30 font-mono text-[11px] text-muted/70 flex items-center gap-2">
            <Users className="h-3.5 w-3.5 text-primary" />
            <span>Target Persona: <strong className="text-slate-200">{product.target_audience}</strong></span>
          </div>
        )}
      </Card>

      <GenerateForm productId={product.id} defaultAudience={product.target_audience || ""} />
    </div>
  );
}
