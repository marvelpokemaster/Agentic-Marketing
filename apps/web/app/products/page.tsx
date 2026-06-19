import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { getRepo } from "@/lib/db/repo";

export const dynamic = "force-dynamic";

export default async function ProductsPage() {
  const user = await getCurrentUser();
  const products = await getRepo().listProducts(user.id);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Products</h1>
          <p className="text-muted">Your product knowledge base.</p>
        </div>
        <Link href="/products/new" className="btn">
          New product
        </Link>
      </div>

      {products.length === 0 ? (
        <div className="card text-center text-muted">
          No products yet. Add your first product to generate a campaign.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {products.map((p) => (
            <div key={p.id} className="card flex flex-col gap-3">
              <div className="flex items-center gap-3">
                {p.logo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={p.logo_url}
                    alt={p.name}
                    className="h-10 w-10 rounded-lg object-cover"
                  />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface text-sm font-bold">
                    {p.name.slice(0, 1).toUpperCase()}
                  </div>
                )}
                <div>
                  <h3 className="font-semibold">{p.name}</h3>
                  <p className="text-xs text-muted">{p.industry || "—"}</p>
                </div>
              </div>
              <p className="line-clamp-3 text-sm text-muted">{p.description}</p>
              <div className="flex flex-wrap gap-1">
                {p.features.slice(0, 3).map((f) => (
                  <span key={f} className="chip">
                    {f}
                  </span>
                ))}
              </div>
              <div className="mt-auto flex gap-2 pt-2">
                <Link
                  href={`/products/${p.id}/generate`}
                  className="btn btn-sm flex-1"
                >
                  Generate campaign
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
