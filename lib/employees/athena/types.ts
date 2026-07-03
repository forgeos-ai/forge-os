import type { AIProductBrief, AIProviderId } from "@/lib/ai/types";
import type { ConfidenceScores } from "@/lib/forge-cortex/types";
import type { DiscoveryStatus } from "@/lib/athena/types";

export interface AthenaConfidenceDto {
  average: number;
  lowestDimension: string;
  lowestScore: number;
  scores: ConfidenceScores;
}

export interface AthenaQuestionDto {
  id: string;
  text: string;
}

export interface AthenaSessionResponse {
  sessionId: string;
  status: DiscoveryStatus;
  question: AthenaQuestionDto;
  confidence: AthenaConfidenceDto;
  questionNumber: number;
}

export interface AthenaAnswerResponse {
  sessionId: string;
  status: DiscoveryStatus;
  question: AthenaQuestionDto | null;
  confidence: AthenaConfidenceDto;
  questionNumber: number;
  readyForBrief: boolean;
}

export interface AthenaBriefResponse {
  sessionId: string;
  brief: AIProductBrief;
  provider: AIProviderId;
}

export interface AthenaRationaleResponse {
  sessionId: string;
  questionId: string;
  rationale: string;
}

export class AthenaServiceError extends Error {
  readonly code: string;
  readonly statusCode: number;

  constructor(message: string, code: string, statusCode = 400) {
    super(message);
    this.name = "AthenaServiceError";
    this.code = code;
    this.statusCode = statusCode;
  }
}

export class AthenaSessionNotFoundError extends AthenaServiceError {
  constructor(sessionId: string) {
    super(`Session not found: ${sessionId}`, "SESSION_NOT_FOUND", 404);
    this.name = "AthenaSessionNotFoundError";
  }
}
