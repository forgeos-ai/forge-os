import type { FounderDNAProfile } from "./founderDNA";
import type { EvidenceAssessment } from "./evidence";
import type { ConfidenceScores, ObservedKnowledge } from "./types";

export interface OpportunityDimensionScore {
  dimension: string;
  score: number;
  confidence: number;
  explanation: string;
}

export interface OpportunityScore {
  problemSeverity: OpportunityDimensionScore;
  founderFit: OpportunityDimensionScore;
  marketPull: OpportunityDimensionScore;
  executionDifficulty: OpportunityDimensionScore;
  validationLevel: OpportunityDimensionScore;
  overall: OpportunityDimensionScore;
  summary: string;
}

const PAIN_SEVERITY_PATTERNS = [
  /\b(urgent|critical|expensive|costs|losing|waste|painful|broken|failing)\b/i,
  /\b(\$\d+|\d+\s*(hours?|days?)|every (day|week|month))\b/i,
];

const MARKET_PULL_PATTERNS = [
  /\b(demand|waiting|asked for|pull|inbound|referral|pre[- ]?order|LOI)\b/i,
  /\b(\d+\+?\s*(customer|user|company|founder)s?\s*(want|need|asked))\b/i,
];

const EXECUTION_COMPLEXITY_PATTERNS = [
  /\b(platform|ecosystem|marketplace|hardware|regulated|enterprise|global)\b/i,
  /\b(AI|machine learning|blockchain|infrastructure|multi[- ]?sided)\b/i,
];

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function scoreProblemSeverity(
  observed: ObservedKnowledge,
  confidence: ConfidenceScores,
): OpportunityDimensionScore {
  const problemConfidence = confidence.problem;
  let score = problemConfidence * 0.6;
  let explanation = `Problem severity based on problem clarity (${problemConfidence}% confidence).`;

  const corpus = `${observed.problem} ${observed.frustrations}`;

  if (PAIN_SEVERITY_PATTERNS.some((pattern) => pattern.test(corpus))) {
    score += 20;
    explanation +=
      " Urgency or cost signals detected in founder language.";
  }

  if (!observed.problem.trim()) {
    return {
      dimension: "Problem Severity",
      score: 0,
      confidence: 0,
      explanation:
        "Problem Severity: no problem articulated yet — cannot score.",
    };
  }

  return {
    dimension: "Problem Severity",
    score: clampScore(score),
    confidence: problemConfidence,
    explanation,
  };
}

function scoreFounderFit(
  founderDNA: FounderDNAProfile,
  confidence: ConfidenceScores,
): OpportunityDimensionScore {
  const experienceBoost =
    founderDNA.signals.some(
      (signal) =>
        signal.dimension === "personalExperience" ||
        signal.dimension === "professionalExperience" ||
        signal.dimension === "domainExpertise",
    )
      ? 15
      : 0;

  const base = founderDNA.overallConfidence * 0.7 + experienceBoost;
  const fitConfidence = Math.max(
    founderDNA.overallConfidence,
    Math.round((confidence.problem + confidence.customer) / 2),
  );

  return {
    dimension: "Founder Fit",
    score: clampScore(base),
    confidence: fitConfidence,
    explanation:
      founderDNA.signals.length > 0
        ? `Founder Fit: ${founderDNA.signals.length} DNA signal(s) detected with ${founderDNA.overallConfidence}% overall DNA confidence.`
        : "Founder Fit: founder background and motivation not yet established.",
  };
}

function scoreMarketPull(
  observed: ObservedKnowledge,
  confidence: ConfidenceScores,
  evidence: EvidenceAssessment,
): OpportunityDimensionScore {
  const customerConfidence = confidence.customer;
  let score = customerConfidence * 0.5;
  let explanation = `Market Pull: customer clarity at ${customerConfidence}% confidence.`;

  const corpus = `${observed.customer} ${observed.successGoal}`;

  if (MARKET_PULL_PATTERNS.some((pattern) => pattern.test(corpus))) {
    score += 25;
    explanation += " Demand or pull signals referenced.";
  }

  const interviewClaims = evidence.claims.filter(
    (claim) => claim.evidenceType === "customerInterview",
  );

  if (interviewClaims.length > 0) {
    score += 15;
    explanation += ` ${interviewClaims.length} customer interview claim(s) strengthen pull evidence.`;
  }

  if (!observed.customer.trim()) {
    return {
      dimension: "Market Pull",
      score: 0,
      confidence: 0,
      explanation: "Market Pull: target customer not defined — cannot assess pull.",
    };
  }

  return {
    dimension: "Market Pull",
    score: clampScore(score),
    confidence: customerConfidence,
    explanation,
  };
}

function scoreExecutionDifficulty(
  observed: ObservedKnowledge,
  confidence: ConfidenceScores,
): OpportunityDimensionScore {
  const goalsConfidence = confidence.goals;
  const modelConfidence = confidence.businessModel;
  let difficulty = 50;
  let explanation =
    "Execution Difficulty: baseline moderate — insufficient scope detail.";

  const corpus = `${observed.proposedSolution} ${observed.mvp}`;

  if (EXECUTION_COMPLEXITY_PATTERNS.some((pattern) => pattern.test(corpus))) {
    difficulty += 25;
    explanation =
      "Execution Difficulty: elevated — complex scope or technology signals detected.";
  }

  if (goalsConfidence >= 72 && modelConfidence >= 60) {
    difficulty -= 15;
    explanation =
      "Execution Difficulty: reduced — MVP and business model are reasonably defined.";
  }

  if (!observed.mvp.trim() && !observed.proposedSolution.trim()) {
    return {
      dimension: "Execution Difficulty",
      score: 0,
      confidence: 0,
      explanation:
        "Execution Difficulty: no solution or MVP scope described — cannot assess.",
    };
  }

  const executionScore = clampScore(100 - difficulty);

  return {
    dimension: "Execution Difficulty",
    score: executionScore,
    confidence: Math.round((goalsConfidence + modelConfidence) / 2),
    explanation: `${explanation} Higher score means easier execution.`,
  };
}

function scoreValidationLevel(
  evidence: EvidenceAssessment,
  confidence: ConfidenceScores,
): OpportunityDimensionScore {
  const avgConfidence = Math.round(
    Object.values(confidence).reduce((sum, value) => sum + value, 0) /
      Object.values(confidence).length,
  );

  const evidenceBoost = evidence.averageScore * 0.4;
  const score = clampScore(evidence.averageScore * 0.6 + avgConfidence * 0.4);

  return {
    dimension: "Validation Level",
    score,
    confidence: avgConfidence,
    explanation:
      evidence.claims.length > 0
        ? `Validation Level: ${evidence.claims.length} claim(s) evaluated, average evidence score ${evidence.averageScore}%.`
        : "Validation Level: no evaluable claims yet — validation is minimal.",
  };
}

function buildOverallScore(
  dimensions: OpportunityDimensionScore[],
): OpportunityDimensionScore {
  const scored = dimensions.filter((dimension) => dimension.confidence > 0);

  if (scored.length === 0) {
    return {
      dimension: "Overall Opportunity",
      score: 0,
      confidence: 0,
      explanation:
        "Overall Opportunity: insufficient discovery to compute — continue the session.",
    };
  }

  const totalWeight = scored.reduce((sum, dimension) => sum + dimension.confidence, 0);
  const weightedScore = scored.reduce(
    (sum, dimension) => sum + dimension.score * dimension.confidence,
    0,
  );
  const score = clampScore(weightedScore / totalWeight);
  const confidence = Math.round(totalWeight / scored.length);

  return {
    dimension: "Overall Opportunity",
    score,
    confidence,
    explanation: `Overall Opportunity: weighted average across ${scored.length} scored dimension(s). Confidence reflects data availability, not market guarantee.`,
  };
}

export function scoreOpportunity(input: {
  observed: ObservedKnowledge;
  confidence: ConfidenceScores;
  founderDNA: FounderDNAProfile;
  evidence: EvidenceAssessment;
}): OpportunityScore {
  const problemSeverity = scoreProblemSeverity(input.observed, input.confidence);
  const founderFit = scoreFounderFit(input.founderDNA, input.confidence);
  const marketPull = scoreMarketPull(
    input.observed,
    input.confidence,
    input.evidence,
  );
  const executionDifficulty = scoreExecutionDifficulty(
    input.observed,
    input.confidence,
  );
  const validationLevel = scoreValidationLevel(input.evidence, input.confidence);

  const overall = buildOverallScore([
    problemSeverity,
    founderFit,
    marketPull,
    executionDifficulty,
    validationLevel,
  ]);

  const summary =
    overall.confidence === 0
      ? "Opportunity assessment pending — more discovery required before scoring."
      : `Overall opportunity score: ${overall.score}/100 (confidence: ${overall.confidence}%). Based only on stated founder inputs — not market research.`;

  return {
    problemSeverity,
    founderFit,
    marketPull,
    executionDifficulty,
    validationLevel,
    overall,
    summary,
  };
}
