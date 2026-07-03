export type {
  ConversationEvaluation,
  EvaluationMetrics,
  FeedbackReport,
  ForgeEvaluationReport,
  FounderFeedback,
  GenericQuestionBlacklistEntry,
  GenericQuestionReport,
  GenericQuestionSeverity,
  QuestionEvaluationContext,
  QuestionQualityReport,
  TrustFactor,
  TrustReport,
} from "./types";

export {
  DEFAULT_GENERIC_QUESTION_BLACKLIST,
  EVALUATION_VERSION,
  GENERIC_SIMILARITY_THRESHOLD,
} from "./types";

export { runEvaluation } from "./evaluate";
export type { RunEvaluationInput } from "./evaluate";

export {
  evaluateQuestionQuality,
  evaluateAllQuestionQuality,
} from "./questionQuality";

export { evaluateConversation } from "./conversationScore";
export { evaluateTrust } from "./trustScore";

export {
  detectGenericQuestion,
  detectGenericQuestions,
  getHighestGenericSeverity,
} from "./genericQuestionDetector";
export type { GenericQuestionDetectorConfig } from "./genericQuestionDetector";

export { generateFeedbackReport, summarizeFeedback } from "./feedback";

export {
  buildQuestionEvaluationContexts,
  computeEvaluationMetrics,
  computeQuestionValueScore,
  computeReasoningQualityIndex,
  computeUnderstandingEfficiencyScore,
  computeUnderstandingImprovement,
} from "./metrics";

export {
  computeTextSimilarity,
  findBestSimilarityMatch,
  normalizeText,
  tokenize,
} from "./textSimilarity";
export type { SimilarityMatch } from "./textSimilarity";
