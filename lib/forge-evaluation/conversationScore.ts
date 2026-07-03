import type { WorkingMemory } from "@/lib/athena/types";
import { runCortex } from "@/lib/forge-cortex";
import { getAverageConfidence } from "@/lib/forge-cortex/understand";
import { detectContradictions } from "@/lib/forge-cortex/contradictions";
import { detectBlindspots } from "@/lib/forge-cortex/blindspots";
import { buildObservedKnowledge } from "@/lib/forge-cortex/observe";
import type { ConfidenceScores } from "@/lib/forge-cortex/types";

import type { ConversationEvaluation } from "./types";

const BLINDSPOT_TOPIC_KEYWORDS: Record<string, RegExp[]> = {
  pricing: [/\b(pric(e|ing)|subscription|fee|charge|ARPU)\b/i],
  competition: [/\b(competitor|alternative|incumbent|versus|vs\.?)\b/i],
  distribution: [/\b(distribut|channel|partner|marketplace)\b/i],
  regulation: [/\b(regulat|compliance|GDPR|HIPAA|legal)\b/i],
  technology: [/\b(tech|stack|API|infrastructure|AI|ML)\b/i],
  customerAcquisition: [/\b(acquisition|CAC|funnel|marketing|growth)\b/i],
  revenue: [/\b(revenue|MRR|ARR|moneti[sz]e|unit economics)\b/i],
  goToMarket: [/\b(go[- ]?to[- ]?market|GTM|launch plan|positioning)\b/i],
};

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function buildMemoryPrefix(
  memory: WorkingMemory,
  turnCount: number,
): WorkingMemory {
  return {
    ...memory,
    conversation: memory.conversation.slice(0, turnCount),
    pendingQuestion: null,
  };
}

function replayConfidenceSnapshots(memory: WorkingMemory): ConfidenceScores[] {
  const snapshots: ConfidenceScores[] = [];

  for (let index = 0; index <= memory.conversation.length; index += 1) {
    const prefix = buildMemoryPrefix(memory, index);
    snapshots.push(runCortex(prefix).confidence);
  }

  return snapshots;
}

function computeConfidenceGrowth(snapshots: ConfidenceScores[]): number {
  if (snapshots.length < 2) {
    return 0;
  }

  const initial = getAverageConfidence(snapshots[0]);
  const final = getAverageConfidence(snapshots[snapshots.length - 1]);

  return Math.max(0, final - initial);
}

function computeUnderstandingProgress(
  initial: ConfidenceScores,
  final: ConfidenceScores,
): number {
  const dimensions = Object.keys(final) as (keyof ConfidenceScores)[];
  const improvements = dimensions.map(
    (dimension) => Math.max(0, final[dimension] - initial[dimension]),
  );
  const totalImprovement = improvements.reduce((sum, value) => sum + value, 0);

  return clampScore(totalImprovement / dimensions.length);
}

function computeBlindSpotsCovered(memory: WorkingMemory): number {
  const observed = buildObservedKnowledge(memory);
  const blindspots = detectBlindspots(observed, memory);

  if (blindspots.length === 0) {
    return 100;
  }

  const corpus = [
    observed.transcript,
    ...memory.conversation.map((turn) => `${turn.questionText} ${turn.answer}`),
  ].join(" ");

  const totalTopics = Object.keys(BLINDSPOT_TOPIC_KEYWORDS).length;
  let covered = 0;

  for (const [topic, patterns] of Object.entries(BLINDSPOT_TOPIC_KEYWORDS)) {
    const wasBlindspot = blindspots.some((spot) => spot.topic === topic);

    if (!wasBlindspot || patterns.some((pattern) => pattern.test(corpus))) {
      covered += 1;
    }
  }

  return clampScore((covered / totalTopics) * 100);
}

function computeContradictionsResolved(memory: WorkingMemory): number {
  const contradictions = detectContradictions(memory.conversation);

  if (contradictions.length === 0) {
    return 100;
  }

  const clarifyTurns = memory.conversation.filter((turn) =>
    turn.id.startsWith("clarify-"),
  ).length;
  const resolutionRatio = clarifyTurns / contradictions.length;

  return clampScore(Math.min(100, resolutionRatio * 100));
}

export function evaluateConversation(
  memory: WorkingMemory,
): ConversationEvaluation {
  const questionCount = memory.conversation.length;
  const snapshots = replayConfidenceSnapshots(memory);
  const initial = snapshots[0] ?? runCortex(memory).confidence;
  const final =
    snapshots[snapshots.length - 1] ?? runCortex(memory).confidence;

  const understandingProgress = computeUnderstandingProgress(initial, final);
  const confidenceGrowth = computeConfidenceGrowth(snapshots);
  const totalInformationGain = memory.conversation.reduce(
    (sum, turn) => sum + turn.estimatedInformationGain,
    0,
  );
  const informationGain =
    questionCount === 0 ? 0 : clampScore(totalInformationGain / questionCount);
  const questionEfficiency =
    questionCount === 0
      ? 0
      : clampScore((understandingProgress + confidenceGrowth) / questionCount);
  const contradictionsResolved = computeContradictionsResolved(memory);
  const blindSpotsCovered = computeBlindSpotsCovered(memory);

  const overallScore = clampScore(
    understandingProgress * 0.25 +
      confidenceGrowth * 0.2 +
      questionEfficiency * 0.15 +
      informationGain * 0.15 +
      contradictionsResolved * 0.1 +
      blindSpotsCovered * 0.15,
  );

  const summary =
    questionCount === 0
      ? "No conversation turns to evaluate."
      : `Evaluated ${questionCount} question(s). Understanding improved ${understandingProgress} points on average. Confidence grew ${confidenceGrowth} points. ${blindSpotsCovered}% of critical topics addressed.`;

  return {
    understandingProgress,
    confidenceGrowth,
    questionEfficiency,
    informationGain,
    contradictionsResolved,
    blindSpotsCovered,
    overallScore,
    summary,
  };
}
