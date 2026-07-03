import { analyzeWorkingMemory } from "@/lib/athena/analyzer";
import { composeStartupIdea } from "@/lib/athena/brief";
import type { WorkingMemory } from "@/lib/athena/types";

import { isLiveProvider } from "./config";
import {
  parseFollowUpResponse,
  parseProductBriefResponse,
  parseSummaryResponse,
} from "./parser";
import {
  buildFollowUpMessages,
  buildProductBriefMessages,
  buildSummarizeMessages,
} from "./prompts/athena";
import { claudeProvider } from "./providers/claude";
import { geminiProvider } from "./providers/gemini";
import { openAIProvider } from "./providers/openai";
import type {
  AIFollowUp,
  AIProductBrief,
  AIProvider,
  AIProviderId,
  AISummary,
  GatewayResult,
} from "./types";
import { AIProviderNotFoundError } from "./types";

const PROVIDER_REGISTRY: Record<AIProviderId, AIProvider> = {
  openai: openAIProvider,
  claude: claudeProvider,
  gemini: geminiProvider,
};

const DEFAULT_PROVIDER_ID: AIProviderId = "openai";

export interface AIGatewayConfig {
  providerId?: AIProviderId;
  provider?: AIProvider;
}

export interface GenerateProductBriefRequest {
  memory: WorkingMemory;
}

export interface GenerateFollowUpRequest {
  memory: WorkingMemory;
  questionText: string;
  currentAnswer: string;
}

export interface SummarizeRequest {
  content: string;
  context?: string;
}

function resolveProvider(config?: AIGatewayConfig): AIProvider {
  if (config?.provider) {
    return config.provider;
  }

  const providerId = config?.providerId ?? DEFAULT_PROVIDER_ID;
  const provider = PROVIDER_REGISTRY[providerId];

  if (!provider) {
    throw new AIProviderNotFoundError(providerId);
  }

  return provider;
}

function resolveResponseMode(provider: AIProvider): AIProductBrief["metadata"]["mode"] {
  return isLiveProvider(provider.id) ? "live" : "mock";
}

function buildMockProductBriefFromAnalysis(
  sessionId: string,
  provider: AIProvider,
  analysis: ReturnType<typeof analyzeWorkingMemory>,
): AIProductBrief {
  return {
    startupIdea: composeStartupIdea(analysis),
    problem: analysis.problem,
    customer: analysis.customer,
    currentSolution: analysis.currentSolution,
    frustrations: analysis.frustration,
    proposedSolution: analysis.proposedSolution,
    mvp: analysis.mvp,
    successGoal: analysis.successGoal,
    metadata: {
      sessionId,
      generatedAt: new Date(),
      provider: provider.id,
      model: provider.model,
      source: "ai-gateway",
      mode: "mock",
    },
  };
}

function buildMockFollowUp(
  provider: AIProvider,
  questionText: string,
): AIFollowUp {
  return {
    message: `[${provider.id} Mock] To sharpen our product direction: can you add more specificity to your answer for "${questionText}"?`,
    intent: "clarify",
  };
}

function buildMockSummary(provider: AIProvider, content: string): AISummary {
  const trimmed = content.trim();
  const preview = trimmed.slice(0, 180);

  return {
    summary: `[${provider.id} Mock] ${preview}${trimmed.length > 180 ? "..." : ""}`,
    keyPoints: [
      "The core problem is clearly articulated.",
      "The target customer needs sharper definition.",
      "The MVP scope should stay ruthlessly small.",
    ],
  };
}

export class AIGateway {
  private readonly provider: AIProvider;

  constructor(config?: AIGatewayConfig) {
    this.provider = resolveProvider(config);
  }

  get activeProvider(): AIProvider {
    return this.provider;
  }

  async generateProductBrief(
    request: GenerateProductBriefRequest,
  ): Promise<GatewayResult<AIProductBrief>> {
    const analysis = analyzeWorkingMemory(request.memory);
    const messages = buildProductBriefMessages(
      analysis,
      request.memory.sessionId,
    );
    const mode = resolveResponseMode(this.provider);

    const response = await this.provider.reason({
      messages,
      temperature: 0.2,
      metadata: { task: "generate-product-brief" },
    });

    const data =
      mode === "live"
        ? parseProductBriefResponse(
            response.content,
            request.memory.sessionId,
            this.provider,
            analysis,
            mode,
          )
        : buildMockProductBriefFromAnalysis(
            request.memory.sessionId,
            this.provider,
            analysis,
          );

    return {
      data,
      response,
      provider: this.provider.id,
    };
  }

  async generateFollowUp(
    request: GenerateFollowUpRequest,
  ): Promise<GatewayResult<AIFollowUp>> {
    const analysis = analyzeWorkingMemory(request.memory);
    const messages = buildFollowUpMessages({
      questionText: request.questionText,
      currentAnswer: request.currentAnswer,
      analysis,
    });
    const mode = resolveResponseMode(this.provider);

    const response = await this.provider.chat(messages);

    const data =
      mode === "live"
        ? parseFollowUpResponse(
            response.content,
            this.provider,
            request.questionText,
            mode,
          )
        : buildMockFollowUp(this.provider, request.questionText);

    return {
      data,
      response,
      provider: this.provider.id,
    };
  }

  async summarize(request: SummarizeRequest): Promise<GatewayResult<AISummary>> {
    const messages = buildSummarizeMessages(request.content, request.context);
    const mode = resolveResponseMode(this.provider);

    const response = await this.provider.generate({
      messages,
      temperature: 0.3,
      metadata: { task: "summarize" },
    });

    const data =
      mode === "live"
        ? parseSummaryResponse(
            response.content,
            this.provider,
            request.content,
            mode,
          )
        : buildMockSummary(this.provider, request.content);

    return {
      data,
      response,
      provider: this.provider.id,
    };
  }
}

let defaultGateway: AIGateway | null = null;

export function createGateway(config?: AIGatewayConfig): AIGateway {
  return new AIGateway(config);
}

export function getDefaultGateway(): AIGateway {
  if (!defaultGateway) {
    defaultGateway = createGateway();
  }

  return defaultGateway;
}

export function setDefaultGateway(gateway: AIGateway): void {
  defaultGateway = gateway;
}

export function listProviders(): AIProviderId[] {
  return Object.keys(PROVIDER_REGISTRY) as AIProviderId[];
}

export function getProvider(id: AIProviderId): AIProvider {
  const provider = PROVIDER_REGISTRY[id];

  if (!provider) {
    throw new AIProviderNotFoundError(id);
  }

  return provider;
}

export async function generateProductBrief(
  request: GenerateProductBriefRequest,
  config?: AIGatewayConfig,
): Promise<GatewayResult<AIProductBrief>> {
  const gateway = config ? createGateway(config) : getDefaultGateway();
  return gateway.generateProductBrief(request);
}

export async function generateFollowUp(
  request: GenerateFollowUpRequest,
  config?: AIGatewayConfig,
): Promise<GatewayResult<AIFollowUp>> {
  const gateway = config ? createGateway(config) : getDefaultGateway();
  return gateway.generateFollowUp(request);
}

export async function summarize(
  request: SummarizeRequest,
  config?: AIGatewayConfig,
): Promise<GatewayResult<AISummary>> {
  const gateway = config ? createGateway(config) : getDefaultGateway();
  return gateway.summarize(request);
}

export type {
  AIFollowUp,
  AIProductBrief,
  AIProvider,
  AIProviderId,
  AISummary,
  GatewayResult,
};
