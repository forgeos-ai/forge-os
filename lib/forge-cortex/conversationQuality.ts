import type { WorkingMemory } from "@/lib/athena/types";

import type { DetectedContradiction } from "./contradictions";
import type { EvidenceAssessment } from "./evidence";
import type { FounderDNAProfile } from "./founderDNA";
import type { ConfidenceScores, ObservedKnowledge } from "./types";

export interface QualityDimension {
  dimension: string;
  score: number;
  confidence: number;
  notes: string;
}

export interface ConversationQualityReport {
  specificity: QualityDimension;
  consistency: QualityDimension;
  evidence: QualityDimension;
  vision: QualityDimension;
  executionReadiness: QualityDimension;
  overall: number;
  summary: string;
}

const SPECIFICITY_PATTERNS = [
  /\b\d+%?\b/,
  /\b\d+\s*(day|days|week|weeks|month|months|user|users|customer|customers)\b/i,
  /\b(specifically|named|example|measurable|reduce|increase)\b/i,
];

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function scoreSpecificity(
  observed: ObservedKnowledge,
  confidence: ConfidenceScores,
): QualityDimension {
  const corpus = [
    observed.problem,
    observed.customer,
    observed.proposedSolution,
    observed.successGoal,
  ].join(" ");

  const patternHits = SPECIFICITY_PATTERNS.filter((pattern) =>
    pattern.test(corpus),
  ).length;
  const avgConfidence = Math.round(
    (confidence.problem + confidence.customer + confidence.goals) / 3,
  );
  const score = clampScore(avgConfidence * 0.7 + patternHits * 8);

  return {
    dimension: "Specificity",
    score,
    confidence: avgConfidence,
    notes:
      patternHits > 0
        ? "Founder uses numbers, examples, or measurable language."
        : "Answers tend toward generalities — specificity can improve decision quality.",
  };
}

function scoreConsistency(
  contradictions: DetectedContradiction[],
  questionCount: number,
): QualityDimension {
  const penalty = contradictions.length * 25;
  const score = clampScore(100 - penalty);
  const confidence = Math.min(100, 40 + questionCount * 8);

  return {
    dimension: "Consistency",
    score,
    confidence,
    notes:
      contradictions.length > 0
        ? `${contradictions.length} contradiction(s) detected — narrative needs reconciliation.`
        : "No major contradictions detected across answers.",
  };
}

function scoreEvidenceQuality(evidence: EvidenceAssessment): QualityDimension {
  const claimCount = evidence.claims.length;
  const confidence = claimCount > 0 ? Math.min(100, 30 + claimCount * 10) : 10;

  return {
    dimension: "Evidence",
    score: evidence.averageScore,
    confidence,
    notes:
      evidence.weakClaims.length > 0
        ? `${evidence.weakClaims.length} claim(s) rely on weak or assumed evidence.`
        : evidence.claims.length > 0
          ? "Claims are supported by identifiable evidence types."
          : "Insufficient claims to evaluate evidence quality.",
  };
}

function scoreVision(
  founderDNA: FounderDNAProfile,
  observed: ObservedKnowledge,
  confidence: ConfidenceScores,
): QualityDimension {
  const visionSignal = founderDNA.signals.find(
    (signal) => signal.dimension === "longTermVision",
  );
  const motivationSignal = founderDNA.signals.find(
    (signal) => signal.dimension === "founderMotivation",
  );

  let score = confidence.goals * 0.5;
  let notes = "Vision and motivation are not yet clearly articulated.";

  if (visionSignal) {
    score += visionSignal.confidence * 0.3;
    notes = "Long-term vision signals detected in founder responses.";
  }

  if (motivationSignal) {
    score += motivationSignal.confidence * 0.2;
    notes = "Founder motivation is visible; vision clarity can still deepen.";
  }

  if (!observed.successGoal.trim() && !visionSignal) {
    return {
      dimension: "Vision",
      score: 0,
      confidence: 0,
      notes: "No success goals or vision stated yet.",
    };
  }

  return {
    dimension: "Vision",
    score: clampScore(score),
    confidence: Math.max(
      visionSignal?.confidence ?? 0,
      motivationSignal?.confidence ?? 0,
      confidence.goals,
    ),
    notes,
  };
}

function scoreExecutionReadiness(
  observed: ObservedKnowledge,
  confidence: ConfidenceScores,
): QualityDimension {
  const readinessConfidence = Math.round(
    (confidence.goals + confidence.businessModel + confidence.problem) / 3,
  );
  let score = readinessConfidence * 0.6;

  if (observed.mvp.trim()) {
    score += 20;
  }

  if (observed.proposedSolution.trim()) {
    score += 10;
  }

  const notes =
    observed.mvp.trim() && observed.proposedSolution.trim()
      ? "MVP scope and solution direction are taking shape."
      : observed.mvp.trim() || observed.proposedSolution.trim()
        ? "Partial execution clarity — MVP or solution needs more definition."
        : "Execution readiness is low — solution and MVP not yet defined.";

  if (!observed.mvp.trim() && !observed.proposedSolution.trim()) {
    return {
      dimension: "Execution Readiness",
      score: 0,
      confidence: 0,
      notes,
    };
  }

  return {
    dimension: "Execution Readiness",
    score: clampScore(score),
    confidence: readinessConfidence,
    notes,
  };
}

export function assessConversationQuality(input: {
  observed: ObservedKnowledge;
  confidence: ConfidenceScores;
  memory: WorkingMemory;
  founderDNA: FounderDNAProfile;
  evidence: EvidenceAssessment;
  contradictions: DetectedContradiction[];
}): ConversationQualityReport {
  const specificity = scoreSpecificity(input.observed, input.confidence);
  const consistency = scoreConsistency(
    input.contradictions,
    input.observed.questionCount,
  );
  const evidence = scoreEvidenceQuality(input.evidence);
  const vision = scoreVision(
    input.founderDNA,
    input.observed,
    input.confidence,
  );
  const executionReadiness = scoreExecutionReadiness(
    input.observed,
    input.confidence,
  );

  const dimensions = [
    specificity,
    consistency,
    evidence,
    vision,
    executionReadiness,
  ];
  const scored = dimensions.filter((dimension) => dimension.confidence > 0);
  const overall =
    scored.length === 0
      ? 0
      : clampScore(
          scored.reduce((sum, dimension) => sum + dimension.score, 0) /
            scored.length,
        );

  const summary =
    overall === 0
      ? "Conversation quality cannot be assessed yet — continue discovery."
      : `Overall conversation quality: ${overall}/100 across ${scored.length} dimension(s). Quality reflects clarity and evidence, not idea merit.`;

  return {
    specificity,
    consistency,
    evidence,
    vision,
    executionReadiness,
    overall,
    summary,
  };
}
