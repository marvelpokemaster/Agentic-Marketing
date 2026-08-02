import { firebaseConfig } from "@/lib/firebase/config";
import { type CodeLine } from "@/components/ui/CodePanel";
import { LandingExperience } from "@/components/landing/LandingExperience";

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

export default async function HomePage() {
  const firebase = Boolean(firebaseConfig.projectId);
  const meta = await isMetaConfiguredOnBackend();

  return (
    <LandingExperience
      heroLog={HERO_LOG}
      stats={STATS}
      firebase={firebase}
      meta={meta}
    />
  );
}
