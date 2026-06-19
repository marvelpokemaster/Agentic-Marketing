import Link from "next/link";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { isMetaConfigured } from "@/lib/meta/config";

const steps = [
  {
    title: "1. Add your product",
    detail: "Name, description, features, audience, industry, plus images and logo.",
  },
  {
    title: "2. Pick platforms",
    detail: "Instagram, Facebook, and LinkedIn — choose where you want to post.",
  },
  {
    title: "3. Generate campaign",
    detail: "AI writes captions, hashtags, and post copy with matching creatives.",
  },
  {
    title: "4. Review & publish",
    detail: "Edit anything, then publish or schedule directly to Meta platforms.",
  },
];

export default function HomePage() {
  const supabase = isSupabaseConfigured();
  const meta = isMetaConfigured();

  return (
    <div className="space-y-10">
      <section className="space-y-4">
        <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl">
          Upload a product. Generate a campaign. Publish to social.
        </h1>
        <p className="max-w-2xl text-muted">
          A focused MVP: turn product details and images into ready-to-post
          Instagram, Facebook, and LinkedIn content, then publish or schedule to
          Instagram and Facebook via the Meta Graph API.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link href="/products/new" className="btn">
            Add a product
          </Link>
          <Link href="/campaigns" className="btn-ghost">
            View campaigns
          </Link>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {steps.map((s) => (
          <div key={s.title} className="card">
            <h3 className="font-semibold">{s.title}</h3>
            <p className="mt-2 text-sm text-muted">{s.detail}</p>
          </div>
        ))}
      </section>

      <section className="card">
        <h2 className="text-lg font-bold">Environment status</h2>
        <p className="mt-1 text-sm text-muted">
          The app runs in demo mode until you connect Supabase and Meta.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <span className={`chip ${supabase ? "chip-on" : ""}`}>
            Supabase: {supabase ? "connected" : "demo mode"}
          </span>
          <span className={`chip ${meta ? "chip-on" : ""}`}>
            Meta publishing: {meta ? "configured" : "not configured"}
          </span>
        </div>
        {!supabase && (
          <p className="mt-3 text-xs text-muted">
            Without Supabase, products and campaigns are stored in memory for the
            current server session. Set <code>NEXT_PUBLIC_SUPABASE_URL</code> and
            keys in <code>.env</code> to persist data.
          </p>
        )}
      </section>
    </div>
  );
}
