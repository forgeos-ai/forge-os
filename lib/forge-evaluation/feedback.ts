import type { WorkingMemory } from "@/lib/athena/types";

import type { FeedbackReport, FounderFeedback } from "./types";

function clampRating(rating: number): number {
  return Math.max(1, Math.min(10, Math.round(rating)));
}

function classifyNetPromoter(rating: number): FeedbackReport["netPromoterSignal"] {
  if (rating >= 9) {
    return "promoter";
  }

  if (rating >= 7) {
    return "passive";
  }

  return "detractor";
}

function resolveQuestionText(
  memory: WorkingMemory,
  questionId?: string,
): string | null {
  if (!questionId) {
    return null;
  }

  const turn = memory.conversation.find((entry) => entry.id === questionId);

  if (turn) {
    return turn.questionText;
  }

  if (memory.pendingQuestion?.id === questionId) {
    return memory.pendingQuestion.questionText;
  }

  return null;
}

function buildFeedbackSummary(feedback: FounderFeedback): string {
  const parts = [
    `Rating: ${clampRating(feedback.rating)}/10.`,
    feedback.understoodYou
      ? "Founder felt understood."
      : "Founder did not feel fully understood.",
    feedback.wouldUseAgain
      ? "Founder would use Forge OS again."
      : "Founder is unlikely to use Forge OS again.",
  ];

  if (feedback.comments?.trim()) {
    parts.push(`Comments: "${feedback.comments.trim()}"`);
  }

  return parts.join(" ");
}

export function generateFeedbackReport(
  feedback: FounderFeedback,
  memory: WorkingMemory,
): FeedbackReport {
  const rating = clampRating(feedback.rating);

  return {
    mostValuableQuestion: resolveQuestionText(
      memory,
      feedback.mostValuableQuestionId,
    ),
    leastValuableQuestion: resolveQuestionText(
      memory,
      feedback.leastValuableQuestionId,
    ),
    understoodYou: feedback.understoodYou,
    wouldUseAgain: feedback.wouldUseAgain,
    rating,
    comments: feedback.comments?.trim() ?? "",
    summary: buildFeedbackSummary(feedback),
    netPromoterSignal: classifyNetPromoter(rating),
  };
}

export function summarizeFeedback(
  feedback: FeedbackReport | null,
): string {
  if (!feedback) {
    return "No founder feedback submitted for this session.";
  }

  return feedback.summary;
}
