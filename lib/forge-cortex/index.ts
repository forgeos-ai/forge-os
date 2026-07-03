export type {
  CandidateQuestion,
  ConfidenceDimension,
  ConfidenceScore,
  ConfidenceScores,
  CortexInput,
  CortexState,
  KnowledgeGap,
  ObservedKnowledge,
  RankedQuestionResult,
} from "./types";

export {
  CONFIDENCE_DIMENSIONS,
  CONFIDENCE_THRESHOLD,
  DIMENSION_PRIORITY,
  MIN_DISCOVERY_QUESTIONS,
} from "./types";

export { observe, observeFromMemory } from "./observe";

export {
  getAverageConfidence,
  isConfidenceHigh,
  understand,
} from "./understand";

export {
  getGapForDimension,
  identifyKnowledgeGap,
  identifyKnowledgeGaps,
} from "./knowledgeGap";

export {
  estimateInformationGain,
  rankQuestions,
  selectBestQuestion,
} from "./questionRanking";

export { detectAssumptions, hasUnvalidatedAssumptions } from "./assumptions";
export { detectContradictions, hasContradictions } from "./contradictions";
export { generateCandidateQuestions } from "./questionEngine";
export type { QuestionEngineInput } from "./questionEngine";
export { runThinkingLoop } from "./thinkingLoop";
export type { ThinkingLoopResult } from "./thinkingLoop";

export { applyValidation, validate } from "./validate";

export { extractFounderDNA } from "./founderDNA";
export { evaluateEvidence, WEAK_EVIDENCE_THRESHOLD } from "./evidence";
export { detectBlindspots, getBlindspotObjective } from "./blindspots";
export { scoreOpportunity } from "./opportunity";
export { assessConversationQuality } from "./conversationQuality";
export { buildCortexIntelligence } from "./intelligence";
export { buildObservedKnowledge } from "./observe";

export type {
  CortexIntelligence,
  FounderDNAProfile,
  FounderDNASignal,
  FounderDNADimension,
  EvidenceAssessment,
  EvaluatedClaim,
  EvidenceType,
  DetectedBlindspot,
  BlindSpotTopic,
  OpportunityScore,
  OpportunityDimensionScore,
  ConversationQualityReport,
  QualityDimension,
} from "./types";

import type { WorkingMemory } from "@/lib/athena/types";

import { buildObservedKnowledge } from "./observe";
import { identifyKnowledgeGap } from "./knowledgeGap";
import type { CortexState } from "./types";
import { understand } from "./understand";

export function runCortex(memory: WorkingMemory): CortexState {
  const observed = buildObservedKnowledge(memory);
  const confidence = understand(observed);
  const lowestGap = identifyKnowledgeGap(confidence);

  return {
    sessionId: memory.sessionId,
    observed,
    confidence,
    lowestGap,
    updatedAt: memory.updatedAt,
  };
}
