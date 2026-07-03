import type { WorkingMemory } from "@/lib/athena/types";

import type { DetectedAssumption } from "./assumptions";
import type { DetectedContradiction } from "./contradictions";
import type { DetectedBlindspot } from "./blindspots";
import { getBlindspotObjective } from "./blindspots";
import type { EvidenceAssessment } from "./evidence";
import { estimateInformationGain } from "./questionRanking";
import type {
  CandidateQuestion,
  ConfidenceDimension,
  ConfidenceScores,
  KnowledgeGap,
  ObservedKnowledge,
} from "./types";

const DIMENSION_OBJECTIVES: Record<
  ConfidenceDimension,
  { objective: string; reason: string }[]
> = {
  problem: [
    {
      objective:
        "Describe the specific pain point, when it happens, and what it costs the customer in time, money, or risk.",
      reason:
        "Problem clarity is still low. We need concrete pain before recommending anything.",
    },
    {
      objective:
        "Walk through the last time this problem occurred for a real customer — what triggered it and what happened next?",
      reason:
        "We need a real-world example to validate the problem is urgent and recurring.",
    },
  ],
  customer: [
    {
      objective:
        "Describe one specific person who experiences this problem — their role, context, and how often they face it.",
      reason:
        "Customer definition is too vague. Precision here prevents building for everyone.",
    },
    {
      objective:
        "Within that group, who feels this pain most acutely and cannot easily work around it?",
      reason:
        "We need to identify the highest-pain segment, not a broad audience.",
    },
  ],
  buyer: [
    {
      objective:
        "Who has authority to approve budget for solving this problem, and what event would trigger that decision?",
      reason:
        "Buyer dynamics are unclear. A product can fail even with a real user pain if no one pays.",
    },
    {
      objective:
        "What budget source or approval process would fund this solution in your target customer?",
      reason:
        "We need to understand purchasing mechanics before shaping the business model.",
    },
  ],
  businessModel: [
    {
      objective:
        "How would this product make money — who pays, for what value, and on what cadence?",
      reason:
        "The path to revenue is not yet clear from current answers.",
    },
    {
      objective:
        "What is the simplest pricing or monetization model that fits how customers already buy similar value?",
      reason:
        "Business model clarity is required before scoping an MVP.",
    },
  ],
  competition: [
    {
      objective:
        "What do customers use today to solve this problem, including manual workarounds and direct competitors?",
      reason:
        "Competitive context is thin. Differentiation requires understanding current alternatives.",
    },
    {
      objective:
        "What is most frustrating about those existing approaches, and where do they break down?",
      reason:
        "We need to pinpoint the gap competitors leave open.",
    },
  ],
  goals: [
    {
      objective:
        "What measurable outcome would define success 90 days after launch — with a specific number or milestone?",
      reason:
        "Success metrics are not specific enough to guide execution.",
    },
    {
      objective:
        "What is the smallest shippable version you could launch in 30 days that tests the core value hypothesis?",
      reason:
        "MVP scope needs to be ruthlessly defined to reduce execution risk.",
    },
  ],
};

export interface QuestionEngineInput {
  memory: WorkingMemory;
  observed: ObservedKnowledge;
  confidence: ConfidenceScores;
  gaps: KnowledgeGap[];
  assumptions: DetectedAssumption[];
  contradictions: DetectedContradiction[];
  evidence: EvidenceAssessment;
  blindspots: DetectedBlindspot[];
}

function buildContradictionCandidate(
  contradiction: DetectedContradiction,
): CandidateQuestion {
  return {
    id: `clarify-${contradiction.id}`,
    question: `Help me reconcile these two points: "${contradiction.earlier}" and "${contradiction.later}". Which is more accurate today?`,
    reason: contradiction.reason,
    estimatedInformationGain: 95,
    targetDimension: "problem",
  };
}

function buildAssumptionCandidate(
  assumption: DetectedAssumption,
): CandidateQuestion {
  return {
    id: `validate-${assumption.id}`,
    question: `You mentioned: "${assumption.statement}". What evidence do you have that this is true?`,
    reason: assumption.reason,
    estimatedInformationGain: 88,
    targetDimension: assumption.dimension as ConfidenceDimension,
  };
}

function buildWeakEvidenceCandidate(
  claim: EvidenceAssessment["weakClaims"][number],
  memory: WorkingMemory,
): CandidateQuestion {
  return {
    id: `evidence-${claim.id}`,
    question: `You stated: "${claim.statement}". What specific evidence supports this — customer conversations, data, or personal experience?`,
    reason: claim.reason,
    estimatedInformationGain: 92,
    targetDimension: claim.dimension as ConfidenceDimension,
  };
}

function buildBlindspotCandidate(
  blindspot: DetectedBlindspot,
  memory: WorkingMemory,
): CandidateQuestion {
  const template = getBlindspotObjective(blindspot.topic);

  return {
    id: `blindspot-${blindspot.topic}-${memory.conversation.length + 1}`,
    question: template.objective,
    reason: blindspot.reason,
    estimatedInformationGain: Math.min(100, blindspot.criticality),
    targetDimension: blindspot.suggestedDimension,
  };
}

function buildGapCandidate(
  gap: KnowledgeGap,
  memory: WorkingMemory,
): CandidateQuestion {
  const templates =
    DIMENSION_OBJECTIVES[gap.dimension] ?? DIMENSION_OBJECTIVES.problem;
  const templateIndex = Math.min(
    memory.conversation.filter((turn) => turn.targetDimension === gap.dimension)
      .length,
    templates.length - 1,
  );
  const template = templates[templateIndex];

  return {
    id: `${gap.dimension}-${memory.conversation.length + 1}`,
    question: template.objective,
    reason: template.reason,
    estimatedInformationGain: estimateInformationGain(gap.score),
    targetDimension: gap.dimension,
  };
}

export function generateCandidateQuestions(
  input: QuestionEngineInput,
): CandidateQuestion[] {
  const candidates: CandidateQuestion[] = [];

  input.contradictions.forEach((contradiction) => {
    candidates.push(buildContradictionCandidate(contradiction));
  });

  input.evidence.weakClaims.forEach((claim) => {
    candidates.push(buildWeakEvidenceCandidate(claim, input.memory));
  });

  input.assumptions.forEach((assumption) => {
    candidates.push(buildAssumptionCandidate(assumption));
  });

  input.blindspots.slice(0, 3).forEach((blindspot) => {
    candidates.push(buildBlindspotCandidate(blindspot, input.memory));
  });

  input.gaps.forEach((gap) => {
    if (gap.score < 72) {
      candidates.push(buildGapCandidate(gap, input.memory));
    }
  });

  if (candidates.length === 0 && input.memory.conversation.length === 0) {
    const starter = DIMENSION_OBJECTIVES.problem[0];
    candidates.push({
      id: `problem-1`,
      question: starter.objective,
      reason: starter.reason,
      estimatedInformationGain: 100,
      targetDimension: "problem",
    });
  }

  const seen = new Set<string>();

  return candidates.filter((candidate) => {
    const key = `${candidate.targetDimension}:${candidate.question}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}
