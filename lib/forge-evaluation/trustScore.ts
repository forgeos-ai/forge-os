import type { WorkingMemory } from "@/lib/athena/types";
import { detectAssumptions } from "@/lib/forge-cortex/assumptions";
import { buildObservedKnowledge } from "@/lib/forge-cortex/observe";

import type { TrustFactor, TrustReport } from "./types";

const UNCERTAINTY_PATTERNS = [
  /\b(need(s)? (more )?validation|not yet clear|unclear|requires? further)\b/i,
  /\b(insufficient|more discovery|before (deciding|recommending))\b/i,
  /\b(assumption|unvalidated|evidence)\b/i,
];

const HALLUCINATION_SIGNALS = [
  /\b(according to (research|studies|data))\b/i,
  /\b(the market (is|will|has))\b/i,
  /\b(\d+% of (the )?market)\b/i,
  /\b(industry (standard|average|benchmark))\b/i,
  /\b(experts (say|believe|agree))\b/i,
];

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function evaluateExplainedItself(memory: WorkingMemory): TrustFactor {
  const turnsWithReason = memory.conversation.filter(
    (turn) => turn.reason.trim().length > 15,
  ).length;
  const total = memory.conversation.length;
  const ratio = total === 0 ? 0 : turnsWithReason / total;
  const score = clampScore(ratio * 100);
  const passed = score >= 70;

  return {
    factor: "Did Athena explain itself?",
    score,
    passed,
    notes: passed
      ? "Most questions include a Cortex rationale accessible via 'Why did you ask this?'"
      : "Several questions lack substantive rationale — transparency may suffer.",
  };
}

function evaluateChallengedAssumptions(memory: WorkingMemory): TrustFactor {
  const observed = buildObservedKnowledge(memory);
  const assumptions = detectAssumptions(observed, memory);
  const challengeTurns = memory.conversation.filter(
    (turn) =>
      turn.id.startsWith("validate-") ||
      turn.id.startsWith("evidence-") ||
      /\b(evidence|validate|assumption|support)\b/i.test(turn.questionText),
  ).length;

  let score = 50;

  if (assumptions.length > 0 && challengeTurns > 0) {
    score = clampScore(60 + Math.min(40, challengeTurns * 15));
  } else if (assumptions.length === 0) {
    score = 75;
  } else {
    score = 35;
  }

  const passed = score >= 65;

  return {
    factor: "Did Athena challenge assumptions?",
    score,
    passed,
    notes:
      assumptions.length > 0
        ? `${assumptions.length} assumption(s) detected; ${challengeTurns} validation-oriented question(s) asked.`
        : "No strong assumptions detected in founder language.",
  };
}

function evaluateAvoidedHallucinations(memory: WorkingMemory): TrustFactor {
  const questionCorpus = memory.conversation
    .map((turn) => turn.questionText)
    .join(" ");
  const hallucinationHits = HALLUCINATION_SIGNALS.filter((pattern) =>
    pattern.test(questionCorpus),
  ).length;
  const penalty = hallucinationHits * 25;
  const score = clampScore(100 - penalty);
  const passed = score >= 80;

  return {
    factor: "Did Athena avoid hallucinations?",
    score,
    passed,
    notes:
      hallucinationHits === 0
        ? "Questions do not introduce unsupported market claims or fabricated data."
        : `${hallucinationHits} potential hallucination signal(s) in question phrasing.`,
  };
}

function evaluateAdmittedUncertainty(memory: WorkingMemory): TrustFactor {
  const reasonCorpus = memory.conversation.map((turn) => turn.reason).join(" ");
  const uncertaintyHits = UNCERTAINTY_PATTERNS.filter((pattern) =>
    pattern.test(reasonCorpus),
  ).length;
  const score = clampScore(45 + Math.min(55, uncertaintyHits * 12));
  const passed = score >= 60;

  return {
    factor: "Did Athena admit uncertainty?",
    score,
    passed,
    notes:
      uncertaintyHits > 0
        ? "Cortex rationales acknowledge validation gaps and uncertainty."
        : "Limited explicit uncertainty language in rationales — may appear overconfident.",
  };
}

export function evaluateTrust(memory: WorkingMemory): TrustReport {
  const explainedItself = evaluateExplainedItself(memory);
  const challengedAssumptions = evaluateChallengedAssumptions(memory);
  const avoidedHallucinations = evaluateAvoidedHallucinations(memory);
  const admittedUncertainty = evaluateAdmittedUncertainty(memory);

  const overallScore = clampScore(
    explainedItself.score * 0.25 +
      challengedAssumptions.score * 0.25 +
      avoidedHallucinations.score * 0.3 +
      admittedUncertainty.score * 0.2,
  );

  const passedCount = [
    explainedItself,
    challengedAssumptions,
    avoidedHallucinations,
    admittedUncertainty,
  ].filter((factor) => factor.passed).length;

  const summary = `Trust score: ${overallScore}/100. ${passedCount}/4 trust factors passed.`;

  return {
    overallScore,
    explainedItself,
    challengedAssumptions,
    avoidedHallucinations,
    admittedUncertainty,
    summary,
  };
}
