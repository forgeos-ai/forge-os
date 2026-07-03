export type AIProviderId = "openai" | "claude" | "gemini";

export type AIMessageRole = "system" | "user" | "assistant";

export interface AIMessage {
  role: AIMessageRole;
  content: string;
}

export interface AIRequest {
  messages: AIMessage[];
  temperature?: number;
  maxTokens?: number;
  metadata?: Record<string, string>;
}

export interface AIUsage {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
}

export interface AIResponse {
  content: string;
  provider: AIProviderId;
  model: string;
  usage: AIUsage;
  finishReason: "stop" | "length" | "mock";
  createdAt: Date;
}

export interface AIProvider {
  readonly id: AIProviderId;
  readonly model: string;
  generate(request: AIRequest): Promise<AIResponse>;
  chat(messages: AIMessage[]): Promise<AIResponse>;
  reason(request: AIRequest): Promise<AIResponse>;
}

export interface GatewayResult<T> {
  data: T;
  response: AIResponse;
  provider: AIProviderId;
}

export interface AIProductBrief {
  executiveSummary: string;
  startupThesis: string;
  coreProblem: string;
  targetCustomer: string;
  buyer: string;
  keyAssumptions: string;
  biggestRisks: string;
  validationPlan: string;
  mvp30Day: string;
  successMetrics: string;
  recommendedNextAction: string;
  founderDNASummary: string;
  evidenceSummary: string;
  blindSpots: string;
  opportunityScore: string;
  conversationQuality: string;
  metadata: {
    sessionId: string;
    generatedAt: Date;
    provider: AIProviderId;
    model: string;
    source: "ai-gateway";
    mode: "mock" | "live";
    documentType: "founder-blueprint";
    version: string;
  };
}

/** Founder Blueprint — Phase 2 premium document synthesized by Athena. */
export type FounderBlueprint = AIProductBrief;

export interface AIGeneratedQuestion {
  question: string;
  objective: string;
  reason: string;
  targetDimension: string;
}

export interface AIFollowUp {
  message: string;
  intent: "clarify" | "deepen" | "validate";
}

export interface AISummary {
  summary: string;
  keyPoints: string[];
}

export class AIGatewayError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AIGatewayError";
  }
}

export class AIProviderNotFoundError extends AIGatewayError {
  readonly providerId: string;

  constructor(providerId: string) {
    super(`AI provider not found: ${providerId}`);
    this.name = "AIProviderNotFoundError";
    this.providerId = providerId;
  }
}

export function createMockUsage(content: string): AIUsage {
  const inputTokens = 120;
  const outputTokens = Math.max(24, Math.ceil(content.length / 4));

  return {
    inputTokens,
    outputTokens,
    totalTokens: inputTokens + outputTokens,
  };
}

export function createMockResponse(
  provider: AIProviderId,
  model: string,
  content: string,
  finishReason: AIResponse["finishReason"] = "mock",
): AIResponse {
  return {
    content,
    provider,
    model,
    usage: createMockUsage(content),
    finishReason,
    createdAt: new Date(),
  };
}
