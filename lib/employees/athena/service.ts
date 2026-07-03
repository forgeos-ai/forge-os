import "server-only";

import { generateProductBrief } from "@/lib/ai/gateway";
import { isAnswerComplete } from "@/lib/athena/analyzer";
import {
  createWorkingMemory,
  updateWorkingMemory,
} from "@/lib/athena/brain";
import { DISCOVERY_QUESTIONS } from "@/lib/athena/questions";
import type { Question, QuestionId, WorkingMemory } from "@/lib/athena/types";
import { IncompleteDiscoveryError } from "@/lib/athena/types";

import { deleteSession, getSession, saveSession } from "./sessionStore";
import type {
  AthenaAnswerResponse,
  AthenaBriefResponse,
  AthenaSessionResponse,
} from "./types";
import {
  AthenaServiceError,
  AthenaSessionNotFoundError,
} from "./types";
import type { EmployeeProgress, EmployeeQuestionDto } from "../types";

const QUESTION_IDS = new Set<QuestionId>(
  DISCOVERY_QUESTIONS.map((question) => question.id),
);

function toQuestionDto(question: Question): EmployeeQuestionDto {
  return {
    id: question.id,
    order: question.order,
    text: question.text,
  };
}

function getProgress(memory: WorkingMemory): EmployeeProgress {
  const answeredCount = DISCOVERY_QUESTIONS.filter((question) =>
    isAnswerComplete(memory.answers[question.id]),
  ).length;

  return {
    current: Math.min(answeredCount + 1, DISCOVERY_QUESTIONS.length),
    total: DISCOVERY_QUESTIONS.length,
  };
}

function getNextQuestion(memory: WorkingMemory): Question | null {
  for (const question of DISCOVERY_QUESTIONS) {
    if (!isAnswerComplete(memory.answers[question.id])) {
      return question;
    }
  }

  return null;
}

function assertValidQuestionId(questionId: string): asserts questionId is QuestionId {
  if (!QUESTION_IDS.has(questionId as QuestionId)) {
    throw new AthenaServiceError(
      `Invalid question id: ${questionId}`,
      "INVALID_QUESTION_ID",
    );
  }
}

function requireSession(sessionId: string): WorkingMemory {
  const memory = getSession(sessionId);

  if (!memory) {
    throw new AthenaSessionNotFoundError(sessionId);
  }

  return memory;
}

export function startAthenaSession(): AthenaSessionResponse {
  const memory = createWorkingMemory();
  const firstQuestion = DISCOVERY_QUESTIONS[0];

  saveSession({
    ...memory,
    status: "discovering",
  });

  return {
    sessionId: memory.sessionId,
    status: "discovering",
    progress: {
      current: 1,
      total: DISCOVERY_QUESTIONS.length,
    },
    question: toQuestionDto(firstQuestion),
  };
}

export function submitAthenaAnswer(
  sessionId: string,
  questionId: string,
  answer: string,
): AthenaAnswerResponse {
  assertValidQuestionId(questionId);

  const trimmedAnswer = answer.trim();

  if (!trimmedAnswer) {
    throw new AthenaServiceError("Answer cannot be empty.", "EMPTY_ANSWER");
  }

  const memory = requireSession(sessionId);
  const updatedMemory = updateWorkingMemory(memory, questionId, trimmedAnswer);

  saveSession(updatedMemory);

  const nextQuestion = getNextQuestion(updatedMemory);
  const readyForBrief = updatedMemory.status === "complete";

  return {
    sessionId: updatedMemory.sessionId,
    status: updatedMemory.status,
    progress: getProgress(updatedMemory),
    nextQuestion: nextQuestion ? toQuestionDto(nextQuestion) : null,
    readyForBrief,
  };
}

export async function generateAthenaBrief(
  sessionId: string,
): Promise<AthenaBriefResponse> {
  const memory = requireSession(sessionId);

  if (memory.status !== "complete") {
    throw new AthenaServiceError(
      "Discovery is not complete. Answer all questions before generating a brief.",
      "DISCOVERY_INCOMPLETE",
    );
  }

  try {
    const result = await generateProductBrief({ memory });

    return {
      sessionId,
      brief: result.data,
      provider: result.provider,
    };
  } catch (error) {
    if (error instanceof IncompleteDiscoveryError) {
      throw new AthenaServiceError(
        error.message,
        "DISCOVERY_INCOMPLETE",
      );
    }

    throw error;
  }
}

export function resetAthenaSession(sessionId: string): void {
  requireSession(sessionId);
  deleteSession(sessionId);
}
