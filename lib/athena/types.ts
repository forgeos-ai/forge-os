export type QuestionId =
  | "problem"
  | "customer"
  | "current-solution"
  | "frustration"
  | "proposed-solution"
  | "mvp"
  | "success-goal";

export type AnalysisDimension = keyof AnalysisResult;

export type DiscoveryStatus = "idle" | "discovering" | "complete";

export interface Question {
  id: QuestionId;
  order: number;
  text: string;
  dimension: AnalysisDimension;
}

export interface FounderAnswer {
  questionId: QuestionId;
  rawValue: string;
  normalizedValue: string;
  recordedAt: Date;
}

export interface WorkingMemory {
  sessionId: string;
  createdAt: Date;
  updatedAt: Date;
  status: DiscoveryStatus;
  currentQuestionIndex: number;
  answers: Partial<Record<QuestionId, FounderAnswer>>;
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

export interface ProductBriefMetadata {
  sessionId: string;
  generatedAt: Date;
  version: string;
  source: "deterministic";
}

export interface ProductBrief {
  startupIdea: string;
  problem: string;
  customer: string;
  currentSolution: string;
  frustrations: string;
  proposedSolution: string;
  mvp: string;
  successGoal: string;
  metadata: ProductBriefMetadata;
}

export class IncompleteDiscoveryError extends Error {
  readonly missingQuestionIds: QuestionId[];

  constructor(missingQuestionIds: QuestionId[]) {
    super(
      `Discovery is incomplete. Missing answers for: ${missingQuestionIds.join(", ")}`,
    );
    this.name = "IncompleteDiscoveryError";
    this.missingQuestionIds = missingQuestionIds;
  }
}
