import {
  analyzeWorkingMemory,
  createFounderAnswer,
  getMissingQuestionIds,
  isDiscoveryComplete,
} from "./analyzer";
import { composeProductBrief, createProductBriefMetadata } from "./brief";
import { DISCOVERY_QUESTIONS, getQuestionById } from "./questions";
import type {
  FounderAnswer,
  ProductBrief,
  QuestionId,
  WorkingMemory,
} from "./types";
import { IncompleteDiscoveryError } from "./types";

function createSessionId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `athena-${Date.now()}`;
}

function resolveQuestionIndex(questionId: QuestionId): number {
  return DISCOVERY_QUESTIONS.findIndex((question) => question.id === questionId);
}

export function createWorkingMemory(now: Date = new Date()): WorkingMemory {
  return {
    sessionId: createSessionId(),
    createdAt: now,
    updatedAt: now,
    status: "idle",
    currentQuestionIndex: 0,
    answers: {},
  };
}

export function updateWorkingMemory(
  memory: WorkingMemory,
  questionId: QuestionId,
  rawValue: string,
  now: Date = new Date(),
): WorkingMemory {
  getQuestionById(questionId);

  const answer = createFounderAnswer(questionId, rawValue, now);
  const questionIndex = resolveQuestionIndex(questionId);

  const answers: Partial<Record<QuestionId, FounderAnswer>> = {
    ...memory.answers,
    [questionId]: answer,
  };

  const nextMemory: WorkingMemory = {
    ...memory,
    updatedAt: now,
    answers,
    currentQuestionIndex: Math.max(memory.currentQuestionIndex, questionIndex),
    status: "discovering",
  };

  if (isDiscoveryComplete(nextMemory)) {
    return {
      ...nextMemory,
      status: "complete",
      currentQuestionIndex: DISCOVERY_QUESTIONS.length - 1,
    };
  }

  return nextMemory;
}

export function generateProductBrief(memory: WorkingMemory): ProductBrief {
  const missingQuestionIds = getMissingQuestionIds(memory);

  if (missingQuestionIds.length > 0) {
    throw new IncompleteDiscoveryError(missingQuestionIds);
  }

  const analysis = analyzeWorkingMemory(memory);
  const metadata = createProductBriefMetadata(memory.sessionId, memory.updatedAt);

  return composeProductBrief(analysis, metadata);
}

export type { FounderAnswer, ProductBrief, WorkingMemory };
export { IncompleteDiscoveryError };
