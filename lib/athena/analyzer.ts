import { buildDiscoveryContext } from "./memory";
import type { AnalysisResult, FounderAnswer, QuestionId, WorkingMemory } from "./types";

function normalizeAnswer(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

export function createFounderAnswer(
  questionId: QuestionId,
  rawValue: string,
  recordedAt: Date = new Date(),
): FounderAnswer {
  return {
    questionId,
    rawValue,
    normalizedValue: normalizeAnswer(rawValue),
    recordedAt,
  };
}

export function isAnswerComplete(answer: string | undefined): boolean {
  return typeof answer === "string" && answer.trim().length > 0;
}

export function isDiscoveryComplete(memory: WorkingMemory): boolean {
  return memory.status === "ready-for-brief" || memory.status === "complete";
}

export function analyzeWorkingMemory(memory: WorkingMemory): AnalysisResult {
  const context = buildDiscoveryContext(memory);

  return {
    problem: context.problem,
    customer: context.customer,
    currentSolution: context.currentAlternatives,
    frustration: context.frustrations,
    proposedSolution: context.proposedSolution,
    mvp: context.mvp,
    successGoal: context.successGoal,
  };
}

export function analyzeAnswers(answers: FounderAnswer[]): AnalysisResult {
  const answersByQuestionId = new Map(
    answers.map((answer) => [answer.questionId, answer]),
  );

  const read = (questionId: QuestionId): string =>
    answersByQuestionId.get(questionId)?.normalizedValue ?? "";

  return {
    problem: read("problem"),
    customer: read("customer"),
    currentSolution: read("current-solution"),
    frustration: read("frustration"),
    proposedSolution: read("proposed-solution"),
    mvp: read("mvp"),
    successGoal: read("success-goal"),
  };
}

export function getMissingQuestionIds(): QuestionId[] {
  return [];
}
