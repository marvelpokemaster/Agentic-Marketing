"use client";

import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAgentRunStore } from "@/lib/stores/agentRunStore";

export function useCampaignStream(campaignId: string, enabled: boolean) {
  const [isLive, setIsLive] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);
  const lastStageRef = useRef<string>("");
  const retryCountRef = useRef(0);
  const queryClient = useQueryClient();
  const { updateStage, completeRun, failRun, appendTokens } = useAgentRunStore();

  useEffect(() => {
    if (!enabled || !campaignId) {
      if (eventSourceRef.current) {
        console.debug("SSE disconnected:", campaignId);
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      setIsLive(false);
      return;
    }

    // Guard against React 18 double-mount
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    const url = `/api/campaigns/${campaignId}/stream`;
    console.debug("SSE connected:", campaignId);
    const es = new EventSource(url);
    eventSourceRef.current = es;

    es.onopen = () => {
      setIsLive(true);
      retryCountRef.current = 0;
    };

    es.addEventListener("run", (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data);
        const stage = data.stage || "planning";
        const progressDone = data.progress?.done ?? 0;
        const progressTotal = data.progress?.total ?? 6;

        updateStage(campaignId, stage, progressDone, progressTotal);

        // Invalidate TanStack Query if stage transitioned to fetch fresh data payload
        if (lastStageRef.current && lastStageRef.current !== stage) {
          queryClient.invalidateQueries({ queryKey: ["campaign", campaignId] });
        }
        lastStageRef.current = stage;

        if (data.status === "failed") {
          failRun(campaignId, data.currentMessage || "Campaign execution failed");
        } else if (
          data.status === "ready" ||
          data.status === "published" ||
          data.status === "partially_published" ||
          stage === "ready"
        ) {
          completeRun(campaignId);
          queryClient.invalidateQueries({ queryKey: ["campaign", campaignId] });
        }
      } catch (err) {
        console.error("Failed to parse SSE run event data:", err);
      }
    });

    // Token streaming handler for live LLM streaming
    es.addEventListener("token", (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data);
        if (data.chunk) {
          appendTokens(campaignId, data.chunk);
        }
      } catch (err) {
        console.error("Failed to parse SSE token event:", err);
      }
    });

    // Auth error handler: halt reconnect loop immediately
    es.addEventListener("auth_error", () => {
      console.warn("[SSE AUTH ERROR] Authentication failed. Closing SSE stream to halt reconnect loop.");
      setIsLive(false);
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    });

    es.addEventListener("done", () => {
      setIsLive(false);
      completeRun(campaignId);
      queryClient.invalidateQueries({ queryKey: ["campaign", campaignId] });
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    });

    es.onerror = () => {
      retryCountRef.current += 1;
      if (retryCountRef.current >= 3) {
        console.warn("[SSE ERROR] SSE connection dropped after retries. Closing stream:", campaignId);
        setIsLive(false);
        if (eventSourceRef.current) {
          eventSourceRef.current.close();
          eventSourceRef.current = null;
        }
      }
    };

    return () => {
      if (eventSourceRef.current) {
        console.debug("SSE disconnected:", campaignId);
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      setIsLive(false);
    };
  }, [campaignId, enabled, updateStage, completeRun, failRun, appendTokens, queryClient]);

  return { isLive };
}
