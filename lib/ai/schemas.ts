import type { AIFollowUp, AIProductBrief, AISummary, AIGeneratedQuestion } from "./types";

const FOLLOW_UP_INTENTS = new Set<AIFollowUp["intent"]>([
  "clarify",
  "deepen",
  "validate",
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readString(record: Record<string, unknown>, key: string): string | null {
  const value = record[key];
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function readStringArray(
  record: Record<string, unknown>,
  key: string,
): string[] | null {
  const value = record[key];

  if (!Array.isArray(value)) {
    return null;
  }

  const items = value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);

  return items.length > 0 ? items : null;
}

const FOUNDER_BLUEPRINT_KEYS = [
  "executiveSummary",
  "startupThesis",
  "coreProblem",
  "targetCustomer",
  "buyer",
  "keyAssumptions",
  "biggestRisks",
  "validationPlan",
  "mvp30Day",
  "successMetrics",
  "recommendedNextAction",
  "founderDNASummary",
  "evidenceSummary",
  "blindSpots",
  "opportunityScore",
  "conversationQuality",
] as const;

export function isAIProductBriefPayload(value: unknown): value is Omit<
  AIProductBrief,
  "metadata"
> {
  if (!isRecord(value)) {
    return false;
  }

  return FOUNDER_BLUEPRINT_KEYS.every(
    (key) => typeof value[key] === "string",
  );
}

export function isAIGeneratedQuestionPayload(
  value: unknown,
): value is Pick<AIGeneratedQuestion, "question"> {
  if (!isRecord(value)) {
    return false;
  }

  return typeof value.question === "string" && value.question.trim().length > 0;
}

export function isAIFollowUpPayload(value: unknown): value is AIFollowUp {
  if (!isRecord(value)) {
    return false;
  }

  const message = readString(value, "message");
  const intent = value.intent;

  return (
    message !== null &&
    typeof intent === "string" &&
    FOLLOW_UP_INTENTS.has(intent as AIFollowUp["intent"])
  );
}

export function isAISummaryPayload(value: unknown): value is AISummary {
  if (!isRecord(value)) {
    return false;
  }

  const summary = readString(value, "summary");
  const keyPoints = readStringArray(value, "keyPoints");

  return summary !== null && keyPoints !== null;
}

export function parseJsonFromContent(content: string): unknown {
  const trimmed = content.trim();

  try {
    return JSON.parse(trimmed);
  } catch {
    const jsonMatch = trimmed.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      return null;
    }

    try {
      return JSON.parse(jsonMatch[0]);
    } catch {
      return null;
    }
  }
}
