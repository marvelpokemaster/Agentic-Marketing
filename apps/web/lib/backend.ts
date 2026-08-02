import { getTokens } from "next-firebase-auth-edge";
import { cookies } from "next/headers";
import { authConfig } from "@/lib/auth";
import { serverConfig } from "@/lib/firebase/config";
import type { WorkflowType, ResearchReport } from "./types";

const BACKEND_API_URL = process.env.BACKEND_API_URL || "http://localhost:8000";
const REQUEST_TIMEOUT_MS = 300_000; // 5 minutes — Google Maps scraping + LLM can take a while

export interface BackendCampaignState {
  campaign_id: string;
  workflow_name: string;
  created_at: string;
  product_name: string;
  product_description: string;
  target_audience?: string;
  industry?: string;
  location?: string;
  platforms: string[];
  scrapers: string[];
  image_mode: string;
  instructions: string;
  leads: any[];
  assets: any[];
  research_summary?: string;
  research_report?: ResearchReport;
  status: string;
  execution?: any;
  results?: any;
  errors: string[];
  log: string[];
}

export class BackendClientError extends Error {
  constructor(
    message: string,
    public status?: number,
    public body?: any,
    public code?: string,
  ) {
    super(message);
    this.name = "BackendClientError";
  }
}

export interface RequestOptions extends RequestInit {
  requiresAuth?: boolean;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { requiresAuth = true, ...fetchOptions } = options;
  const url = `${BACKEND_API_URL.replace(/\/$/, "")}${path}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    let authHeader: Record<string, string> = {};

    if (requiresAuth) {
      // Demo mode fallback: if Firebase is not fully configured, send demo token
      if (!serverConfig.serviceAccount.privateKey) {
        authHeader = { Authorization: "Bearer demo-token" };
        console.log(`[AUTH DIAGNOSTIC] Path: ${path} | Mode: Demo | Auth required: yes | Token present: yes (demo)`);
      } else {
        const tokens = await getTokens(cookies(), authConfig);

        // DO NOT CALL RAILWAY IF CRENDENTIALS ARE UNAVAILABLE/EXPIRED
        if (!tokens || !tokens.token) {
          console.warn(`[AUTH DIAGNOSTIC] Path: ${path} | Auth required: yes | Token present: no | Action: Aborting Railway request`);
          throw new BackendClientError(
            "Authentication credentials unavailable",
            401,
            { detail: "MISSING_CREDENTIALS" },
            "MISSING_CREDENTIALS"
          );
        }

        authHeader = { Authorization: `Bearer ${tokens.token}` };
        console.log(`[AUTH DIAGNOSTIC] Path: ${path} | Auth required: yes | Token present: yes | UID: ${tokens.decodedToken.uid}`);
      }
    } else {
      console.log(`[AUTH DIAGNOSTIC] Path: ${path} | Auth required: no`);
    }

    const response = await fetch(url, {
      ...fetchOptions,
      headers: {
        "Content-Type": "application/json",
        ...authHeader,
        ...(fetchOptions.headers as Record<string, string> || {}),
      } as Record<string, string>,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    let responseData: any;
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      responseData = await response.json();
    } else {
      responseData = await response.text();
    }

    if (!response.ok) {
      throw new BackendClientError(
        typeof responseData === "object" && responseData.detail
          ? String(responseData.detail)
          : `API request failed with status ${response.status}`,
        response.status,
        responseData,
        response.status === 401 ? "UNAUTHORIZED" : undefined
      );
    }

    return responseData as T;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof BackendClientError) {
      throw error;
    }
    if (error instanceof Error && error.name === "AbortError") {
      throw new BackendClientError(`Request to backend timed out after ${REQUEST_TIMEOUT_MS}ms`);
    }
    throw new BackendClientError(
      error instanceof Error ? error.message : "An unexpected error occurred communicating with the backend"
    );
  }
}

export const backendClient = {
  /**
   * Health check / ping (Public).
   */
  async health(): Promise<{ status: string }> {
    return request<{ status: string }>("/health", { requiresAuth: false });
  },

  /**
   * Check publish status (Public).
   */
  async publishStatus(): Promise<{ configured: boolean; facebook: boolean; instagram: boolean }> {
    return request<{ configured: boolean; facebook: boolean; instagram: boolean }>("/publish/status", { requiresAuth: false });
  },

  /**
   * Get list of available workflows (Authenticated).
   */
  async workflows(): Promise<string[]> {
    return request<string[]>("/workflows", { requiresAuth: true });
  },

  /**
   * Create a campaign resource in the backend (Authenticated).
   */
  async createCampaign(
    id: string,
    name: string,
    workflow: WorkflowType,
    config: Record<string, any>
  ): Promise<BackendCampaignState> {
    return request<BackendCampaignState>("/campaigns", {
      method: "POST",
      requiresAuth: true,
      body: JSON.stringify({
        id,
        name,
        workflow,
        config,
      }),
    });
  },

  /**
   * Get a campaign resource from the backend (Authenticated).
   */
  async getCampaign(id: string): Promise<BackendCampaignState> {
    return request<BackendCampaignState>(`/campaigns/${id}`, { requiresAuth: true });
  },

  /**
   * Update campaign config/metadata in the backend (Authenticated).
   */
  async updateCampaign(
    id: string,
    patch: {
      name?: string;
      workflow?: WorkflowType;
      config?: Record<string, any>;
    }
  ): Promise<BackendCampaignState> {
    return request<BackendCampaignState>(`/campaigns/${id}`, {
      method: "PATCH",
      requiresAuth: true,
      body: JSON.stringify(patch),
    });
  },

  /**
   * Trigger execution of the campaign's workflow (Authenticated).
   */
  async runCampaign(id: string, options?: { refresh_type?: "none" | "research" | "strategy" | "everything"; resume?: boolean }): Promise<BackendCampaignState> {
    return request<BackendCampaignState>(`/campaigns/${id}/run`, {
      method: "POST",
      requiresAuth: true,
      body: JSON.stringify({
        refresh_type: options?.refresh_type || "none",
        resume: options?.resume || false,
      }),
    });
  },

  /**
   * Trigger research phase for a campaign in the backend (Authenticated).
   */
  async runCampaignResearch(id: string, forceRefresh: boolean = false): Promise<BackendCampaignState> {
    const url = `/campaigns/${id}/research` + (forceRefresh ? "?force_refresh=true" : "");
    return request<BackendCampaignState>(url, {
      method: "POST",
      requiresAuth: true,
    });
  },
};
