import type { DiscoveryContext } from "./types";

const PRODUCT_BRIEF_VERSION = "0.1.0";

export function composeStartupVision(context: DiscoveryContext): string {
  const { proposedSolution, customer, problem } = context;

  if (proposedSolution && customer) {
    return `${proposedSolution} — built for ${customer}`;
  }

  return proposedSolution || problem || customer;
}

export function createProductBriefMetadata(
  sessionId: string,
  generatedAt: Date = new Date(),
) {
  return {
    sessionId,
    generatedAt,
    version: PRODUCT_BRIEF_VERSION,
    source: "deterministic" as const,
  };
}
