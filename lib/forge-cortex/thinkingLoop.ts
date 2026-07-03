import type { WorkingMemory } from "@/lib/athena/types";

import { detectAssumptions } from "./assumptions";
import { detectContradictions } from "./contradictions";
import { extractFounderDNA } from "./founderDNA";
import { evaluateEvidence } from "./evidence";
import { detectBlindspots } from "./blindspots";
import { identifyKnowledgeGaps } from "./knowledgeGap";
import { assessConversationQuality } from "./conversationQuality";
import { scoreOpportunity } from "./opportunity";
import { observe } from "./observe";
import { generateCandidateQuestions } from "./questionEngine";
import { rankQuestions } from "./questionRanking";
import type {
  CandidateQuestion,
  ConfidenceScores,
  CortexIntelligence,
  CortexState,
  KnowledgeGap,
} from "./types";
import {
  CONFIDENCE_THRESHOLD,
  MIN_DISCOVERY_QUESTIONS,
} from "./types";
import { isConfidenceHigh, understand } from "./understand";
import type { DetectedAssumption } from "./assumptions";
import type { DetectedContradiction } from "./contradictions";

export interface ThinkingLoopResult {
  state: CortexState;
  intelligence: CortexIntelligence;
  assumptions: DetectedAssumption[];
  contradictions: DetectedContradiction[];
  gaps: KnowledgeGap[];
  candidates: CandidateQuestion[];
  selectedQuestion: CandidateQuestion | null;
  shouldStop: boolean;
  stopReason: string | null;
}

function shouldStopDiscovery(
  memory: WorkingMemory,
  confidence: ConfidenceScores,
  assumptions: DetectedAssumption[],
  contradictions: DetectedContradiction[],
): { stop: boolean; reason: string | null } {
  if (memory.conversation.length < MIN_DISCOVERY_QUESTIONS) {
    return { stop: false, reason: null };
  }

  if (contradictions.length > 0) {
    return { stop: false, reason: null };
  }

  if (assumptions.length > 2) {
    return { stop: false, reason: null };
  }

  if (isConfidenceHigh(confidence)) {
    return {
      stop: true,
      reason:
        "Confidence across all strategic dimensions is sufficient to generate a product brief.",
    };
  }

  const lowest = Object.values(confidence).reduce((min, score) =>
    Math.min(min, score),
  );

  if (
    memory.conversation.length >= 8 &&
    lowest >= CONFIDENCE_THRESHOLD - 8
  ) {
    return {
      stop: true,
      reason:
        "Maximum practical question depth reached with acceptable confidence.",
    };
  }

  return { stop: false, reason: null };
}

export function runThinkingLoop(memory: WorkingMemory): ThinkingLoopResult {
  const observed = observe(memory);
  const confidence = understand(observed);

  const founderDNA = extractFounderDNA(observed, memory);
  const evidence = evaluateEvidence(observed, memory);
  const blindspots = detectBlindspots(observed, memory);

  const assumptions = detectAssumptions(observed, memory);
  const contradictions = detectContradictions(memory.conversation);
  const gaps = identifyKnowledgeGaps(confidence);

  const opportunity = scoreOpportunity({
    observed,
    confidence,
    founderDNA,
    evidence,
  });
  const conversationQuality = assessConversationQuality({
    observed,
    confidence,
    memory,
    founderDNA,
    evidence,
    contradictions,
  });

  const intelligence: CortexIntelligence = {
    founderDNA,
    evidence,
    blindspots,
    opportunity,
    conversationQuality,
  };

  const candidates = generateCandidateQuestions({
    memory,
    observed,
    confidence,
    gaps,
    assumptions,
    contradictions,
    evidence,
    blindspots,
  });
  const ranked = rankQuestions(candidates);
  const stopDecision = shouldStopDiscovery(
    memory,
    confidence,
    assumptions,
    contradictions,
  );

  const state: CortexState = {
    sessionId: memory.sessionId,
    observed,
    confidence,
    lowestGap: gaps[0],
    updatedAt: memory.updatedAt,
  };

  return {
    state,
    intelligence,
    assumptions,
    contradictions,
    gaps,
    candidates,
    selectedQuestion: stopDecision.stop ? null : ranked.selected,
    shouldStop: stopDecision.stop,
    stopReason: stopDecision.reason,
  };
}
