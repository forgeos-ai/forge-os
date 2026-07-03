import type { AnalysisResult } from "@/lib/athena/types";
import { composeStartupIdea } from "@/lib/athena/brief";

import {
  isAIFollowUpPayload,
  isAIProductBriefPayload,
  isAISummaryPayload,
  parseJsonFromContent,
} from "./schemas";
import type {
  AIFollowUp,
  AIProductBrief,
  AIProvider,
  AISummary,
} from "./types";
import { AIGatewayError } from "./types";

function buildProductBriefMetadata(
  sessionId: string,
  provider: AIProvider,
  mode: AIProductBrief["metadata"]["mode"],
) {
  return {
    sessionId,
    generatedAt: new Date(),
    provider: provider.id,
    model: provider.model,
    source: "ai-gateway" as const,
    mode,
  };
}

function buildFallbackProductBrief(
  sessionId: string,
  provider: AIProvider,
  analysis: AnalysisResult,
  mode: AIProductBrief["metadata"]["mode"],
): AIProductBrief {
  return {
    startupIdea: composeStartupIdea(analysis),
    problem: analysis.problem,
    customer: analysis.customer,
    currentSolution: analysis.currentSolution,
    frustrations: analysis.frustration,
    proposedSolution: analysis.proposedSolution,
    mvp: analysis.mvp,
    successGoal: analysis.successGoal,
    metadata: buildProductBriefMetadata(sessionId, provider, mode),
  };
}

export function parseProductBriefResponse(
  content: string,
  sessionId: string,
  provider: AIProvider,
  analysis: AnalysisResult,
  mode: AIProductBrief["metadata"]["mode"],
): AIProductBrief {
  const parsed = parseJsonFromContent(content);

  if (!isAIProductBriefPayload(parsed)) {
    return buildFallbackProductBrief(sessionId, provider, analysis, mode);
  }

  return {
    startupIdea: parsed.startupIdea.trim(),
    problem: parsed.problem.trim(),
    customer: parsed.customer.trim(),
    currentSolution: parsed.currentSolution.trim(),
    frustrations: parsed.frustrations.trim(),
    proposedSolution: parsed.proposedSolution.trim(),
    mvp: parsed.mvp.trim(),
    successGoal: parsed.successGoal.trim(),
    metadata: buildProductBriefMetadata(sessionId, provider, mode),
  };
}

export function parseFollowUpResponse(
  content: string,
  provider: AIProvider,
  questionText: string,
  mode: AIProductBrief["metadata"]["mode"],
): AIFollowUp {
  const parsed = parseJsonFromContent(content);

  if (isAIFollowUpPayload(parsed)) {
    return {
      message: parsed.message.trim(),
      intent: parsed.intent,
    };
  }

  if (mode === "live") {
    throw new AIGatewayError(
      `Failed to parse follow-up response from provider "${provider.id}".`,
    );
  }

  return {
    message: `Can you add more specificity to your answer for "${questionText}"?`,
    intent: "clarify",
  };
}

export function parseSummaryResponse(
  content: string,
  provider: AIProvider,
  fallbackContent: string,
  mode: AIProductBrief["metadata"]["mode"],
): AISummary {
  const parsed = parseJsonFromContent(content);

  if (isAISummaryPayload(parsed)) {
    return {
      summary: parsed.summary.trim(),
      keyPoints: parsed.keyPoints,
    };
  }

  if (mode === "live") {
    throw new AIGatewayError(
      `Failed to parse summary response from provider "${provider.id}".`,
    );
  }

  const preview = fallbackContent.trim().slice(0, 180);

  return {
    summary: preview,
    keyPoints: [
      "The core problem is clearly articulated.",
      "The target customer needs sharper definition.",
      "The MVP scope should stay ruthlessly small.",
    ],
  };
}
