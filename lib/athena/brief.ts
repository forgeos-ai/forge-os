import type { AnalysisResult, ProductBrief, ProductBriefMetadata } from "./types";

const PRODUCT_BRIEF_VERSION = "0.1.0";

export function composeStartupIdea(analysis: AnalysisResult): string {
  const { proposedSolution, customer } = analysis;

  if (proposedSolution && customer) {
    return `${proposedSolution} — built for ${customer}`;
  }

  return proposedSolution || customer;
}

export function createProductBriefMetadata(
  sessionId: string,
  generatedAt: Date = new Date(),
): ProductBriefMetadata {
  return {
    sessionId,
    generatedAt,
    version: PRODUCT_BRIEF_VERSION,
    source: "deterministic",
  };
}

export function composeProductBrief(
  analysis: AnalysisResult,
  metadata: ProductBriefMetadata,
): ProductBrief {
  return {
    startupIdea: composeStartupIdea(analysis),
    problem: analysis.problem,
    customer: analysis.customer,
    currentSolution: analysis.currentSolution,
    frustrations: analysis.frustration,
    proposedSolution: analysis.proposedSolution,
    mvp: analysis.mvp,
    successGoal: analysis.successGoal,
    metadata,
  };
}
