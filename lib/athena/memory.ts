import { buildCortexIntelligence } from "@/lib/forge-cortex/intelligence";
import { buildObservedKnowledge } from "@/lib/forge-cortex/observe";
import { identifyKnowledgeGap } from "@/lib/forge-cortex/knowledgeGap";
import { getAverageConfidence, understand } from "@/lib/forge-cortex/understand";
import type {
  ConfidenceDimension,
} from "@/lib/forge-cortex/types";

import type {
  ConversationTurn,
  DiscoveryContext,
  PendingQuestion,
  WorkingMemory,
} from "./types";

function createSessionId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `athena-${Date.now()}`;
}

function aggregateDimensionAnswers(
  conversation: ConversationTurn[],
  dimension: ConfidenceDimension,
): string {
  return conversation
    .filter((turn) => turn.targetDimension === dimension)
    .map((turn) => turn.answer.trim())
    .filter(Boolean)
    .join(" ");
}

export function createWorkingMemory(now: Date = new Date()): WorkingMemory {
  return {
    sessionId: createSessionId(),
    createdAt: now,
    updatedAt: now,
    status: "idle",
    conversation: [],
    pendingQuestion: null,
  };
}

export function setPendingQuestion(
  memory: WorkingMemory,
  question: PendingQuestion,
  now: Date = new Date(),
): WorkingMemory {
  return {
    ...memory,
    updatedAt: now,
    status: "discovering",
    pendingQuestion: question,
  };
}

export function recordAnswer(
  memory: WorkingMemory,
  answer: string,
  now: Date = new Date(),
): WorkingMemory {
  const pending = memory.pendingQuestion;

  if (!pending) {
    throw new Error("No pending question to answer.");
  }

  const turn: ConversationTurn = {
    id: pending.id,
    questionText: pending.questionText,
    answer: answer.trim(),
    reason: pending.reason,
    targetDimension: pending.targetDimension,
    estimatedInformationGain: pending.estimatedInformationGain,
    askedAt: pending.askedAt,
    answeredAt: now,
  };

  return {
    ...memory,
    updatedAt: now,
    status: "discovering",
    conversation: [...memory.conversation, turn],
    pendingQuestion: null,
  };
}

export function markReadyForBrief(
  memory: WorkingMemory,
  now: Date = new Date(),
): WorkingMemory {
  return {
    ...memory,
    updatedAt: now,
    status: "ready-for-brief",
    pendingQuestion: null,
  };
}

export function markComplete(
  memory: WorkingMemory,
  now: Date = new Date(),
): WorkingMemory {
  return {
    ...memory,
    updatedAt: now,
    status: "complete",
    pendingQuestion: null,
  };
}

export function buildDiscoveryContext(memory: WorkingMemory): DiscoveryContext {
  const conversation = memory.conversation;
  const observed = buildObservedKnowledge(memory);
  const confidence = understand(observed);
  const lowestGap = identifyKnowledgeGap(confidence);

  return {
    problem: aggregateDimensionAnswers(conversation, "problem"),
    customer: aggregateDimensionAnswers(conversation, "customer"),
    buyer: observed.buyer,
    currentAlternatives: aggregateDimensionAnswers(conversation, "competition"),
    frustrations: aggregateDimensionAnswers(conversation, "competition"),
    proposedSolution: aggregateDimensionAnswers(conversation, "businessModel"),
    mvp: aggregateDimensionAnswers(conversation, "goals"),
    successGoal: aggregateDimensionAnswers(conversation, "goals"),
    transcript: observed.transcript,
    confidence: {
      scores: confidence,
      average: getAverageConfidence(confidence),
      lowestDimension: lowestGap.dimension,
      lowestScore: lowestGap.score,
    },
    intelligence: buildCortexIntelligence(memory),
  };
}

export function getLastConversationTurn(
  memory: WorkingMemory,
): ConversationTurn | null {
  return memory.conversation.at(-1) ?? null;
}

export function getQuestionRationale(
  memory: WorkingMemory,
  questionId?: string,
): string | null {
  if (questionId) {
    const turn = memory.conversation.find((entry) => entry.id === questionId);
    if (turn) {
      return turn.reason;
    }

    if (memory.pendingQuestion?.id === questionId) {
      return memory.pendingQuestion.reason;
    }

    return null;
  }

  if (memory.pendingQuestion) {
    return memory.pendingQuestion.reason;
  }

  return getLastConversationTurn(memory)?.reason ?? null;
}
