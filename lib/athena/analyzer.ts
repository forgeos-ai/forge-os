import { DISCOVERY_QUESTIONS } from "./questions";
import type {
  AnalysisResult,
  FounderAnswer,
  QuestionId,
  WorkingMemory,
} from "./types";

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

export function getMissingQuestionIds(
  memory: WorkingMemory,
): QuestionId[] {
  return DISCOVERY_QUESTIONS.filter(
    (question) => !isAnswerComplete(memory.answers[question.id]),
  ).map((question) => question.id);
}

export function isAnswerComplete(
  answer: FounderAnswer | undefined,
): answer is FounderAnswer {
  return answer !== undefined && answer.normalizedValue.length > 0;
}

export function isDiscoveryComplete(memory: WorkingMemory): boolean {
  return getMissingQuestionIds(memory).length === 0;
}

export function analyzeWorkingMemory(memory: WorkingMemory): AnalysisResult {
  return analyzeAnswers(
    DISCOVERY_QUESTIONS.map((question) => memory.answers[question.id]).filter(
      (answer): answer is FounderAnswer => isAnswerComplete(answer),
    ),
  );
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
