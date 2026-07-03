import type { ConfidenceDimension } from "@/lib/forge-cortex/types";

export interface QuestionQualityReport {
  question: string;
  questionId: string;
  turnIndex: number;
  overallScore: number;
  genericityScore: number;
  informationGainScore: number;
  professionalScore: number;
  specificityScore: number;
  reason: string;
  recommendations: string[];
}

export interface ConversationEvaluation {
  understandingProgress: number;
  confidenceGrowth: number;
  questionEfficiency: number;
  informationGain: number;
  contradictionsResolved: number;
  blindSpotsCovered: number;
  overallScore: number;
  summary: string;
}

export interface TrustFactor {
  factor: string;
  score: number;
  passed: boolean;
  notes: string;
}

export interface TrustReport {
  overallScore: number;
  explainedItself: TrustFactor;
  challengedAssumptions: TrustFactor;
  avoidedHallucinations: TrustFactor;
  admittedUncertainty: TrustFactor;
  summary: string;
}

export type GenericQuestionSeverity = "none" | "low" | "medium" | "high";

export interface GenericQuestionReport {
  isGeneric: boolean;
  severity: GenericQuestionSeverity;
  reason: string;
  replacementSuggestion: string;
  matchedPattern: string | null;
  similarityScore: number;
}

export interface FounderFeedback {
  sessionId: string;
  mostValuableQuestionId?: string;
  leastValuableQuestionId?: string;
  understoodYou: boolean;
  wouldUseAgain: boolean;
  rating: number;
  comments?: string;
  submittedAt?: Date;
}

export interface FeedbackReport {
  mostValuableQuestion: string | null;
  leastValuableQuestion: string | null;
  understoodYou: boolean;
  wouldUseAgain: boolean;
  rating: number;
  comments: string;
  summary: string;
  netPromoterSignal: "promoter" | "passive" | "detractor";
}

export interface EvaluationMetrics {
  understandingEfficiencyScore: number;
  questionValueScore: number;
  reasoningQualityIndex: number;
}

export interface ForgeEvaluationReport {
  sessionId: string;
  evaluatedAt: Date;
  version: string;
  questionQuality: QuestionQualityReport[];
  conversationScore: ConversationEvaluation;
  trustScore: TrustReport;
  metrics: EvaluationMetrics;
  genericDetections: GenericQuestionReport[];
  feedbackSummary: FeedbackReport | null;
  overallRecommendation: string;
  summary: string;
}

export interface QuestionEvaluationContext {
  questionText: string;
  questionId: string;
  reason: string;
  targetDimension: ConfidenceDimension;
  estimatedInformationGain: number;
  turnIndex: number;
  priorTranscript: string;
}

export interface GenericQuestionBlacklistEntry {
  pattern: string;
  severity: GenericQuestionSeverity;
  replacementSuggestion: string;
}

export const EVALUATION_VERSION = "0.3.1";

export const DEFAULT_GENERIC_QUESTION_BLACKLIST: GenericQuestionBlacklistEntry[] =
  [
    {
      pattern: "who is your target audience",
      severity: "high",
      replacementSuggestion:
        "Describe one specific person who experiences this problem — their role, context, and how often they face it.",
    },
    {
      pattern: "what is your target market",
      severity: "high",
      replacementSuggestion:
        "Within the group you have in mind, who feels this pain most acutely and cannot easily work around it?",
    },
    {
      pattern: "what is your budget",
      severity: "medium",
      replacementSuggestion:
        "What budget source or approval process would fund this solution in your target customer?",
    },
    {
      pattern: "what is your timeline",
      severity: "medium",
      replacementSuggestion:
        "What measurable outcome would define success 90 days after launch — with a specific number or milestone?",
    },
    {
      pattern: "tell me about your idea",
      severity: "high",
      replacementSuggestion:
        "Describe the specific pain point, when it happens, and what it costs the customer in time, money, or risk.",
    },
    {
      pattern: "what problem are you solving",
      severity: "medium",
      replacementSuggestion:
        "Walk through the last time this problem occurred for a real customer — what triggered it and what happened next?",
    },
    {
      pattern: "who are your customers",
      severity: "high",
      replacementSuggestion:
        "Describe one specific person who experiences this problem — their role, context, and how often they face it.",
    },
    {
      pattern: "what makes you unique",
      severity: "medium",
      replacementSuggestion:
        "What is most frustrating about existing approaches, and where do they break down?",
    },
    {
      pattern: "how will you make money",
      severity: "low",
      replacementSuggestion:
        "How would this product make money — who pays, for what value, and on what cadence?",
    },
    {
      pattern: "what are your goals",
      severity: "medium",
      replacementSuggestion:
        "What measurable outcome would define success 90 days after launch — with a specific number or milestone?",
    },
  ];

export const GENERIC_SIMILARITY_THRESHOLD = 0.62;
