import type { AIProvider, AIRequest, AIResponse, AIMessage } from "../types";
import { createMockResponse } from "../types";

const MODEL = "gemini-2.0-flash";

function extractUserContent(request: AIRequest): string {
  const lastUserMessage = [...request.messages]
    .reverse()
    .find((message) => message.role === "user");

  return lastUserMessage?.content ?? "";
}

function buildGenerateMock(request: AIRequest): string {
  const userContent = extractUserContent(request);
  const preview = userContent.slice(0, 120);

  return `[Gemini Mock] Generated completion for request: "${preview}${
    userContent.length > 120 ? "..." : ""
  }"`;
}

function buildChatMock(messages: AIMessage[]): string {
  const lastUserMessage = [...messages]
    .reverse()
    .find((message) => message.role === "user");

  return `[Gemini Mock] Chat response to: "${lastUserMessage?.content ?? "empty conversation"}"`;
}

function buildReasonMock(request: AIRequest): string {
  const userContent = extractUserContent(request);

  return JSON.stringify({
    reasoning:
      "[Gemini Mock] Structured reasoning completed. Ready for downstream parsing.",
    output: userContent.slice(0, 240),
    confidence: 0.8,
  });
}

class GeminiProvider implements AIProvider {
  readonly id = "gemini" as const;
  readonly model = MODEL;

  async generate(request: AIRequest): Promise<AIResponse> {
    return createMockResponse(
      this.id,
      this.model,
      buildGenerateMock(request),
    );
  }

  async chat(messages: AIMessage[]): Promise<AIResponse> {
    return createMockResponse(this.id, this.model, buildChatMock(messages));
  }

  async reason(request: AIRequest): Promise<AIResponse> {
    return createMockResponse(this.id, this.model, buildReasonMock(request));
  }
}

export const geminiProvider = new GeminiProvider();
