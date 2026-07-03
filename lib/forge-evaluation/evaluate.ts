import type { WorkingMemory } from "@/lib/athena/types";

import { evaluateConversation } from "./conversationScore";
import { detectGenericQuestion } from "./genericQuestionDetector";
import { generateFeedbackReport, summarizeFeedback } from "./feedback";
import {
  buildQuestionEvaluationContexts,
  computeEvaluationMetrics,
} from "./metrics";
import { evaluateAllQuestionQuality } from "./questionQuality";
import { evaluateTrust } from "./trustScore";
import type {
  ForgeEvaluationReport,
  FounderFeedback,
} from "./types";
import { EVALUATION_VERSION } from "./types";

function buildOverallRecommendation(input: {
  rqi: number;
  ues: number;
  genericCount: number;
  trustScore: number;
  feedbackRating: number | null;
}): string {
  const issues: string[] = [];

  if (input.genericCount > 0) {
    issues.push(
      `${input.genericCount} generic question(s) detected — review question phrasing pipeline.`,
    );
  }

  if (input.trustScore < 65) {
    issues.push("Trust factors below threshold — improve rationale transparency.");
  }

  if (input.ues < 5) {
    issues.push(
      "Low understanding efficiency — Cortex may need more information gain per question.",
    );
  }

  if (input.feedbackRating !== null && input.feedbackRating < 7) {
    issues.push("Founder rating below 7 — qualitative review recommended.");
  }

  if (input.rqi >= 75 && issues.length === 0) {
    return "PASS: Forge Cortex reasoning quality is strong for alpha testing. Continue collecting sessions.";
  }

  if (input.rqi >= 55) {
    return `REVIEW: Acceptable reasoning quality (RQI ${input.rqi}). Address: ${issues.join(" ") || "minor tuning opportunities."}`;
  }

  return `FAIL: Reasoning quality below alpha threshold (RQI ${input.rqi}). Address: ${issues.join(" ") || "fundamental discovery flow issues."}`;
}

export interface RunEvaluationInput {
  memory: WorkingMemory;
  feedback?: FounderFeedback;
  evaluatedAt?: Date;
}

export function runEvaluation(input: RunEvaluationInput): ForgeEvaluationReport {
  const { memory } = input;
  const evaluatedAt = input.evaluatedAt ?? new Date();
  const contexts = buildQuestionEvaluationContexts(memory);
  const questionQuality = evaluateAllQuestionQuality(contexts);
  const conversationScore = evaluateConversation(memory);
  const trustScore = evaluateTrust(memory);
  const metrics = computeEvaluationMetrics({
    memory,
    questionQuality,
    conversation: conversationScore,
    trust: trustScore,
  });
  const genericDetections = memory.conversation.map((turn) =>
    detectGenericQuestion(turn.questionText),
  );
  const feedbackSummary = input.feedback
    ? generateFeedbackReport(input.feedback, memory)
    : null;
  const genericCount = genericDetections.filter(
    (report) => report.isGeneric,
  ).length;

  const overallRecommendation = buildOverallRecommendation({
    rqi: metrics.reasoningQualityIndex,
    ues: metrics.understandingEfficiencyScore,
    genericCount,
    trustScore: trustScore.overallScore,
    feedbackRating: feedbackSummary?.rating ?? null,
  });

  const summary = [
    `Session ${memory.sessionId} evaluated at ${evaluatedAt.toISOString()}.`,
    `${questionQuality.length} question(s), RQI ${metrics.reasoningQualityIndex}/100, UES ${metrics.understandingEfficiencyScore}, QVS ${metrics.questionValueScore}.`,
    conversationScore.summary,
    trustScore.summary,
    summarizeFeedback(feedbackSummary),
    overallRecommendation,
  ].join(" ");

  return {
    sessionId: memory.sessionId,
    evaluatedAt,
    version: EVALUATION_VERSION,
    questionQuality,
    conversationScore,
    trustScore,
    metrics,
    genericDetections,
    feedbackSummary,
    overallRecommendation,
    summary,
  };
}
