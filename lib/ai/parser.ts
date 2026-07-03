import type { DiscoveryContext } from "@/lib/athena/types";
import type { CandidateQuestion } from "@/lib/forge-cortex/types";
import { CONFIDENCE_THRESHOLD } from "@/lib/forge-cortex/types";

import {
  isAIGeneratedQuestionPayload,
  isAIProductBriefPayload,
  isAISummaryPayload,
  parseJsonFromContent,
} from "./schemas";
import type {
  AIGeneratedQuestion,
  AIProductBrief,
  AIProvider,
  AISummary,
} from "./types";
import { AIGatewayError } from "./types";

const BLUEPRINT_VERSION = "0.3.0";

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
    documentType: "founder-blueprint" as const,
    version: BLUEPRINT_VERSION,
  };
}

function validationNeeded(dimension: string, score: number): string {
  return `More validation is needed for ${dimension} (confidence: ${score}%). Run targeted customer conversations before making decisions in this area.`;
}

function buildValidationPlanFallback(context: DiscoveryContext): string {
  const { lowestDimension, lowestScore } = context.confidence;

  return [
    `1. Customer pain interview: Talk to 5 people matching the target customer profile about "${context.problem || "the core problem"}" — Success signal: 3+ describe the pain unprompted.`,
    `2. Buyer authority check: Confirm who approves budget for solutions in this space — Success signal: named role and buying trigger identified.`,
    `3. ${lowestDimension} depth sprint: Run a focused 30-minute session on the weakest area (${lowestDimension}, ${lowestScore}% confidence) — Success signal: confidence rises above ${CONFIDENCE_THRESHOLD}%.`,
  ].join("\n");
}

function buildFounderDNASummaryFallback(context: DiscoveryContext): string {
  const { founderDNA } = context.intelligence;

  if (founderDNA.signals.length === 0) {
    return founderDNA.summary;
  }

  return founderDNA.signals
    .map(
      (signal) =>
        `• ${signal.dimension}: ${signal.content} (confidence: ${signal.confidence}%)`,
    )
    .join("\n");
}

function buildEvidenceSummaryFallback(context: DiscoveryContext): string {
  const { evidence } = context.intelligence;

  if (evidence.claims.length === 0) {
    return evidence.summary;
  }

  const claimLines = evidence.claims
    .map(
      (claim) =>
        `• [${claim.evidenceType}] ${claim.statement} — score ${claim.evidenceScore}/100`,
    )
    .join("\n");

  return `${evidence.summary}\n${claimLines}`;
}

function buildBlindSpotsFallback(context: DiscoveryContext): string {
  const { blindspots } = context.intelligence;

  if (blindspots.length === 0) {
    return "No critical blind spots detected — core strategic topics have been discussed.";
  }

  return blindspots
    .slice(0, 5)
    .map((spot, index) => `${index + 1}. ${spot.label}: ${spot.reason}`)
    .join("\n");
}

function buildOpportunityScoreFallback(context: DiscoveryContext): string {
  const { opportunity } = context.intelligence;

  if (opportunity.overall.confidence === 0) {
    return opportunity.summary;
  }

  return [
    opportunity.summary,
    `• Problem Severity: ${opportunity.problemSeverity.score}/100 — ${opportunity.problemSeverity.explanation}`,
    `• Founder Fit: ${opportunity.founderFit.score}/100 — ${opportunity.founderFit.explanation}`,
    `• Market Pull: ${opportunity.marketPull.score}/100 — ${opportunity.marketPull.explanation}`,
    `• Execution Difficulty: ${opportunity.executionDifficulty.score}/100 — ${opportunity.executionDifficulty.explanation}`,
    `• Validation Level: ${opportunity.validationLevel.score}/100 — ${opportunity.validationLevel.explanation}`,
  ].join("\n");
}

function buildConversationQualityFallback(context: DiscoveryContext): string {
  const { conversationQuality } = context.intelligence;

  if (conversationQuality.overall === 0) {
    return conversationQuality.summary;
  }

  return [
    conversationQuality.summary,
    `• Specificity: ${conversationQuality.specificity.score}/100 — ${conversationQuality.specificity.notes}`,
    `• Consistency: ${conversationQuality.consistency.score}/100 — ${conversationQuality.consistency.notes}`,
    `• Evidence: ${conversationQuality.evidence.score}/100 — ${conversationQuality.evidence.notes}`,
    `• Vision: ${conversationQuality.vision.score}/100 — ${conversationQuality.vision.notes}`,
    `• Execution Readiness: ${conversationQuality.executionReadiness.score}/100 — ${conversationQuality.executionReadiness.notes}`,
  ].join("\n");
}

function buildFallbackProductBrief(
  sessionId: string,
  provider: AIProvider,
  context: DiscoveryContext,
  mode: AIProductBrief["metadata"]["mode"],
): AIProductBrief {
  const { confidence } = context;
  const thesis =
    context.proposedSolution && context.customer
      ? `${context.proposedSolution} — built for ${context.customer}`
      : context.proposedSolution || context.problem;

  return {
    executiveSummary: thesis
      ? `${thesis}. This blueprint is based on the founder discovery session and requires further validation in areas flagged below.`
      : "Discovery is incomplete. Additional founder conversations are required before a confident blueprint can be produced.",
    startupThesis: thesis || validationNeeded("startup thesis", confidence.scores.businessModel),
    coreProblem:
      context.problem ||
      validationNeeded("core problem", confidence.scores.problem),
    targetCustomer:
      context.customer ||
      validationNeeded("target customer", confidence.scores.customer),
    buyer:
      context.buyer ||
      (confidence.scores.buyer < CONFIDENCE_THRESHOLD
        ? validationNeeded("buyer", confidence.scores.buyer)
        : "Buyer dynamics not yet articulated in discovery."),
    keyAssumptions:
      "• Assumptions captured during discovery require explicit validation before scaling.\n• Review the validation plan below and test the highest-risk beliefs first.",
    biggestRisks:
      context.frustrations ||
      "Biggest risks not yet fully articulated. Continue discovery on competition and adoption barriers.",
    validationPlan: buildValidationPlanFallback(context),
    mvp30Day:
      context.mvp ||
      validationNeeded("30-day MVP", confidence.scores.goals),
    successMetrics:
      context.successGoal ||
      (confidence.scores.goals < CONFIDENCE_THRESHOLD
        ? validationNeeded("success metrics", confidence.scores.goals)
        : "Define measurable 90-day outcomes before launch."),
    recommendedNextAction:
      "Complete the first validation experiment from the Validation Plan within 48 hours and document findings.",
    founderDNASummary: buildFounderDNASummaryFallback(context),
    evidenceSummary: buildEvidenceSummaryFallback(context),
    blindSpots: buildBlindSpotsFallback(context),
    opportunityScore: buildOpportunityScoreFallback(context),
    conversationQuality: buildConversationQualityFallback(context),
    metadata: buildProductBriefMetadata(sessionId, provider, mode),
  };
}

export function parseProductBriefResponse(
  content: string,
  sessionId: string,
  provider: AIProvider,
  context: DiscoveryContext,
  mode: AIProductBrief["metadata"]["mode"],
): AIProductBrief {
  const parsed = parseJsonFromContent(content);

  if (!isAIProductBriefPayload(parsed)) {
    return buildFallbackProductBrief(sessionId, provider, context, mode);
  }

  return {
    executiveSummary: parsed.executiveSummary.trim(),
    startupThesis: parsed.startupThesis.trim(),
    coreProblem: parsed.coreProblem.trim(),
    targetCustomer: parsed.targetCustomer.trim(),
    buyer: parsed.buyer.trim(),
    keyAssumptions: parsed.keyAssumptions.trim(),
    biggestRisks: parsed.biggestRisks.trim(),
    validationPlan: parsed.validationPlan.trim(),
    mvp30Day: parsed.mvp30Day.trim(),
    successMetrics: parsed.successMetrics.trim(),
    recommendedNextAction: parsed.recommendedNextAction.trim(),
    founderDNASummary: parsed.founderDNASummary.trim(),
    evidenceSummary: parsed.evidenceSummary.trim(),
    blindSpots: parsed.blindSpots.trim(),
    opportunityScore: parsed.opportunityScore.trim(),
    conversationQuality: parsed.conversationQuality.trim(),
    metadata: buildProductBriefMetadata(sessionId, provider, mode),
  };
}

export function parseGeneratedQuestionResponse(
  content: string,
  candidate: CandidateQuestion,
  provider: AIProvider,
  mode: AIProductBrief["metadata"]["mode"],
): AIGeneratedQuestion {
  const parsed = parseJsonFromContent(content);

  if (isAIGeneratedQuestionPayload(parsed)) {
    return {
      question: parsed.question.trim(),
      objective: candidate.question,
      reason: candidate.reason,
      targetDimension: candidate.targetDimension,
    };
  }

  if (mode === "live") {
    throw new AIGatewayError(
      `Failed to parse generated question from provider "${provider.id}".`,
    );
  }

  return {
    question: candidate.question,
    objective: candidate.question,
    reason: candidate.reason,
    targetDimension: candidate.targetDimension,
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
