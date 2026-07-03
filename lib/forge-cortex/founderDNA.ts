import type { WorkingMemory } from "@/lib/athena/types";

import type { ObservedKnowledge } from "./types";

export type FounderDNADimension =
  | "founderMotivation"
  | "personalExperience"
  | "professionalExperience"
  | "domainExpertise"
  | "emotionalDriver"
  | "longTermVision";

export interface FounderDNASignal {
  dimension: FounderDNADimension;
  content: string;
  confidence: number;
  evidence: string;
}

export interface FounderDNAProfile {
  signals: FounderDNASignal[];
  overallConfidence: number;
  summary: string;
}

const DNA_PATTERNS: Record<
  FounderDNADimension,
  { patterns: RegExp[]; evidenceLabel: string }[]
> = {
  founderMotivation: [
    {
      patterns: [
        /\b(i want to|i'm building|we're building|my goal is|mission is|trying to solve)\b/i,
        /\b(startup|founder|entrepreneur|build a company)\b/i,
      ],
      evidenceLabel: "Stated motivation in conversation",
    },
    {
      patterns: [/\b(because|driven by|motivated by|passionate about)\b/i],
      evidenceLabel: "Explicit motivation rationale",
    },
  ],
  personalExperience: [
    {
      patterns: [
        /\b(i experienced|i faced|i struggled|happened to me|personally|my own)\b/i,
        /\b(when i was|in my life|growing up)\b/i,
      ],
      evidenceLabel: "First-person experience described",
    },
  ],
  professionalExperience: [
    {
      patterns: [
        /\b(at my (job|company|work)|previously (worked|led)|years (of|in)|career|professional)\b/i,
        /\b(CTO|CEO|engineer|PM|product manager|consultant|analyst|director|VP)\b/i,
      ],
      evidenceLabel: "Professional background referenced",
    },
  ],
  domainExpertise: [
    {
      patterns: [
        /\b(expertise|specialist|deep knowledge|worked in (this|the) (industry|space|market))\b/i,
        /\b(\d+\+?\s*years?\s*(in|of)\s*(this|the)?\s*(industry|space|field|domain))\b/i,
      ],
      evidenceLabel: "Domain expertise signals",
    },
  ],
  emotionalDriver: [
    {
      patterns: [
        /\b(frustrat(ed|ing)|angry|passionate|care deeply|personal mission|meaningful|impact)\b/i,
        /\b(why this matters|matters to me|can't stand|hate that)\b/i,
      ],
      evidenceLabel: "Emotional driver expressed",
    },
  ],
  longTermVision: [
    {
      patterns: [
        /\b(long[- ]?term|vision|in \d+ years|eventually|future of|transform|change the)\b/i,
        /\b(scale|global|category[- ]?defining|platform|ecosystem)\b/i,
      ],
      evidenceLabel: "Long-term vision articulated",
    },
  ],
};

const DIMENSION_LABELS: Record<FounderDNADimension, string> = {
  founderMotivation: "Founder Motivation",
  personalExperience: "Personal Experience",
  professionalExperience: "Professional Experience",
  domainExpertise: "Domain Expertise",
  emotionalDriver: "Emotional Driver",
  longTermVision: "Long-Term Vision",
};

function countWords(text: string): number {
  if (!text.trim()) {
    return 0;
  }

  return text.trim().split(/\s+/).length;
}

function extractSnippet(text: string, pattern: RegExp, maxLength = 160): string {
  const match = text.match(pattern);

  if (!match || match.index === undefined) {
    return text.slice(0, maxLength).trim();
  }

  const start = Math.max(0, match.index - 40);
  const end = Math.min(text.length, match.index + maxLength);
  return text.slice(start, end).trim();
}

function conversationProgressBoost(questionCount: number): number {
  return Math.min(35, questionCount * 5);
}

function scoreDimension(
  dimension: FounderDNADimension,
  corpus: string,
  questionCount: number,
): FounderDNASignal | null {
  const entries = DNA_PATTERNS[dimension];
  let matchedContent = "";
  let matchedEvidence = "";
  let matchCount = 0;

  for (const entry of entries) {
    for (const pattern of entry.patterns) {
      if (pattern.test(corpus)) {
        matchCount += 1;
        matchedContent = extractSnippet(corpus, pattern);
        matchedEvidence = entry.evidenceLabel;
      }
    }
  }

  if (matchCount === 0) {
    return null;
  }

  const depthBoost = Math.min(25, countWords(matchedContent) * 2);
  const confidence = Math.min(
    100,
    30 + matchCount * 15 + depthBoost + conversationProgressBoost(questionCount),
  );

  return {
    dimension,
    content: matchedContent || `Signals detected for ${DIMENSION_LABELS[dimension]}`,
    confidence,
    evidence: matchedEvidence,
  };
}

function buildSummary(signals: FounderDNASignal[]): string {
  if (signals.length === 0) {
    return "Founder DNA is not yet visible. More discovery is needed to understand motivation, experience, and vision.";
  }

  const identified = signals
    .map((signal) => DIMENSION_LABELS[signal.dimension])
    .join(", ");

  const avgConfidence = Math.round(
    signals.reduce((sum, signal) => sum + signal.confidence, 0) / signals.length,
  );

  return `Identified ${signals.length} DNA dimension(s): ${identified}. Average confidence: ${avgConfidence}%.`;
}

export function extractFounderDNA(
  observed: ObservedKnowledge,
  memory: WorkingMemory,
): FounderDNAProfile {
  const corpus = [
    observed.problem,
    observed.customer,
    observed.proposedSolution,
    observed.successGoal,
    observed.transcript,
    ...memory.conversation.map((turn) => turn.answer),
  ]
    .filter(Boolean)
    .join(" ");

  const questionCount = observed.questionCount;

  const signals = (
    Object.keys(DNA_PATTERNS) as FounderDNADimension[]
  )
    .map((dimension) => scoreDimension(dimension, corpus, questionCount))
    .filter((signal): signal is FounderDNASignal => signal !== null);

  const overallConfidence =
    signals.length === 0
      ? Math.min(20, conversationProgressBoost(questionCount))
      : Math.round(
          signals.reduce((sum, signal) => sum + signal.confidence, 0) /
            signals.length,
        );

  return {
    signals,
    overallConfidence,
    summary: buildSummary(signals),
  };
}
