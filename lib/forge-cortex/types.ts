import type { WorkingMemory } from "@/lib/athena/types";

export type ConfidenceDimension =
  | "problem"
  | "customer"
  | "buyer"
  | "businessModel"
  | "competition"
  | "goals";

export type ConfidenceScore = number;

export interface ConfidenceScores {
  problem: ConfidenceScore;
  customer: ConfidenceScore;
  buyer: ConfidenceScore;
  businessModel: ConfidenceScore;
  competition: ConfidenceScore;
  goals: ConfidenceScore;
}

export interface ObservedKnowledge {
  problem: string;
  customer: string;
  buyer: string;
  currentSolution: string;
  frustrations: string;
  proposedSolution: string;
  mvp: string;
  successGoal: string;
  answeredQuestionIds: string[];
  transcript: string;
  questionCount: number;
  lastAnswer: string;
}

export interface CandidateQuestion {
  id: string;
  question: string;
  reason: string;
  estimatedInformationGain: number;
  targetDimension: ConfidenceDimension;
}

export interface KnowledgeGap {
  dimension: ConfidenceDimension;
  score: ConfidenceScore;
  reason: string;
}

export interface CortexState {
  sessionId: string;
  observed: ObservedKnowledge;
  confidence: ConfidenceScores;
  lowestGap: KnowledgeGap;
  updatedAt: Date;
}

export interface RankedQuestionResult {
  selected: CandidateQuestion | null;
  ranked: CandidateQuestion[];
}

export type CortexInput = WorkingMemory;

export const CONFIDENCE_DIMENSIONS: readonly ConfidenceDimension[] = [
  "problem",
  "customer",
  "buyer",
  "businessModel",
  "competition",
  "goals",
] as const;

export const CONFIDENCE_THRESHOLD = 72;

export const MIN_DISCOVERY_QUESTIONS = 3;

export const DIMENSION_PRIORITY: readonly ConfidenceDimension[] = [
  "problem",
  "customer",
  "goals",
  "businessModel",
  "competition",
  "buyer",
] as const;

import type { FounderDNAProfile } from "./founderDNA";
import type { EvidenceAssessment } from "./evidence";
import type { DetectedBlindspot } from "./blindspots";
import type { OpportunityScore } from "./opportunity";
import type { ConversationQualityReport } from "./conversationQuality";

export type {
  FounderDNAProfile,
  FounderDNASignal,
  FounderDNADimension,
} from "./founderDNA";
export type {
  EvidenceAssessment,
  EvaluatedClaim,
  EvidenceType,
} from "./evidence";
export type { DetectedBlindspot, BlindSpotTopic } from "./blindspots";
export type {
  OpportunityScore,
  OpportunityDimensionScore,
} from "./opportunity";
export type {
  ConversationQualityReport,
  QualityDimension,
} from "./conversationQuality";

export interface CortexIntelligence {
  founderDNA: FounderDNAProfile;
  evidence: EvidenceAssessment;
  blindspots: DetectedBlindspot[];
  opportunity: OpportunityScore;
  conversationQuality: ConversationQualityReport;
}
