import type { ConversationTurn } from "@/lib/athena/types";

export interface DetectedContradiction {
  id: string;
  earlier: string;
  later: string;
  reason: string;
}

const OPPOSING_SIGNALS: [RegExp, RegExp, string][] = [
  [
    /\b(no competition|nothing like this|unique)\b/i,
    /\b(spreadsheets|existing tools|competitors|already use)\b/i,
    "Founder claims uniqueness but also references existing alternatives.",
  ],
  [
    /\b(enterprise|large companies|fortune 500)\b/i,
    /\b(individual|solo|consumer|personal use)\b/i,
    "Customer segment signals conflict between enterprise and individual users.",
  ],
  [
    /\b(free|no budget|can't pay)\b/i,
    /\b(subscription|revenue|charge|pricing)\b/i,
    "Business model signals conflict with customer budget constraints.",
  ],
  [
    /\b(launch in (30|thirty) days|very fast)\b/i,
    /\b(complex|platform|marketplace|full suite|many features)\b/i,
    "MVP timeline may be unrealistic given solution complexity described.",
  ],
];

function compareTurns(
  earlier: ConversationTurn,
  later: ConversationTurn,
): DetectedContradiction | null {
  for (const [leftPattern, rightPattern, reason] of OPPOSING_SIGNALS) {
    const earlierMatches = leftPattern.test(earlier.answer);
    const laterMatches = rightPattern.test(later.answer);
    const reversedEarlier = rightPattern.test(earlier.answer);
    const reversedLater = leftPattern.test(later.answer);

    if (
      (earlierMatches && laterMatches) ||
      (reversedEarlier && reversedLater)
    ) {
      return {
        id: `contradiction-${earlier.id}-${later.id}`,
        earlier: earlier.answer.slice(0, 120),
        later: later.answer.slice(0, 120),
        reason,
      };
    }
  }

  return null;
}

export function detectContradictions(
  conversation: ConversationTurn[],
): DetectedContradiction[] {
  const contradictions: DetectedContradiction[] = [];

  for (let index = 1; index < conversation.length; index += 1) {
    for (let prior = 0; prior < index; prior += 1) {
      const contradiction = compareTurns(conversation[prior], conversation[index]);

      if (contradiction) {
        contradictions.push(contradiction);
      }
    }
  }

  return contradictions.slice(0, 2);
}

export function hasContradictions(contradictions: DetectedContradiction[]): boolean {
  return contradictions.length > 0;
}
