import type { WorkingMemory } from "@/lib/athena/types";

import { assessConversationQuality } from "./conversationQuality";
import { detectBlindspots } from "./blindspots";
import { detectContradictions } from "./contradictions";
import { evaluateEvidence } from "./evidence";
import { extractFounderDNA } from "./founderDNA";
import { scoreOpportunity } from "./opportunity";
import { buildObservedKnowledge } from "./observe";
import { understand } from "./understand";
import type { CortexIntelligence } from "./types";

export function buildCortexIntelligence(
  memory: WorkingMemory,
): CortexIntelligence {
  const observed = buildObservedKnowledge(memory);
  const confidence = understand(observed);
  const contradictions = detectContradictions(memory.conversation);
  const founderDNA = extractFounderDNA(observed, memory);
  const evidence = evaluateEvidence(observed, memory);
  const blindspots = detectBlindspots(observed, memory);
  const opportunity = scoreOpportunity({
    observed,
    confidence,
    founderDNA,
    evidence,
  });
  const conversationQuality = assessConversationQuality({
    observed,
    confidence,
    memory,
    founderDNA,
    evidence,
    contradictions,
  });

  return {
    founderDNA,
    evidence,
    blindspots,
    opportunity,
    conversationQuality,
  };
}
