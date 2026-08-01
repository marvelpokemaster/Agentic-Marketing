import Link from "next/link";
import { firebaseConfig } from "@/lib/firebase/config";
import { ArrowRight } from "lucide-react";
import { CodePanel, type CodeLine } from "@/components/ui/CodePanel";
import { StatRow } from "@/components/ui/StatRow";

const BACKEND_API_URL = process.env.BACKEND_API_URL || "http://localhost:8000";

async function isMetaConfiguredOnBackend(): Promise<boolean> {
  try {
    const res = await fetch(
      `${BACKEND_API_URL.replace(/\/$/, "")}/publish/status`,
      { cache: "no-store" },
    );
    if (!res.ok) return false;
    const data = await res.json();
    return data.configured === true;
  } catch {
    return false;
  }
}

const HERO_LOG: CodeLine[] = [
  { tone: "comment", text: "# One product brief in. A published campaign out." },
  { tone: "command", text: "campaign run --workflow organic" },
  { tone: "dim", text: "" },
  { tone: "ok", text: "✓ planning       5 search intents drafted", meta: "1.2s" },
  { tone: "ok", text: "✓ researching    SerpAPI · 5 queries", meta: "8.4s" },
  { tone: "ok", text: "✓ analyzing      competitors, trends, audience", meta: "3.1s" },
  { tone: "ok", text: "✓ strategizing   positioning + messaging pillars", meta: "4.7s" },
  { tone: "ok", text: "✓ content        captions, hashtags, CTAs", meta: "6.0s" },
  { tone: "ok", text: "✓ creatives      platform-sized visuals", meta: "9.3s" },
  { tone: "dim", text: "" },
  { tone: "output", text: "campaign ready — 3 assets awaiting review" },
];

const STATS = [
  {
    value: "6",
    label: "Agents",
    detail: "Planner, research, analyst, strategy, content, creative.",
  },
  {
    value: "1",
    label: "Click to run",
    detail: "Every downstream stage triggers the one after it.",
  },
  {
    value: "3",
    label: "Channels",
    detail: "Instagram, Facebook, and LinkedIn copy per campaign.",
  },
  {
    value: "0",
    label: "Manual steps",
    detail: "No database edits, no hand-run tools between stages.",
  },
];

const STAGES = [
  {
    step: "01",
    title: "Describe the product once",
    detail:
      "Name, description, features, industry, target audience, and imagery. This brief is the only thing every downstream agent reads from.",
  },
  {
    step: "02",
    title: "Pick a campaign type",
    detail:
      "Organic runs the full loop through publishing. Content-only stops after assets. Lead generation finds, scores, and drafts outreach instead.",
  },
  {
    step: "03",
    title: "Agents run in sequence",
    detail:
      "Research feeds planning, planning feeds content, content feeds creatives. Each stage writes its result to the campaign record before handing off.",
  },
  {
    step: "04",
    title: "Review, then publish",
    detail:
      "Edit any caption or regenerate any image, then publish straight to Instagram and Facebook through the Meta Graph API.",
  },
];

export default async function HomePage() {
  const firebase = Boolean(firebaseConfig.projectId);
  const meta = await isMetaConfiguredOnBackend();

  return (
    <div>
      {/* HERO */}
      <section className="border-b border-border">
        <div className="mx-auto w-full max-w-[1180px] px-6 py-20 md:px-10 md:py-28">
          <div className="grid items-center gap-14 lg:grid-cols-[1fr_1.05fr]">
            <div>
              <span className="eyebrow">Autonomous marketing platform</span>

              <h1 className="mt-5 font-heading text-4xl font-semibold leading-[1.08] tracking-tight text-foreground sm:text-5xl lg:text-[3.4rem]">
                Give it a product.
                <br />
                Get back a campaign.
              </h1>

              <p className="prose-col mt-6 text-base leading-relaxed text-muted">
                A multi-agent system that researches your market, writes the strategy,
                drafts the copy, renders the creatives, and publishes to Meta — end to
                end, from a single brief.
              </p>

              <div className="mt-9 flex flex-wrap items-center gap-3">
                <Link href="/products/new" className="btn btn-lg">
                  <span>Add a product</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="/campaigns" className="btn-ghost px-6 py-3 text-[15px]">
                  View campaigns
                </Link>
              </div>
            </div>

            <CodePanel title="campaign · organic" lines={HERO_LOG} />
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="border-b border-border">
        <div className="mx-auto w-full max-w-[1180px] px-6 md:px-10">
          <StatRow stats={STATS} />
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="border-b border-border">
        <div className="mx-auto w-full max-w-[1180px] px-6 py-20 md:px-10 md:py-24">
          <span className="eyebrow">How it works</span>
          <h2 className="mt-4 max-w-2xl font-heading text-3xl font-semibold tracking-tight text-foreground">
            Four steps, and only two of them are yours.
          </h2>

          <div className="mt-14">
            {STAGES.map((s) => (
              <div
                key={s.step}
                className="grid gap-4 border-t border-border py-8 md:grid-cols-[80px_1fr_1.3fr] md:gap-10 md:py-10"
              >
                <span className="font-mono text-xs text-muted">{s.step}</span>
                <h3 className="font-heading text-lg font-semibold tracking-tight text-foreground">
                  {s.title}
                </h3>
                <p className="text-sm leading-relaxed text-muted">{s.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* INTEGRATIONS */}
      <section>
        <div className="mx-auto w-full max-w-[1180px] px-6 py-20 md:px-10 md:py-24">
          <span className="eyebrow">Integrations</span>
          <h2 className="mt-4 font-heading text-3xl font-semibold tracking-tight text-foreground">
            Connected services
          </h2>
          <p className="prose-col mt-4 text-sm leading-relaxed text-muted">
            Live status for the two external systems a campaign depends on. Both are
            checked on page load.
          </p>

          <div className="mt-10 grid gap-px border border-border bg-border sm:grid-cols-2">
            <IntegrationRow
              name="Firebase"
              detail="Campaign and product persistence"
              ok={firebase}
              okLabel="Connected"
              offLabel="Not configured"
            />
            <IntegrationRow
              name="Meta Graph API"
              detail="Instagram and Facebook publishing"
              ok={meta}
              okLabel="Configured"
              offLabel="Not configured"
            />
          </div>
        </div>
      </section>
    </div>
  );
}

function IntegrationRow({
  name,
  detail,
  ok,
  okLabel,
  offLabel,
}: {
  name: string;
  detail: string;
  ok: boolean;
  okLabel: string;
  offLabel: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 bg-panel px-5 py-5">
      <div className="min-w-0">
        <span className="block text-sm font-medium text-foreground">{name}</span>
        <span className="mt-0.5 block text-xs text-muted">{detail}</span>
      </div>
      <span
        className={`inline-flex shrink-0 items-center gap-2 font-mono text-[11px] uppercase tracking-wider ${
          ok ? "text-success" : "text-muted"
        }`}
      >
        <span
          className={`h-1.5 w-1.5 rounded-full ${ok ? "bg-success" : "bg-border-hover"}`}
        />
        {ok ? okLabel : offLabel}
      </span>
    </div>
  );
}
