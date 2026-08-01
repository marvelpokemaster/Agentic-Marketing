import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getServerRepo } from "@/lib/db/repo";
import { GenerateForm } from "@/components/GenerateForm";
import { ArrowLeft } from "lucide-react";
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
    <div className="page max-w-[860px]">
      <Link
        href="/products"
        className="mb-8 inline-flex items-center gap-1.5 font-mono text-xs text-muted transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        <span>Products</span>
      </Link>

      <SectionHeader
        badge="New campaign"
        title={product.name}
        subtitle="Choose what the agents should produce. Everything after this runs on its own."
      />

      {/* Brief summary */}
      <dl className="mb-10 grid gap-px border border-border bg-border sm:grid-cols-2">
        <div className="bg-panel px-5 py-4">
          <dt className="eyebrow">Industry</dt>
          <dd className="mt-2 text-sm text-foreground">{product.industry || "Not set"}</dd>
        </div>
        <div className="bg-panel px-5 py-4">
          <dt className="eyebrow">Target audience</dt>
          <dd className="mt-2 text-sm text-foreground">
            {product.target_audience || "Not set"}
          </dd>
        </div>
        <div className="bg-panel px-5 py-4 sm:col-span-2">
          <dt className="eyebrow">Description</dt>
          <dd className="mt-2 text-sm leading-relaxed text-muted">
            {product.description || "No description provided."}
          </dd>
        </div>
      </dl>

      <GenerateForm productId={product.id} />
    </div>
  );
}
