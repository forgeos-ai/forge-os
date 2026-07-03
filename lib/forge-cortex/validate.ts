import type { WorkingMemory } from "@/lib/athena/types";

import { identifyKnowledgeGap } from "./knowledgeGap";
import { observe } from "./observe";
import type { CortexState } from "./types";
import { understand } from "./understand";

function buildCortexState(memory: WorkingMemory): CortexState {
  const observed = observe(memory);
  const confidence = understand(observed);
  const lowestGap = identifyKnowledgeGap(confidence);

  return {
    sessionId: memory.sessionId,
    observed,
    confidence,
    lowestGap,
    updatedAt: memory.updatedAt,
  };
}

export function validate(memory: WorkingMemory): CortexState {
  return buildCortexState(memory);
}

export function applyValidation(
  previousState: CortexState,
  memory: WorkingMemory,
): CortexState {
  const nextState = buildCortexState(memory);

  return {
    ...nextState,
    sessionId: previousState.sessionId || nextState.sessionId,
    updatedAt: memory.updatedAt,
  };
}
