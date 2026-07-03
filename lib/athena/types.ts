import type {
  ConfidenceDimension,
  ConfidenceScores,
} from "@/lib/forge-cortex/types";

export type DiscoveryStatus =
  | "idle"
  | "discovering"
  | "ready-for-brief"
  | "complete";

export interface ConversationTurn {
  id: string;
  questionText: string;
  answer: string;
  reason: string;
  targetDimension: ConfidenceDimension;
  estimatedInformationGain: number;
  askedAt: Date;
  answeredAt: Date;
}

export interface PendingQuestion {
  id: string;
  questionText: string;
  reason: string;
  targetDimension: ConfidenceDimension;
  estimatedInformationGain: number;
  askedAt: Date;
}

export interface WorkingMemory {
  sessionId: string;
  createdAt: Date;
  updatedAt: Date;
  status: DiscoveryStatus;
  conversation: ConversationTurn[];
  pendingQuestion: PendingQuestion | null;
}

export interface DiscoveryConfidenceContext {
  scores: ConfidenceScores;
  average: number;
  lowestDimension: ConfidenceDimension;
  lowestScore: number;
}

import type { CortexIntelligence } from "@/lib/forge-cortex/types";

export type DiscoveryIntelligence = CortexIntelligence;

export interface DiscoveryContext {
  problem: string;
  customer: string;
  buyer: string;
  currentAlternatives: string;
  frustrations: string;
  proposedSolution: string;
  mvp: string;
  successGoal: string;
  transcript: string;
  confidence: DiscoveryConfidenceContext;
  intelligence: DiscoveryIntelligence;
}

export interface ProductBriefMetadata {
  sessionId: string;
  generatedAt: Date;
  version: string;
  source: "deterministic" | "ai-gateway";
}

export interface ProductBrief {
  startupVision: string;
  problem: string;
  customer: string;
  buyer: string;
  currentAlternatives: string;
  keyAssumptions: string;
  businessModel: string;
  risks: string;
  mvp30Day: string;
  successMetrics: string;
  recommendedNextSteps: string;
  metadata: ProductBriefMetadata;
}

export class IncompleteDiscoveryError extends Error {
  constructor(message = "Discovery is not complete.") {
    super(message);
    this.name = "IncompleteDiscoveryError";
  }
}

// Legacy types retained for backward compatibility in analyzer exports.
export type QuestionId =
  | "problem"
  | "customer"
  | "current-solution"
  | "frustration"
  | "proposed-solution"
  | "mvp"
  | "success-goal";

export interface FounderAnswer {
  questionId: QuestionId;
  rawValue: string;
  normalizedValue: string;
  recordedAt: Date;
}

export interface AnalysisResult {
  problem: string;
  customer: string;
  currentSolution: string;
  frustration: string;
  proposedSolution: string;
  mvp: string;
  successGoal: string;
}
