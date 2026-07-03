import type { ConversationTurn, WorkingMemory } from "@/lib/athena/types";

import type { ObservedKnowledge } from "./types";

export interface DetectedAssumption {
  id: string;
  statement: string;
  dimension: string;
  reason: string;
}

const ASSUMPTION_PATTERNS = [
  {
    pattern: /\b(everyone|all founders|all users|every business|the market)\b/i,
    reason: "Broad generalization detected — needs a specific customer or use case.",
  },
  {
    pattern: /\b(will definitely|guaranteed|no competition|no one else|obviously)\b/i,
    reason: "Strong certainty without evidence — assumption should be validated.",
  },
  {
    pattern: /\b(people will pay|easy to sell|huge demand)\b/i,
    reason: "Demand and willingness-to-pay are assumed but not yet evidenced.",
  },
  {
    pattern: /\b(just need to build|if we build it|once we launch)\b/i,
    reason: "Solution risk assumed low — distribution and adoption need validation.",
  },
];

export function detectAssumptions(
  observed: ObservedKnowledge,
  memory: WorkingMemory,
): DetectedAssumption[] {
  const assumptions: DetectedAssumption[] = [];
  const sources = [
    { text: observed.problem, dimension: "problem" },
    { text: observed.customer, dimension: "customer" },
    { text: observed.proposedSolution, dimension: "businessModel" },
    { text: observed.successGoal, dimension: "goals" },
    ...memory.conversation.map((turn) => ({
      text: turn.answer,
      dimension: turn.targetDimension,
    })),
  ];

  sources.forEach((source, index) => {
    if (!source.text.trim()) {
      return;
    }

    ASSUMPTION_PATTERNS.forEach((entry, patternIndex) => {
      if (entry.pattern.test(source.text)) {
        assumptions.push({
          id: `assumption-${index}-${patternIndex}`,
          statement: source.text.slice(0, 160),
          dimension: source.dimension,
          reason: entry.reason,
        });
      }
    });
  });

  return assumptions.slice(0, 3);
}

export function hasUnvalidatedAssumptions(
  assumptions: DetectedAssumption[],
): boolean {
  return assumptions.length > 0;
}
