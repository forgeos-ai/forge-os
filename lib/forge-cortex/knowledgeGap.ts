import type {
  ConfidenceDimension,
  ConfidenceScores,
  KnowledgeGap,
} from "./types";
import { DIMENSION_PRIORITY } from "./types";

const GAP_REASONS: Record<ConfidenceDimension, string> = {
  problem:
    "The problem statement needs more clarity about the pain, urgency, and who is affected.",
  customer:
    "The target customer profile is still vague and needs sharper definition.",
  buyer:
    "It is unclear who makes the buying decision or pays for the solution.",
  businessModel:
    "How this becomes a business is not yet clear from the current answers.",
  competition:
    "Existing alternatives and competitive context need more depth.",
  goals:
    "Success outcomes and measurable goals are not yet specific enough.",
};

function compareDimensions(
  left: ConfidenceDimension,
  right: ConfidenceDimension,
): number {
  return DIMENSION_PRIORITY.indexOf(left) - DIMENSION_PRIORITY.indexOf(right);
}

export function identifyKnowledgeGap(
  confidence: ConfidenceScores,
): KnowledgeGap {
  const entries = Object.entries(confidence) as [
    ConfidenceDimension,
    number,
  ][];

  const sorted = [...entries].sort((left, right) => {
    if (left[1] !== right[1]) {
      return left[1] - right[1];
    }

    return compareDimensions(left[0], right[0]);
  });

  const [dimension, score] = sorted[0];

  return {
    dimension,
    score,
    reason: GAP_REASONS[dimension],
  };
}

export function identifyKnowledgeGaps(
  confidence: ConfidenceScores,
): KnowledgeGap[] {
  const entries = Object.entries(confidence) as [
    ConfidenceDimension,
    number,
  ][];

  return [...entries]
    .sort((left, right) => {
      if (left[1] !== right[1]) {
        return left[1] - right[1];
      }

      return compareDimensions(left[0], right[0]);
    })
    .map(([dimension, score]) => ({
      dimension,
      score,
      reason: GAP_REASONS[dimension],
    }));
}

export function getGapForDimension(
  confidence: ConfidenceScores,
  dimension: ConfidenceDimension,
): KnowledgeGap {
  return {
    dimension,
    score: confidence[dimension],
    reason: GAP_REASONS[dimension],
  };
}
