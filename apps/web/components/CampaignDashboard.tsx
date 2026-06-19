"use client";

import { useState } from "react";
import {
  PLATFORM_LABELS,
  type Campaign,
  type CampaignAsset,
} from "@/lib/types";

export function CampaignDashboard({
  campaign,
  metaConfigured,
}: {
  campaign: Campaign;
  metaConfigured: boolean;
}) {
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      {campaign.assets.map((asset) => (
        <AssetCard
          key={asset.id}
          campaignId={campaign.id}
          initial={asset}
          metaConfigured={metaConfigured}
        />
      ))}
    </div>
  );
}

const STATUS_STYLE: Record<string, string> = {
  draft: "",
  scheduled: "chip-on",
  publishing: "chip-on",
  published: "chip-on",
  failed: "",
};

function AssetCard({
  campaignId,
  initial,
  metaConfigured,
}: {
  campaignId: string;
  initial: CampaignAsset;
  metaConfigured: boolean;
}) {
  const [asset, setAsset] = useState<CampaignAsset>(initial);
  const [headline, setHeadline] = useState(initial.headline);
  const [body, setBody] = useState(initial.body);
  const [hashtags, setHashtags] = useState(initial.hashtags.join(" "));
  const [cta, setCta] = useState(initial.cta);
  const [scheduledTime, setScheduledTime] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const base = `/api/campaigns/${campaignId}/assets/${asset.id}`;
  const canPublishHere = asset.platform === "instagram" || asset.platform === "facebook";

  async function save() {
    setBusy("save");
    setError(null);
    setMessage(null);
    try {
      const res = await fetch(base, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ headline, body, cta, hashtags }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
      setAsset(data.asset);
      setHashtags(data.asset.hashtags.join(" "));
      setMessage("Saved.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setBusy(null);
    }
  }

  async function regenerateCreative() {
    setBusy("creative");
    setError(null);
    setMessage(null);
    try {
      const res = await fetch(`${base}/creative`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ creative_prompt: asset.creative_prompt }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Regenerate failed");
      setAsset(data.asset);
      setMessage("New creative generated.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Regenerate failed");
    } finally {
      setBusy(null);
    }
  }

  async function publish(schedule: boolean) {
    setBusy(schedule ? "schedule" : "publish");
    setError(null);
    setMessage(null);
    try {
      // Persist edits first so we publish the latest copy.
      await fetch(base, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ headline, body, cta, hashtags }),
      });
      const res = await fetch(`${base}/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          schedule && scheduledTime ? { scheduled_time: scheduledTime } : {},
        ),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Publish failed");
      setAsset(data.asset);
      setMessage(
        data.asset.status === "scheduled"
          ? "Scheduled successfully."
          : "Published successfully.",
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Publish failed");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="card space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">{PLATFORM_LABELS[asset.platform]}</h3>
        <span className={`chip ${STATUS_STYLE[asset.status] ?? ""}`}>
          {asset.status}
        </span>
      </div>

      {asset.creative_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={asset.creative_url}
          alt={`${asset.platform} creative`}
          className="aspect-square w-full rounded-lg border border-border object-cover"
          loading="lazy"
        />
      ) : (
        <div className="flex aspect-square w-full items-center justify-center rounded-lg border border-border bg-surface text-sm text-muted">
          No creative yet
        </div>
      )}

      <button
        type="button"
        onClick={regenerateCreative}
        className="btn-ghost btn-sm w-full"
        disabled={busy !== null}
      >
        {busy === "creative" ? "Generating…" : "Regenerate creative"}
      </button>

      <div>
        <label className="label">Headline</label>
        <input
          className="input"
          value={headline}
          onChange={(e) => setHeadline(e.target.value)}
        />
      </div>

      <div>
        <label className="label">Post copy</label>
        <textarea
          className="textarea"
          value={body}
          onChange={(e) => setBody(e.target.value)}
        />
      </div>

      <div>
        <label className="label">Hashtags (space separated)</label>
        <input
          className="input"
          value={hashtags}
          onChange={(e) => setHashtags(e.target.value)}
        />
      </div>

      <div>
        <label className="label">Call to action</label>
        <input className="input" value={cta} onChange={(e) => setCta(e.target.value)} />
      </div>

      <div className="flex flex-wrap gap-2">
        <button onClick={save} className="btn-ghost btn-sm" disabled={busy !== null}>
          {busy === "save" ? "Saving…" : "Save edits"}
        </button>

        {canPublishHere ? (
          <>
            <button
              onClick={() => publish(false)}
              className="btn btn-sm"
              disabled={busy !== null || !metaConfigured}
              title={metaConfigured ? "" : "Configure Meta to publish"}
            >
              {busy === "publish" ? "Publishing…" : "Publish now"}
            </button>
            {asset.platform === "facebook" && (
              <div className="flex items-center gap-2">
                <input
                  type="datetime-local"
                  className="input btn-sm w-auto"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                />
                <button
                  onClick={() => publish(true)}
                  className="btn-ghost btn-sm"
                  disabled={busy !== null || !metaConfigured || !scheduledTime}
                >
                  {busy === "schedule" ? "Scheduling…" : "Schedule"}
                </button>
              </div>
            )}
          </>
        ) : (
          <span className="chip">Generate-only (no API publish)</span>
        )}
      </div>

      {asset.external_id && (
        <p className="text-xs text-muted">Meta ID: {asset.external_id}</p>
      )}
      {message && <p className="text-sm text-primary">{message}</p>}
      {(error || asset.error) && (
        <p className="text-sm text-danger">{error || asset.error}</p>
      )}
    </div>
  );
}
