import { buildDiscoveryContext } from "@/lib/athena/memory";
import type { WorkingMemory } from "@/lib/athena/types";
import {
  logOpenAIError,
  logOpenAIReceived,
  logOpenAIStarted,
  logParseFailure,
  logParsedResponse,
  logPipelineError,
} from "@/lib/employees/athena/pipelineLogger";
import type { CandidateQuestion } from "@/lib/forge-cortex/types";
import { MissingOpenAIApiKeyError } from "@/lib/openai";

import { isLiveProvider } from "./config";
import {
  parseGeneratedQuestionResponse,
  parseProductBriefResponse,
  parseSummaryResponse,
} from "./parser";
import {
  buildProductBriefMessages,
  buildQuestionMessages,
  buildSummarizeMessages,
} from "./prompts/athena";
import { claudeProvider } from "./providers/claude";
import { geminiProvider } from "./providers/gemini";
import { openAIProvider } from "./providers/openai";
import type {
  AIGeneratedQuestion,
  AIProductBrief,
  AIProvider,
  AIProviderId,
  AIResponse,
  AISummary,
  GatewayResult,
} from "./types";
import { AIGatewayError, AIProviderNotFoundError } from "./types";

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

export interface GenerateQuestionRequest {
  memory: WorkingMemory;
  candidate: CandidateQuestion;
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

function wrapProviderError(task: string, error: unknown): never {
  logOpenAIError(task, error);

  if (error instanceof MissingOpenAIApiKeyError) {
    throw error;
  }

  if (error instanceof AIGatewayError) {
    throw error;
  }

  if (error instanceof Error) {
    throw new AIGatewayError(
      `OpenAI ${task} failed: ${error.message}`,
    );
  }

  throw new AIGatewayError(`OpenAI ${task} failed with an unknown error.`);
}

function parseQuestionWithLogging(
  content: string,
  candidate: CandidateQuestion,
  provider: AIProvider,
  mode: AIProductBrief["metadata"]["mode"],
  sessionId: string,
): AIGeneratedQuestion {
  try {
    const parsed = parseGeneratedQuestionResponse(
      content,
      candidate,
      provider,
      mode,
    );

    if (!parsed.question.trim()) {
      logParseFailure("generate-question", content);
      throw new AIGatewayError("Parsed question was empty.");
    }

    return parsed;
  } catch (error) {
    logParseFailure("generate-question", content);
    logPipelineError("gateway.parse-question", error, {
      sessionId,
      candidateId: candidate.id,
      mode,
      provider: provider.id,
    });
    throw error;
  }
}

export class AIGateway {
  private readonly provider: AIProvider;

  constructor(config?: AIGatewayConfig) {
    this.provider = resolveProvider(config);
  }

  get activeProvider(): AIProvider {
    return this.provider;
  }

  async generateQuestion(
    request: GenerateQuestionRequest,
  ): Promise<GatewayResult<AIGeneratedQuestion>> {
    const context = buildDiscoveryContext(request.memory);
    const messages = buildQuestionMessages(request.candidate, context);
    const mode = resolveResponseMode(this.provider);
    const sessionId = request.memory.sessionId;

    logOpenAIStarted("generate-question", {
      sessionId,
      provider: this.provider.id,
      model: this.provider.model,
      mode,
      candidateId: request.candidate.id,
    });

    let response: AIResponse;

    try {
      response = await this.provider.generate({
        messages,
        temperature: 0.3,
        metadata: {
          task: "generate-question",
          dimension: request.candidate.targetDimension,
        },
      });
    } catch (error) {
      wrapProviderError("generate-question", error);
    }

    logOpenAIReceived("generate-question", {
      sessionId,
      provider: this.provider.id,
      model: response.model,
      finishReason: response.finishReason,
      contentLength: response.content.length,
      contentPreview: response.content.slice(0, 300),
    });

    const data = parseQuestionWithLogging(
      response.content,
      request.candidate,
      this.provider,
      mode,
      sessionId,
    );

    logParsedResponse("generate-question", {
      sessionId,
      questionPreview: data.question.slice(0, 200),
      targetDimension: data.targetDimension,
    });

    return {
      data,
      response,
      provider: this.provider.id,
    };
  }

  async generateProductBrief(
    request: GenerateProductBriefRequest,
  ): Promise<GatewayResult<AIProductBrief>> {
    const context = buildDiscoveryContext(request.memory);
    const messages = buildProductBriefMessages(
      context,
      request.memory.sessionId,
    );
    const mode = resolveResponseMode(this.provider);
    const sessionId = request.memory.sessionId;

    logOpenAIStarted("generate-product-brief", {
      sessionId,
      provider: this.provider.id,
      model: this.provider.model,
      mode,
    });

    let response: AIResponse;

    try {
      response = await this.provider.reason({
        messages,
        temperature: 0.2,
        metadata: { task: "generate-product-brief" },
      });
    } catch (error) {
      wrapProviderError("generate-product-brief", error);
    }

    logOpenAIReceived("generate-product-brief", {
      sessionId,
      provider: this.provider.id,
      model: response.model,
      finishReason: response.finishReason,
      contentLength: response.content.length,
      contentPreview: response.content.slice(0, 300),
    });

    let data: AIProductBrief;

    try {
      data = parseProductBriefResponse(
        response.content,
        request.memory.sessionId,
        this.provider,
        context,
        mode,
      );
    } catch (error) {
      logParseFailure("generate-product-brief", response.content);
      logPipelineError("gateway.parse-brief", error, { sessionId, mode });
      throw error;
    }

    logParsedResponse("generate-product-brief", {
      sessionId,
      blueprintVersion: data.metadata.version,
      sectionCount: 16,
    });

    return {
      data,
      response,
      provider: this.provider.id,
    };
  }

  async summarize(request: SummarizeRequest): Promise<GatewayResult<AISummary>> {
    const messages = buildSummarizeMessages(request.content, request.context);
    const mode = resolveResponseMode(this.provider);

    logOpenAIStarted("summarize", {
      provider: this.provider.id,
      model: this.provider.model,
      mode,
    });

    let response: AIResponse;

    try {
      response = await this.provider.generate({
        messages,
        temperature: 0.3,
        metadata: { task: "summarize" },
      });
    } catch (error) {
      wrapProviderError("summarize", error);
    }

    logOpenAIReceived("summarize", {
      provider: this.provider.id,
      model: response.model,
      finishReason: response.finishReason,
      contentLength: response.content.length,
    });

    let data: AISummary;

    try {
      data = parseSummaryResponse(
        response.content,
        this.provider,
        request.content,
        mode,
      );
    } catch (error) {
      logParseFailure("summarize", response.content);
      throw error;
    }

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

export async function generateQuestion(
  request: GenerateQuestionRequest,
  config?: AIGatewayConfig,
): Promise<GatewayResult<AIGeneratedQuestion>> {
  const gateway = config ? createGateway(config) : getDefaultGateway();
  return gateway.generateQuestion(request);
}

export async function generateProductBrief(
  request: GenerateProductBriefRequest,
  config?: AIGatewayConfig,
): Promise<GatewayResult<AIProductBrief>> {
  const gateway = config ? createGateway(config) : getDefaultGateway();
  return gateway.generateProductBrief(request);
}

export async function summarize(
  request: SummarizeRequest,
  config?: AIGatewayConfig,
): Promise<GatewayResult<AISummary>> {
  const gateway = config ? createGateway(config) : getDefaultGateway();
  return gateway.summarize(request);
}

export type {
  AIGeneratedQuestion,
  AIProductBrief,
  AIProvider,
  AIProviderId,
  AISummary,
  GatewayResult,
};
