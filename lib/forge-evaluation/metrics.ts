import type { WorkingMemory } from "@/lib/athena/types";
import { buildCortexIntelligence } from "@/lib/forge-cortex/intelligence";
import { runCortex } from "@/lib/forge-cortex";
import { getAverageConfidence } from "@/lib/forge-cortex/understand";

import { evaluateConversation } from "./conversationScore";
import type {
  EvaluationMetrics,
  FounderFeedback,
  QuestionEvaluationContext,
} from "./types";
import type { QuestionQualityReport } from "./types";
import type { ConversationEvaluation } from "./types";
import type { TrustReport } from "./types";

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function computeUnderstandingEfficiencyScore(
  conversation: ConversationEvaluation,
  questionCount: number,
): number {
  if (questionCount === 0) {
    return 0;
  }

  const understandingImprovement =
    conversation.understandingProgress + conversation.confidenceGrowth;

  return clampScore(understandingImprovement / questionCount);
}

export function computeQuestionValueScore(
  questionQuality: QuestionQualityReport[],
  questionCount: number,
): number {
  if (questionCount === 0) {
    return 0;
  }

  const totalGain = questionQuality.reduce(
    (sum, report) => sum + report.informationGainScore,
    0,
  );

  return clampScore(totalGain / questionCount);
}

export interface RQIInput {
  averageQuestionQuality: number;
  trustScore: number;
  conversationScore: number;
  evidenceScore: number;
}

export function computeReasoningQualityIndex(input: RQIInput): number {
  return clampScore(
    input.averageQuestionQuality * 0.3 +
      input.trustScore * 0.25 +
      input.conversationScore * 0.25 +
      input.evidenceScore * 0.2,
  );
}

export function computeEvaluationMetrics(input: {
  memory: WorkingMemory;
  questionQuality: QuestionQualityReport[];
  conversation: ConversationEvaluation;
  trust: TrustReport;
}): EvaluationMetrics {
  const questionCount = input.memory.conversation.length;
  const intelligence = buildCortexIntelligence(input.memory);
  const averageQuestionQuality =
    input.questionQuality.length === 0
      ? 0
      : input.questionQuality.reduce(
          (sum, report) => sum + report.overallScore,
          0,
        ) / input.questionQuality.length;

  return {
    understandingEfficiencyScore: computeUnderstandingEfficiencyScore(
      input.conversation,
      questionCount,
    ),
    questionValueScore: computeQuestionValueScore(
      input.questionQuality,
      questionCount,
    ),
    reasoningQualityIndex: computeReasoningQualityIndex({
      averageQuestionQuality,
      trustScore: input.trust.overallScore,
      conversationScore: input.conversation.overallScore,
      evidenceScore: intelligence.evidence.averageScore,
    }),
  };
}

export function buildQuestionEvaluationContexts(
  memory: WorkingMemory,
): QuestionEvaluationContext[] {
  return memory.conversation.map((turn, index) => {
    const priorTranscript = memory.conversation
      .slice(0, index)
      .map(
        (entry) =>
          `Q (${entry.targetDimension}): ${entry.questionText}\nA: ${entry.answer}`,
      )
      .join("\n\n");

    return {
      questionText: turn.questionText,
      questionId: turn.id,
      reason: turn.reason,
      targetDimension: turn.targetDimension,
      estimatedInformationGain: turn.estimatedInformationGain,
      turnIndex: index,
      priorTranscript,
    };
  });
}

export function computeUnderstandingImprovement(memory: WorkingMemory): number {
  if (memory.conversation.length === 0) {
    return 0;
  }

  const initial = getAverageConfidence(runCortex(buildMemoryPrefix(memory, 0)).confidence);
  const final = getAverageConfidence(runCortex(memory).confidence);

  return Math.max(0, final - initial);
}

function buildMemoryPrefix(memory: WorkingMemory, turnCount: number): WorkingMemory {
  return {
    ...memory,
    conversation: memory.conversation.slice(0, turnCount),
    pendingQuestion: null,
  };
}
