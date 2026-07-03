import type OpenAI from "openai";

import type { AIMessage, AIProviderId, AIRequest, AIResponse } from "../types";

type ChatCompletion = OpenAI.Chat.Completions.ChatCompletion;
type ChatCompletionMessageParam = OpenAI.Chat.Completions.ChatCompletionMessageParam;

export function toOpenAIMessages(messages: AIMessage[]): ChatCompletionMessageParam[] {
  return messages.map((message) => ({
    role: message.role,
    content: message.content,
  }));
}

export function mapOpenAICompletionToAIResponse(
  providerId: AIProviderId,
  model: string,
  completion: ChatCompletion,
): AIResponse {
  const choice = completion.choices[0];
  const content = choice?.message?.content ?? "";
  const usage = completion.usage;

  return {
    content,
    provider: providerId,
    model,
    usage: {
      inputTokens: usage?.prompt_tokens ?? 0,
      outputTokens: usage?.completion_tokens ?? 0,
      totalTokens: usage?.total_tokens ?? 0,
    },
    finishReason: choice?.finish_reason === "length" ? "length" : "stop",
    createdAt: new Date(),
  };
}

export function resolveTemperature(
  request: AIRequest,
  fallback: number,
): number {
  return request.temperature ?? fallback;
}

export function resolveMaxTokens(request: AIRequest): number | undefined {
  return request.maxTokens;
}
