import "server-only";

import type { AIProviderId } from "./types";

export type AIMode = "live" | "mock";

const VALID_PROVIDERS: AIProviderId[] = ["openai", "claude", "gemini"];

function parseProviderId(value: string | undefined): AIProviderId {
  if (value && VALID_PROVIDERS.includes(value as AIProviderId)) {
    return value as AIProviderId;
  }

  return "openai";
}

function parseMode(value: string | undefined): AIMode {
  return value === "mock" ? "mock" : "live";
}

export interface AIConfig {
  defaultProvider: AIProviderId;
  mode: AIMode;
  models: Record<AIProviderId, string>;
}

export function getAIConfig(): AIConfig {
  return {
    defaultProvider: parseProviderId(process.env.AI_DEFAULT_PROVIDER),
    mode: parseMode(process.env.AI_MODE),
    models: {
      openai: process.env.OPENAI_MODEL?.trim() || "gpt-4o",
      claude: process.env.CLAUDE_MODEL?.trim() || "claude-sonnet-4-20250514",
      gemini: process.env.GEMINI_MODEL?.trim() || "gemini-2.0-flash",
    },
  };
}

export function isLiveProvider(providerId: AIProviderId): boolean {
  const config = getAIConfig();

  if (config.mode === "mock") {
    return false;
  }

  return providerId === "openai";
}
