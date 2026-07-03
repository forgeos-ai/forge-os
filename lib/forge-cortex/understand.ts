import type { ConfidenceScores, ObservedKnowledge } from "./types";
import { CONFIDENCE_THRESHOLD } from "./types";

const SPECIFICITY_PATTERNS = [
  /\b\d+%?\b/,
  /\b\d+\s*(day|days|week|weeks|month|months|year|years|user|users|customer|customers|founder|founders)\b/i,
  /\b(because|specifically|currently|today|existing|measurable|reduce|increase|launch)\b/i,
];

const BUSINESS_MODEL_PATTERNS = [
  /\b(subscription|saas|freemium|pricing|revenue|moneti[sz]e|charge|fee|commission|marketplace|per seat|per user)\b/i,
];

const GOAL_PATTERNS = [
  /\b(MRR|ARR|revenue|users|customers|signups|retention|conversion|launch|profit|break even)\b/i,
];

function countWords(text: string): number {
  if (!text.trim()) {
    return 0;
  }

  return text.trim().split(/\s+/).length;
}

function hasSpecificitySignals(text: string): boolean {
  return SPECIFICITY_PATTERNS.some((pattern) => pattern.test(text));
}

function scoreTextDepth(text: string): number {
  const words = countWords(text);

  if (words === 0) {
    return 0;
  }

  let score = Math.min(45, words * 3);

  if (words >= 8) {
    score += 10;
  }

  if (words >= 15) {
    score += 10;
  }

  if (hasSpecificitySignals(text)) {
    score += 15;
  }

  return Math.min(100, score);
}

function scoreBusinessModel(observed: ObservedKnowledge): number {
  const combined = `${observed.proposedSolution} ${observed.mvp}`.trim();

  if (!combined) {
    return 0;
  }

  let score = scoreTextDepth(combined) * 0.6;

  if (BUSINESS_MODEL_PATTERNS.some((pattern) => pattern.test(combined))) {
    score += 25;
  }

  if (observed.proposedSolution && observed.mvp) {
    score += 10;
  }

  return Math.min(100, Math.round(score));
}

function scoreCompetition(observed: ObservedKnowledge): number {
  const { currentSolution, frustrations } = observed;

  if (!currentSolution && !frustrations) {
    return 0;
  }

  let score = 0;

  if (currentSolution) {
    score += scoreTextDepth(currentSolution) * 0.55;
  }

  if (frustrations) {
    score += scoreTextDepth(frustrations) * 0.45;
  }

  if (currentSolution && frustrations) {
    score += 10;
  }

  return Math.min(100, Math.round(score));
}

function scoreGoals(observed: ObservedKnowledge): number {
  const { successGoal, mvp } = observed;

  if (!successGoal && !mvp) {
    return 0;
  }

  let score = 0;

  if (successGoal) {
    score += scoreTextDepth(successGoal) * 0.65;

    if (GOAL_PATTERNS.some((pattern) => pattern.test(successGoal))) {
      score += 15;
    }
  }

  if (mvp) {
    score += scoreTextDepth(mvp) * 0.35;
  }

  if (successGoal && mvp) {
    score += 10;
  }

  return Math.min(100, Math.round(score));
}

function scoreBuyer(observed: ObservedKnowledge): number {
  const { buyer, customer } = observed;

  if (!buyer && !customer) {
    return 0;
  }

  if (buyer) {
    return Math.min(100, scoreTextDepth(buyer) + 20);
  }

  return Math.min(45, scoreTextDepth(customer) * 0.5);
}

export function understand(observed: ObservedKnowledge): ConfidenceScores {
  return {
    problem: scoreTextDepth(observed.problem),
    customer: scoreTextDepth(observed.customer),
    buyer: scoreBuyer(observed),
    businessModel: scoreBusinessModel(observed),
    competition: scoreCompetition(observed),
    goals: scoreGoals(observed),
  };
}

export function getAverageConfidence(confidence: ConfidenceScores): number {
  const values = Object.values(confidence);
  const total = values.reduce((sum, value) => sum + value, 0);
  return Math.round(total / values.length);
}

export function isConfidenceHigh(confidence: ConfidenceScores): boolean {
  return Object.values(confidence).every(
    (score) => score >= CONFIDENCE_THRESHOLD,
  );
}
