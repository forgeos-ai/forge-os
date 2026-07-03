import type { AIProductBrief, AIProviderId } from "@/lib/ai/types";
import type { DiscoveryStatus, QuestionId } from "@/lib/athena/types";

import type { EmployeeProgress, EmployeeQuestionDto } from "../types";

export interface AthenaSessionResponse {
  sessionId: string;
  status: DiscoveryStatus;
  progress: EmployeeProgress;
  question: EmployeeQuestionDto;
}

export interface AthenaAnswerRequest {
  sessionId: string;
  questionId: QuestionId;
  answer: string;
}

export interface AthenaAnswerResponse {
  sessionId: string;
  status: DiscoveryStatus;
  progress: EmployeeProgress;
  nextQuestion: EmployeeQuestionDto | null;
  readyForBrief: boolean;
}

export interface AthenaBriefRequest {
  sessionId: string;
}

export interface AthenaBriefResponse {
  sessionId: string;
  brief: AIProductBrief;
  provider: AIProviderId;
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
