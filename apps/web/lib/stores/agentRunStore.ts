import { create } from "zustand";

export type RunPhase = "idle" | "queued" | "processing" | "streaming" | "completed" | "failed";

export interface AgentRunState {
  campaignId: string;
  phase: RunPhase;
  stage: string;
  progress: { done: number; total: number };
  tokens: string;
  error: string | null;
  lastEventAt: number;
}

interface AgentRunStore {
  runs: Record<string, AgentRunState>;
  getRun: (campaignId: string) => AgentRunState;
  startRun: (campaignId: string, initialStage?: string) => void;
  updateStage: (campaignId: string, stage: string, done?: number, total?: number) => void;
  appendTokens: (campaignId: string, chunk: string) => void;
  completeRun: (campaignId: string) => void;
  failRun: (campaignId: string, error: string) => void;
  resetRun: (campaignId: string) => void;
}

const DEFAULT_RUN_STATE: Omit<AgentRunState, "campaignId"> = {
  phase: "idle",
  stage: "planning",
  progress: { done: 0, total: 6 },
  tokens: "",
  error: null,
  lastEventAt: 0,
};

export const useAgentRunStore = create<AgentRunStore>((set, get) => ({
  runs: {},

  getRun: (campaignId: string) => {
    return get().runs[campaignId] || { campaignId, ...DEFAULT_RUN_STATE };
  },

  startRun: (campaignId: string, initialStage = "planning") => {
    set((state) => ({
      runs: {
        ...state.runs,
        [campaignId]: {
          campaignId,
          phase: "processing",
          stage: initialStage,
          progress: { done: 0, total: 6 },
          tokens: "",
          error: null,
          lastEventAt: Date.now(),
        },
      },
    }));
  },

  updateStage: (campaignId: string, stage: string, done = 0, total = 6) => {
    set((state) => {
      const existing = state.runs[campaignId] || { campaignId, ...DEFAULT_RUN_STATE };
      return {
        runs: {
          ...state.runs,
          [campaignId]: {
            ...existing,
            phase: stage === "ready" ? "completed" : "processing",
            stage,
            progress: { done, total },
            lastEventAt: Date.now(),
          },
        },
      };
    });
  },

  appendTokens: (campaignId: string, chunk: string) => {
    set((state) => {
      const existing = state.runs[campaignId] || { campaignId, ...DEFAULT_RUN_STATE };
      return {
        runs: {
          ...state.runs,
          [campaignId]: {
            ...existing,
            phase: "streaming",
            tokens: existing.tokens + chunk,
            lastEventAt: Date.now(),
          },
        },
      };
    });
  },

  completeRun: (campaignId: string) => {
    set((state) => {
      const existing = state.runs[campaignId] || { campaignId, ...DEFAULT_RUN_STATE };
      return {
        runs: {
          ...state.runs,
          [campaignId]: {
            ...existing,
            phase: "completed",
            stage: "ready",
            progress: { done: 6, total: 6 },
            lastEventAt: Date.now(),
          },
        },
      };
    });
  },

  failRun: (campaignId: string, error: string) => {
    set((state) => {
      const existing = state.runs[campaignId] || { campaignId, ...DEFAULT_RUN_STATE };
      return {
        runs: {
          ...state.runs,
          [campaignId]: {
            ...existing,
            phase: "failed",
            error,
            lastEventAt: Date.now(),
          },
        },
      };
    });
  },

  resetRun: (campaignId: string) => {
    set((state) => {
      const newRuns = { ...state.runs };
      delete newRuns[campaignId];
      return { runs: newRuns };
    });
  },
}));
