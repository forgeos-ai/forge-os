import { computeTextSimilarity, normalizeText } from "./textSimilarity";
import type {
  GenericQuestionBlacklistEntry,
  GenericQuestionReport,
  GenericQuestionSeverity,
} from "./types";
import {
  DEFAULT_GENERIC_QUESTION_BLACKLIST,
  GENERIC_SIMILARITY_THRESHOLD,
} from "./types";

export interface GenericQuestionDetectorConfig {
  blacklist?: GenericQuestionBlacklistEntry[];
  similarityThreshold?: number;
}

function severityRank(severity: GenericQuestionSeverity): number {
  switch (severity) {
    case "high":
      return 3;
    case "medium":
      return 2;
    case "low":
      return 1;
    default:
      return 0;
  }
}

function buildNoMatchReport(): GenericQuestionReport {
  return {
    isGeneric: false,
    severity: "none",
    reason: "Question does not match generic AI question patterns.",
    replacementSuggestion: "",
    matchedPattern: null,
    similarityScore: 0,
  };
}

export function detectGenericQuestion(
  question: string,
  config: GenericQuestionDetectorConfig = {},
): GenericQuestionReport {
  const blacklist = config.blacklist ?? DEFAULT_GENERIC_QUESTION_BLACKLIST;
  const threshold = config.similarityThreshold ?? GENERIC_SIMILARITY_THRESHOLD;
  const normalizedQuestion = normalizeText(question);

  if (!normalizedQuestion) {
    return buildNoMatchReport();
  }

  let bestMatch: {
    entry: GenericQuestionBlacklistEntry;
    score: number;
  } | null = null;

  for (const entry of blacklist) {
    const normalizedPattern = normalizeText(entry.pattern);
    const exactMatch = normalizedQuestion === normalizedPattern;
    const similarity = exactMatch
      ? 1
      : computeTextSimilarity(normalizedQuestion, normalizedPattern);

    if (similarity >= threshold && (!bestMatch || similarity > bestMatch.score)) {
      bestMatch = { entry, score: similarity };
    }
  }

  if (!bestMatch) {
    const genericSignals = [
      /\b(tell me (more )?about)\b/i,
      /\b(what (is|are) your)\b/i,
      /\b(who (is|are) your)\b/i,
      /\b(describe your (idea|startup|business|product))\b/i,
      /\b(can you (tell|share|explain))\b/i,
    ];

    const signalHit = genericSignals.some((pattern) => pattern.test(question));

    if (signalHit) {
      return {
        isGeneric: true,
        severity: "low",
        reason:
          "Question uses broad discovery phrasing typical of generic AI assistants.",
        replacementSuggestion:
          "Anchor the question to a specific pain point, customer example, or measurable outcome from the current discovery context.",
        matchedPattern: null,
        similarityScore: threshold,
      };
    }

    return buildNoMatchReport();
  }

  const { entry, score } = bestMatch;

  return {
    isGeneric: true,
    severity: entry.severity,
    reason: `Question is semantically similar (${Math.round(score * 100)}%) to generic pattern: "${entry.pattern}".`,
    replacementSuggestion: entry.replacementSuggestion,
    matchedPattern: entry.pattern,
    similarityScore: Math.round(score * 100) / 100,
  };
}

export function detectGenericQuestions(
  questions: string[],
  config?: GenericQuestionDetectorConfig,
): GenericQuestionReport[] {
  return questions.map((question) => detectGenericQuestion(question, config));
}

export function getHighestGenericSeverity(
  reports: GenericQuestionReport[],
): GenericQuestionSeverity {
  return reports.reduce<GenericQuestionSeverity>((highest, report) => {
    if (severityRank(report.severity) > severityRank(highest)) {
      return report.severity;
    }

    return highest;
  }, "none");
}
