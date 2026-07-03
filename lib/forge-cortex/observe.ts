import type { WorkingMemory } from "@/lib/athena/types";

import type { CortexInput, ObservedKnowledge, ConfidenceDimension } from "./types";

const BUYER_SIGNAL_PATTERN =
  /\b(buyer|purchaser|decision[- ]?maker|budget holder|procurement|economic buyer|pay(s|ing)? for|sign(s)? the check)\b/i;

const ROLE_SIGNAL_PATTERN =
  /\b(CTO|CEO|CFO|VP|founder|manager|director|head of|team lead|small business owner)\b/i;

function normalizeText(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

function aggregateDimensionAnswers(
  conversation: WorkingMemory["conversation"],
  dimension: ConfidenceDimension,
): string {
  return conversation
    .filter((turn) => turn.targetDimension === dimension)
    .map((turn) => turn.answer.trim())
    .filter(Boolean)
    .join(" ");
}

function deriveBuyer(customer: string, businessModel: string): string {
  const combined = `${customer} ${businessModel}`.trim();

  if (!combined) {
    return "";
  }

  if (BUYER_SIGNAL_PATTERN.test(customer)) {
    return normalizeText(customer);
  }

  if (ROLE_SIGNAL_PATTERN.test(customer)) {
    return `Likely buyer profile: ${normalizeText(customer)}`;
  }

  if (BUYER_SIGNAL_PATTERN.test(businessModel)) {
    return normalizeText(businessModel);
  }

  return "";
}

export function buildObservedKnowledge(memory: WorkingMemory): ObservedKnowledge {
  const conversation = memory.conversation;
  const customer = aggregateDimensionAnswers(conversation, "customer");
  const proposedSolution = aggregateDimensionAnswers(conversation, "businessModel");
  const lastTurn = memory.conversation.at(-1) ?? null;

  return {
    problem: aggregateDimensionAnswers(conversation, "problem"),
    customer,
    buyer: deriveBuyer(customer, proposedSolution),
    currentSolution: aggregateDimensionAnswers(conversation, "competition"),
    frustrations: aggregateDimensionAnswers(conversation, "competition"),
    proposedSolution,
    mvp: aggregateDimensionAnswers(conversation, "goals"),
    successGoal: aggregateDimensionAnswers(conversation, "goals"),
    answeredQuestionIds: conversation.map((turn) => turn.id),
    transcript: conversation
      .map(
        (turn) =>
          `Q (${turn.targetDimension}): ${turn.questionText}\nA: ${turn.answer}`,
      )
      .join("\n\n"),
    questionCount: conversation.length,
    lastAnswer: lastTurn?.answer ?? "",
  };
}

export function observe(input: CortexInput): ObservedKnowledge {
  return buildObservedKnowledge(input);
}

export function observeFromMemory(memory: WorkingMemory): ObservedKnowledge {
  return observe(memory);
}
