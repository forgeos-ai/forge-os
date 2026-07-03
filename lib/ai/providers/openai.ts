import "server-only";

import { openai } from "@/lib/openai";

import { getAIConfig } from "../config";
import type { AIProvider, AIRequest, AIResponse, AIMessage } from "../types";
import {
  mapOpenAICompletionToAIResponse,
  resolveMaxTokens,
  resolveTemperature,
  toOpenAIMessages,
} from "./shared";

class OpenAIProvider implements AIProvider {
  readonly id = "openai" as const;

  get model(): string {
    return getAIConfig().models.openai;
  }

  private async createCompletion(
    request: AIRequest,
    temperature: number,
    jsonMode = false,
  ): Promise<AIResponse> {
    const completion = await openai.chat.completions.create({
      model: this.model,
      messages: toOpenAIMessages(request.messages),
      temperature: resolveTemperature(request, temperature),
      max_tokens: resolveMaxTokens(request),
      ...(jsonMode ? { response_format: { type: "json_object" as const } } : {}),
    });

    return mapOpenAICompletionToAIResponse(this.id, this.model, completion);
  }

  async generate(request: AIRequest): Promise<AIResponse> {
    return this.createCompletion(request, 0.3, true);
  }

  async chat(messages: AIMessage[]): Promise<AIResponse> {
    return this.createCompletion({ messages }, 0.4, true);
  }

  async reason(request: AIRequest): Promise<AIResponse> {
    return this.createCompletion(request, 0.2, true);
  }
}

export const openAIProvider = new OpenAIProvider();
