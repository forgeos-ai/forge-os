import type { CandidateQuestion, RankedQuestionResult } from "./types";
import { DIMENSION_PRIORITY } from "./types";

function compareCandidates(
  left: CandidateQuestion,
  right: CandidateQuestion,
): number {
  if (right.estimatedInformationGain !== left.estimatedInformationGain) {
    return right.estimatedInformationGain - left.estimatedInformationGain;
  }

  const leftPriority = DIMENSION_PRIORITY.indexOf(left.targetDimension);
  const rightPriority = DIMENSION_PRIORITY.indexOf(right.targetDimension);

  return leftPriority - rightPriority;
}

export function rankQuestions(
  candidates: CandidateQuestion[],
): RankedQuestionResult {
  if (candidates.length === 0) {
    return {
      selected: null,
      ranked: [],
    };
  }

  const ranked = [...candidates].sort(compareCandidates);

  return {
    selected: ranked[0] ?? null,
    ranked,
  };
}

export function selectBestQuestion(
  candidates: CandidateQuestion[],
): CandidateQuestion | null {
  return rankQuestions(candidates).selected;
}

export function estimateInformationGain(
  currentConfidence: number,
  targetConfidence = 100,
): number {
  const gap = Math.max(0, targetConfidence - currentConfidence);
  return Math.min(100, Math.round(gap * 0.85 + 10));
}
