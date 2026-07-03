import { detectGenericQuestion } from "./genericQuestionDetector";
import type { QuestionEvaluationContext, QuestionQualityReport } from "./types";

const SPECIFICITY_PATTERNS = [
  /\b\d+%?\b/,
  /\b\d+\s*(day|days|week|weeks|month|months|customer|user|founder)\b/i,
  /\b(specific|example|last time|walk through|measurable|triggered)\b/i,
  /\b(who pays|budget|approval|pain point|workaround|competitor)\b/i,
];

const PROFESSIONAL_PATTERNS = [
  /\b(validate|evidence|hypothesis|segment|differentiation|economics)\b/i,
  /\b(MVP|go[- ]?to[- ]?market|pricing|revenue|buyer)\b/i,
];

const VAGUE_PATTERNS = [
  /\b(tell me about|what are your thoughts|anything else|in general)\b/i,
  /\b(idea|startup journey|vision for the future)\b/i,
];

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function scoreSpecificity(question: string): number {
  const hits = SPECIFICITY_PATTERNS.filter((pattern) => pattern.test(question)).length;
  const vagueHits = VAGUE_PATTERNS.filter((pattern) => pattern.test(question)).length;
  let score = 35 + hits * 15 - vagueHits * 20;
  const wordCount = question.trim().split(/\s+/).length;

  if (wordCount >= 12) {
    score += 10;
  }

  return clampScore(score);
}

function scoreProfessionalism(question: string): number {
  const hits = PROFESSIONAL_PATTERNS.filter((pattern) => pattern.test(question)).length;
  const informalHits = /\b(hey|awesome|cool|super)\b/i.test(question) ? 1 : 0;
  let score = 55 + hits * 12 - informalHits * 15;

  if (question.trim().endsWith("?")) {
    score += 5;
  }

  return clampScore(score);
}

function scoreContextAwareness(
  question: string,
  priorTranscript: string,
  targetDimension: string,
): number {
  if (!priorTranscript.trim()) {
    return question.toLowerCase().includes("pain") ||
      question.toLowerCase().includes("problem")
      ? 75
      : 50;
  }

  const priorTokens = new Set(
    priorTranscript
      .toLowerCase()
      .split(/\W+/)
      .filter((token) => token.length > 3),
  );
  const questionTokens = question
    .toLowerCase()
    .split(/\W+/)
    .filter((token) => token.length > 3);
  const overlap = questionTokens.filter((token) => priorTokens.has(token)).length;
  const overlapRatio =
    questionTokens.length === 0 ? 0 : overlap / questionTokens.length;

  let score = 40 + overlapRatio * 45;

  if (question.toLowerCase().includes(targetDimension.toLowerCase())) {
    score += 10;
  }

  if (
    /\b(you mentioned|earlier|reconcile|follow[- ]?up|based on)\b/i.test(question)
  ) {
    score += 15;
  }

  return clampScore(score);
}

function scoreRelevance(
  reason: string,
  targetDimension: string,
  estimatedInformationGain: number,
): number {
  let score = estimatedInformationGain * 0.55;

  if (reason.trim().length > 20) {
    score += 15;
  }

  if (reason.toLowerCase().includes(targetDimension.toLowerCase())) {
    score += 10;
  }

  if (/\b(unclear|low|validation|evidence|gap|blind spot)\b/i.test(reason)) {
    score += 10;
  }

  return clampScore(score);
}

function buildRecommendations(input: {
  genericityScore: number;
  specificityScore: number;
  contextAwarenessScore: number;
  relevanceScore: number;
  professionalScore: number;
}): string[] {
  const recommendations: string[] = [];

  if (input.genericityScore < 60) {
    recommendations.push(
      "Replace broad phrasing with a context-anchored objective tied to the founder's last answer.",
    );
  }

  if (input.specificityScore < 65) {
    recommendations.push(
      "Add a concrete anchor: a timeframe, customer example, or measurable outcome.",
    );
  }

  if (input.contextAwarenessScore < 60) {
    recommendations.push(
      "Reference prior founder statements to demonstrate the question builds on existing context.",
    );
  }

  if (input.relevanceScore < 65) {
    recommendations.push(
      "Tighten alignment between the Cortex objective and the dimension being explored.",
    );
  }

  if (input.professionalScore < 60) {
    recommendations.push(
      "Use senior-PM framing: validation, evidence, and decision-critical unknowns.",
    );
  }

  if (recommendations.length === 0) {
    recommendations.push("Question quality is acceptable for this discovery stage.");
  }

  return recommendations;
}

export function evaluateQuestionQuality(
  context: QuestionEvaluationContext,
): QuestionQualityReport {
  const genericDetection = detectGenericQuestion(context.questionText);
  const genericityScore = genericDetection.isGeneric
    ? clampScore(100 - genericDetection.similarityScore * 80)
    : clampScore(85 + (1 - genericDetection.similarityScore) * 15);

  const informationGainScore = clampScore(context.estimatedInformationGain);
  const specificityScore = scoreSpecificity(context.questionText);
  const professionalScore = scoreProfessionalism(context.questionText);
  const contextAwarenessScore = scoreContextAwareness(
    context.questionText,
    context.priorTranscript,
    context.targetDimension,
  );
  const relevanceScore = scoreRelevance(
    context.reason,
    context.targetDimension,
    context.estimatedInformationGain,
  );

  const overallScore = clampScore(
    genericityScore * 0.2 +
      informationGainScore * 0.2 +
      contextAwarenessScore * 0.15 +
      professionalScore * 0.15 +
      specificityScore * 0.15 +
      relevanceScore * 0.15,
  );

  const reason = [
    `Genericity: ${genericityScore}/100${genericDetection.isGeneric ? ` (matched: ${genericDetection.matchedPattern ?? "signal"})` : ""}.`,
    `Information gain: ${informationGainScore}/100.`,
    `Context awareness: ${contextAwarenessScore}/100.`,
    `Professionalism: ${professionalScore}/100.`,
    `Specificity: ${specificityScore}/100.`,
    `Relevance: ${relevanceScore}/100.`,
    `Cortex reason: ${context.reason}`,
  ].join(" ");

  return {
    question: context.questionText,
    questionId: context.questionId,
    turnIndex: context.turnIndex,
    overallScore,
    genericityScore,
    informationGainScore,
    professionalScore,
    specificityScore,
    reason,
    recommendations: buildRecommendations({
      genericityScore,
      specificityScore,
      contextAwarenessScore,
      relevanceScore,
      professionalScore,
    }),
  };
}

export function evaluateAllQuestionQuality(
  contexts: QuestionEvaluationContext[],
): QuestionQualityReport[] {
  return contexts.map((context) => evaluateQuestionQuality(context));
}
