import type { Question, QuestionId } from "./types";

export const DISCOVERY_QUESTIONS: readonly Question[] = [
  {
    id: "problem",
    order: 1,
    text: "What problem are you trying to solve?",
    dimension: "problem",
  },
  {
    id: "customer",
    order: 2,
    text: "Who experiences this problem the most?",
    dimension: "customer",
  },
  {
    id: "current-solution",
    order: 3,
    text: "How do they solve it today?",
    dimension: "currentSolution",
  },
  {
    id: "frustration",
    order: 4,
    text: "What's frustrating about today's solution?",
    dimension: "frustration",
  },
  {
    id: "proposed-solution",
    order: 5,
    text: "Describe your solution in one sentence.",
    dimension: "proposedSolution",
  },
  {
    id: "mvp",
    order: 6,
    text: "What's the smallest version you could launch in 30 days?",
    dimension: "mvp",
  },
  {
    id: "success-goal",
    order: 7,
    text: "If everything goes well, what would success look like after 90 days?",
    dimension: "successGoal",
  },
] as const;

export const DISCOVERY_QUESTION_COUNT = DISCOVERY_QUESTIONS.length;

const QUESTION_BY_ID = new Map<QuestionId, Question>(
  DISCOVERY_QUESTIONS.map((question) => [question.id, question]),
);

export function getQuestionById(id: QuestionId): Question {
  const question = QUESTION_BY_ID.get(id);
  if (!question) {
    throw new Error(`Unknown question id: ${id}`);
  }
  return question;
}

export function getQuestionByOrder(order: number): Question | undefined {
  return DISCOVERY_QUESTIONS.find((question) => question.order === order);
}

export function getQuestionByIndex(index: number): Question {
  const question = DISCOVERY_QUESTIONS[index];
  if (!question) {
    throw new Error(`Question index out of range: ${index}`);
  }
  return question;
}
