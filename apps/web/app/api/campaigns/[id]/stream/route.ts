import { getCurrentUser } from "@/lib/auth";
import { getServerRepo } from "@/lib/db/repo";
import { backendClient } from "@/lib/backend";
import type { CampaignStatus } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STAGE_KEYS = [
  "planning",
  "researching",
  "analyzing",
  "strategizing",
  "generating_content",
  "generating_images",
];

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const repo = await getServerRepo();
    const campaignId = params.id;

    const initialCampaign = await repo.getCampaign(user.id, campaignId);
    if (!initialCampaign) {
      return new Response(JSON.stringify({ error: "Campaign not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    const encoder = new TextEncoder();
    let intervalId: NodeJS.Timeout | null = null;
    let pingId: NodeJS.Timeout | null = null;
    let timeoutId: NodeJS.Timeout | null = null;
    let lastSerialized = "";

    const stream = new ReadableStream({
      async start(controller) {
        const cleanup = () => {
          if (intervalId) clearInterval(intervalId);
          if (pingId) clearInterval(pingId);
          if (timeoutId) clearTimeout(timeoutId);
          intervalId = null;
          pingId = null;
          timeoutId = null;
        };

        request.signal.addEventListener("abort", () => {
          cleanup();
          try {
            controller.close();
          } catch {
            // Already closed
          }
        });

        // 15s Heartbeat ping
        pingId = setInterval(() => {
          try {
            controller.enqueue(encoder.encode(": ping\n\n"));
          } catch {
            cleanup();
          }
        }, 15000);

        // 30 min hard timeout
        timeoutId = setTimeout(() => {
          try {
            controller.enqueue(
              encoder.encode(`event: timeout\ndata: {}\n\n`)
            );
            cleanup();
            controller.close();
          } catch {
            cleanup();
          }
        }, 30 * 60 * 1000);

        const poll = async () => {
          try {
            // Fetch local campaign doc
            let localCampaign = await repo.getCampaign(user.id, campaignId);
            if (!localCampaign) return;

            // Attempt lightweight backend sync if active
            try {
              const backendState = await backendClient.getCampaign(campaignId);
              if (backendState) {
                let shouldUpdate = false;
                let results = { ...localCampaign.results } as any;

                if (backendState.status && backendState.status !== localCampaign.status) {
                  shouldUpdate = true;
                }
                if (backendState.assets && backendState.assets.length > 0) {
                  results.assets = backendState.assets;
                  shouldUpdate = true;
                }
                if (backendState.results) {
                  results = { ...results, ...backendState.results };
                  shouldUpdate = true;
                }

                if (shouldUpdate || backendState.execution) {
                  await repo.updateCampaignResults(
                    campaignId,
                    results,
                    (backendState.status as CampaignStatus) || localCampaign.status
                  );
                  const updated = await repo.getCampaign(user.id, campaignId);
                  if (updated) {
                    localCampaign = updated;
                    if (backendState.execution) {
                      (localCampaign as any).execution = backendState.execution;
                    }
                  }
                }
              }
            } catch {
              // Ignore backend sync failure, fallback to local doc
            }

            const execution = (localCampaign as any).execution || {};
            const currentStage = execution.stage || localCampaign.status || "planning";
            const stagesList = execution.stages || [];

            // Calculate progress.done / progress.total
            const completedCount = stagesList.filter(
              (s: any) => s.status === "completed"
            ).length;

            const progress = {
              done: Math.min(6, completedCount),
              total: 6,
            };

            const assetsList = (localCampaign.results?.assets || []).map((a: any) => ({
              id: a.id,
              platform: a.platform,
              status: a.status,
            }));

            const eventData = {
              campaignId,
              status: localCampaign.status,
              stage: currentStage,
              currentAgent: execution.current_agent || "",
              currentMessage: execution.current_message || "",
              stages: stagesList,
              progress,
              assets: assetsList,
              updatedAt: Date.now(),
            };

            const serialized = JSON.stringify(eventData);

            // Only emit if diff detected
            if (serialized !== lastSerialized) {
              lastSerialized = serialized;
              controller.enqueue(
                encoder.encode(`event: run\ndata: ${serialized}\n\n`)
              );
            }

            // Terminal status check
            const terminalStatuses = [
              "ready",
              "published",
              "partially_published",
              "failed",
            ];
            if (
              terminalStatuses.includes(localCampaign.status) ||
              currentStage === "ready" ||
              currentStage === "failed"
            ) {
              const doneData = JSON.stringify({ status: localCampaign.status });
              controller.enqueue(
                encoder.encode(`event: done\ndata: ${doneData}\n\n`)
              );
              cleanup();
              controller.close();
            }
          } catch (e) {
            console.error("SSE poll error:", e);
          }
        };

        // Initial poll immediately
        await poll();

        // 2s diff-poll interval
        intervalId = setInterval(poll, 2000);
      },
      cancel() {
        if (intervalId) clearInterval(intervalId);
        if (pingId) clearInterval(pingId);
        if (timeoutId) clearTimeout(timeoutId);
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        "Connection": "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({
        error: err instanceof Error ? err.message : "Internal Server Error",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
