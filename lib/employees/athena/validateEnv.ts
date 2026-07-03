import "server-only";

import { getAIConfig, isLiveProvider } from "@/lib/ai/config";
import { getOpenAIClient } from "@/lib/openai";
import { MissingOpenAIApiKeyError } from "@/lib/openai";

import { logEnvValidation } from "./pipelineLogger";

export interface EnvValidationResult {
  openaiApiKeyPresent: boolean;
  openaiClientInitializes: boolean;
  aiMode: string;
  aiDefaultProvider: string;
  openaiModel: string;
  isLiveOpenAI: boolean;
  errors: string[];
}

export function validateAthenaEnvironment(): EnvValidationResult {
  const config = getAIConfig();
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  const openaiApiKeyPresent = Boolean(apiKey);
  const errors: string[] = [];
  let openaiClientInitializes = false;

  if (!openaiApiKeyPresent && config.mode !== "mock") {
    errors.push("OPENAI_API_KEY is missing while AI_MODE is live.");
  }

  if (openaiApiKeyPresent) {
    try {
      getOpenAIClient();
      openaiClientInitializes = true;
    } catch (error) {
      if (error instanceof MissingOpenAIApiKeyError) {
        errors.push(error.message);
      } else if (error instanceof Error) {
        errors.push(`OpenAI client failed to initialize: ${error.message}`);
      } else {
        errors.push("OpenAI client failed to initialize.");
      }
    }
  }

  const result: EnvValidationResult = {
    openaiApiKeyPresent,
    openaiClientInitializes,
    aiMode: config.mode,
    aiDefaultProvider: config.defaultProvider,
    openaiModel: config.models.openai,
    isLiveOpenAI: isLiveProvider("openai"),
    errors,
  };

  logEnvValidation(result);
  return result;
}
