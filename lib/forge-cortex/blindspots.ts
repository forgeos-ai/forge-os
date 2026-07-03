import type { WorkingMemory } from "@/lib/athena/types";

import type { ConfidenceDimension, ObservedKnowledge } from "./types";

export type BlindSpotTopic =
  | "pricing"
  | "competition"
  | "distribution"
  | "regulation"
  | "technology"
  | "customerAcquisition"
  | "revenue"
  | "goToMarket";

export interface DetectedBlindspot {
  topic: BlindSpotTopic;
  label: string;
  criticality: number;
  reason: string;
  suggestedDimension: ConfidenceDimension;
}

const BLINDSPOT_DEFINITIONS: {
  topic: BlindSpotTopic;
  label: string;
  patterns: RegExp[];
  baseCriticality: number;
  reason: string;
  suggestedDimension: ConfidenceDimension;
}[] = [
  {
    topic: "pricing",
    label: "Pricing",
    patterns: [
      /\b(pric(e|ing)|subscription|freemium|cost|fee|charge|ARPU|willingness to pay)\b/i,
    ],
    baseCriticality: 88,
    reason: "Pricing strategy has not been discussed — revenue model risk is high.",
    suggestedDimension: "businessModel",
  },
  {
    topic: "competition",
    label: "Competition",
    patterns: [
      /\b(competitor|alternative|incumbent|existing (tool|solution)|substitute|versus|vs\.?)\b/i,
    ],
    baseCriticality: 90,
    reason: "Competitive landscape not addressed — differentiation is unclear.",
    suggestedDimension: "competition",
  },
  {
    topic: "distribution",
    label: "Distribution",
    patterns: [
      /\b(distribut(e|ion)|channel|partner|reseller|marketplace|platform|app store)\b/i,
    ],
    baseCriticality: 82,
    reason: "Distribution channels not discussed — reach strategy is unknown.",
    suggestedDimension: "businessModel",
  },
  {
    topic: "regulation",
    label: "Regulation",
    patterns: [
      /\b(regulat(ion|ory)|compliance|GDPR|HIPAA|legal|license|permit|FDA|SEC)\b/i,
    ],
    baseCriticality: 70,
    reason: "Regulatory or compliance factors not mentioned.",
    suggestedDimension: "competition",
  },
  {
    topic: "technology",
    label: "Technology",
    patterns: [
      /\b(tech(nology)?|stack|API|infrastructure|AI model|ML|platform|build|engineer)\b/i,
    ],
    baseCriticality: 75,
    reason: "Technical approach and feasibility not discussed.",
    suggestedDimension: "businessModel",
  },
  {
    topic: "customerAcquisition",
    label: "Customer Acquisition",
    patterns: [
      /\b(acqui(re|sition)|CAC|funnel|lead|outbound|inbound|ads|marketing|growth)\b/i,
    ],
    baseCriticality: 92,
    reason: "Customer acquisition strategy not addressed — growth path is unclear.",
    suggestedDimension: "goals",
  },
  {
    topic: "revenue",
    label: "Revenue",
    patterns: [
      /\b(revenue|MRR|ARR|moneti[sz]e|income|sales|paying customer|unit economics)\b/i,
    ],
    baseCriticality: 91,
    reason: "Revenue mechanics not discussed — business viability is uncertain.",
    suggestedDimension: "businessModel",
  },
  {
    topic: "goToMarket",
    label: "Go-To-Market",
    patterns: [
      /\b(go[- ]?to[- ]?market|GTM|launch (plan|strategy)|positioning|messaging|ICP)\b/i,
    ],
    baseCriticality: 85,
    reason: "Go-to-market strategy not articulated.",
    suggestedDimension: "goals",
  },
];

const BLINDSPOT_OBJECTIVES: Record<BlindSpotTopic, { objective: string; reason: string }> =
  {
    pricing: {
      objective:
        "How would you price this — what would a customer pay, and what value justifies that price?",
      reason:
        "Pricing has not been discussed. Revenue viability depends on a credible price point.",
    },
    competition: {
      objective:
        "What alternatives exist today, and why would a customer switch to your approach?",
      reason:
        "Competitive context is missing. Differentiation requires understanding incumbents.",
    },
    distribution: {
      objective:
        "How will customers discover and access your product — what is the primary distribution channel?",
      reason:
        "Distribution is a blind spot. Building without a reach strategy increases adoption risk.",
    },
    regulation: {
      objective:
        "Are there regulatory, compliance, or legal constraints that could affect this business?",
      reason:
        "Regulatory factors have not been explored — hidden constraints can block execution.",
    },
    technology: {
      objective:
        "What is the core technical approach, and what makes it feasible to build in 30–90 days?",
      reason:
        "Technical feasibility is unclear. Execution risk needs grounding in a realistic build plan.",
    },
    customerAcquisition: {
      objective:
        "How will you acquire your first 10 paying customers — what channel and message will you use?",
      reason:
        "Customer acquisition is unaddressed. Growth strategy is a critical blind spot.",
    },
    revenue: {
      objective:
        "How does this business generate revenue — who pays, when, and for what specific value?",
      reason:
        "Revenue mechanics are missing. Without this, the business model cannot be evaluated.",
    },
    goToMarket: {
      objective:
        "What is your go-to-market plan for the first 90 days — positioning, channel, and launch sequence?",
      reason:
        "Go-to-market strategy not discussed. Launch without GTM clarity increases failure risk.",
    },
  };

export function getBlindspotObjective(
  topic: BlindSpotTopic,
): { objective: string; reason: string } {
  return BLINDSPOT_OBJECTIVES[topic];
}

export function detectBlindspots(
  observed: ObservedKnowledge,
  memory: WorkingMemory,
): DetectedBlindspot[] {
  const corpus = [
    observed.problem,
    observed.customer,
    observed.proposedSolution,
    observed.currentSolution,
    observed.frustrations,
    observed.mvp,
    observed.successGoal,
    observed.transcript,
    ...memory.conversation.map(
      (turn) => `${turn.questionText} ${turn.answer}`,
    ),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  const blindspots: DetectedBlindspot[] = [];

  for (const definition of BLINDSPOT_DEFINITIONS) {
    const mentioned = definition.patterns.some((pattern) => pattern.test(corpus));

    if (!mentioned) {
      const depthPenalty = Math.max(0, 15 - observed.questionCount * 2);
      blindspots.push({
        topic: definition.topic,
        label: definition.label,
        criticality: Math.max(50, definition.baseCriticality - depthPenalty),
        reason: definition.reason,
        suggestedDimension: definition.suggestedDimension,
      });
    }
  }

  return blindspots.sort((left, right) => right.criticality - left.criticality);
}
