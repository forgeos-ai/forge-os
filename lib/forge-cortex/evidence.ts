import type { WorkingMemory } from "@/lib/athena/types";

import type { ObservedKnowledge } from "./types";

export type EvidenceType =
  | "personalExperience"
  | "customerInterview"
  | "marketResearch"
  | "assumption"
  | "unknown";

export interface EvaluatedClaim {
  id: string;
  statement: string;
  evidenceType: EvidenceType;
  evidenceScore: number;
  reason: string;
  dimension: string;
  needsFollowUp: boolean;
}

export interface EvidenceAssessment {
  claims: EvaluatedClaim[];
  averageScore: number;
  weakClaims: EvaluatedClaim[];
  summary: string;
}

export const WEAK_EVIDENCE_THRESHOLD = 45;

const CLAIM_PATTERNS = [
  {
    pattern:
      /\b(will|would|should|definitely|guaranteed|obviously|clearly|everyone|all users|huge demand|no competition)\b/i,
    baseType: "assumption" as EvidenceType,
    baseScore: 25,
    reason: "Claim uses certainty language without cited evidence.",
  },
  {
    pattern:
      /\b(i (talked|spoke|interviewed)|customer(s)? (said|told|shared)|user interview|feedback from)\b/i,
    baseType: "customerInterview" as EvidenceType,
    baseScore: 75,
    reason: "Customer conversation evidence referenced.",
  },
  {
    pattern:
      /\b(market research|survey|study|report|data shows|according to|industry|analyst)\b/i,
    baseType: "marketResearch" as EvidenceType,
    baseScore: 70,
    reason: "Market research or external data referenced.",
  },
  {
    pattern:
      /\b(i experienced|i faced|personally|in my (job|role|career)|when i worked)\b/i,
    baseType: "personalExperience" as EvidenceType,
    baseScore: 65,
    reason: "Personal or professional experience cited.",
  },
];

const QUANTIFIER_PATTERN = /\b\d+\+?\s*(customer|user|founder|company|interview|conversation|survey)\b/i;
const SPECIFICITY_PATTERN =
  /\b(specifically|named|example|last week|yesterday|last month|pilot|beta|LOI|letter of intent)\b/i;

function splitClaims(text: string): string[] {
  if (!text.trim()) {
    return [];
  }

  return text
    .split(/[.!?\n]+/)
    .map((segment) => segment.trim())
    .filter((segment) => segment.length > 12);
}

function classifyClaim(
  statement: string,
  dimension: string,
  index: number,
): EvaluatedClaim {
  let evidenceType: EvidenceType = "unknown";
  let evidenceScore = 20;
  let reason = "No clear evidence type detected for this claim.";

  for (const entry of CLAIM_PATTERNS) {
    if (entry.pattern.test(statement)) {
      evidenceType = entry.baseType;
      evidenceScore = entry.baseScore;
      reason = entry.reason;
      break;
    }
  }

  if (QUANTIFIER_PATTERN.test(statement)) {
    evidenceScore = Math.min(100, evidenceScore + 15);
    reason = `${reason} Quantified reference strengthens evidence.`;
  }

  if (SPECIFICITY_PATTERN.test(statement)) {
    evidenceScore = Math.min(100, evidenceScore + 10);
    reason = `${reason} Specific example cited.`;
  }

  if (evidenceType === "unknown" && statement.length > 40) {
    evidenceScore = 35;
    reason = "Claim stated without identifiable evidence source.";
  }

  const needsFollowUp = evidenceScore < WEAK_EVIDENCE_THRESHOLD;

  return {
    id: `claim-${dimension}-${index}`,
    statement: statement.slice(0, 200),
    evidenceType,
    evidenceScore,
    reason,
    dimension,
    needsFollowUp,
  };
}

function buildEvidenceSummary(claims: EvaluatedClaim[]): string {
  if (claims.length === 0) {
    return "No evaluable claims detected yet. Evidence assessment will improve as the founder shares specifics.";
  }

  const weakCount = claims.filter((claim) => claim.needsFollowUp).length;
  const typeCounts = claims.reduce<Record<EvidenceType, number>>(
    (counts, claim) => {
      counts[claim.evidenceType] = (counts[claim.evidenceType] ?? 0) + 1;
      return counts;
    },
    {
      personalExperience: 0,
      customerInterview: 0,
      marketResearch: 0,
      assumption: 0,
      unknown: 0,
    },
  );

  const dominant = (Object.entries(typeCounts) as [EvidenceType, number][])
    .sort((left, right) => right[1] - left[1])
    .find(([, count]) => count > 0)?.[0];

  return `${claims.length} claim(s) evaluated. Dominant evidence type: ${dominant ?? "none"}. ${weakCount} claim(s) need stronger validation.`;
}

export function evaluateEvidence(
  observed: ObservedKnowledge,
  memory: WorkingMemory,
): EvidenceAssessment {
  const sources = [
    { text: observed.problem, dimension: "problem" },
    { text: observed.customer, dimension: "customer" },
    { text: observed.proposedSolution, dimension: "businessModel" },
    { text: observed.successGoal, dimension: "goals" },
    { text: observed.currentSolution, dimension: "competition" },
    ...memory.conversation.map((turn) => ({
      text: turn.answer,
      dimension: turn.targetDimension,
    })),
  ];

  const claims: EvaluatedClaim[] = [];

  sources.forEach((source) => {
    const segments = splitClaims(source.text);

    segments.forEach((segment, index) => {
      const claim = classifyClaim(segment, source.dimension, index);

      if (
        claim.evidenceType !== "unknown" ||
        /\b(will|everyone|guaranteed|people will|no competition|huge)\b/i.test(
          segment,
        )
      ) {
        claims.push(claim);
      }
    });
  });

  const uniqueClaims = claims.filter((claim, index, list) => {
    return list.findIndex((entry) => entry.statement === claim.statement) === index;
  });

  const limitedClaims = uniqueClaims.slice(0, 8);
  const averageScore =
    limitedClaims.length === 0
      ? 0
      : Math.round(
          limitedClaims.reduce((sum, claim) => sum + claim.evidenceScore, 0) /
            limitedClaims.length,
        );
  const weakClaims = limitedClaims.filter((claim) => claim.needsFollowUp);

  return {
    claims: limitedClaims,
    averageScore,
    weakClaims,
    summary: buildEvidenceSummary(limitedClaims),
  };
}
