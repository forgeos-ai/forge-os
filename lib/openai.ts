import "server-only";

import OpenAI from "openai";

export class MissingOpenAIApiKeyError extends Error {
  constructor() {
    super(
      "OPENAI_API_KEY is not configured. Set process.env.OPENAI_API_KEY in your environment (for example, in .env.local) before using the OpenAI client.",
    );
    this.name = "MissingOpenAIApiKeyError";
  }
}

function resolveApiKey(): string {
  const apiKey = process.env.OPENAI_API_KEY?.trim();

  if (!apiKey) {
    throw new MissingOpenAIApiKeyError();
  }

  return apiKey;
}

let singletonClient: OpenAI | null = null;

/**
 * Creates a new OpenAI client instance.
 * Prefer `getOpenAIClient()` for the shared singleton in application code.
 */
export function createOpenAIClient(): OpenAI {
  return new OpenAI({ apiKey: resolveApiKey() });
}

/**
 * Returns the shared OpenAI client for Forge OS.
 * Initializes lazily on first access and reuses the same instance thereafter.
 */
export function getOpenAIClient(): OpenAI {
  if (!singletonClient) {
    singletonClient = createOpenAIClient();
  }

  return singletonClient;
}

/**
 * Reusable OpenAI client singleton for Forge OS.
 * Lazily initializes on first property access.
 *
 * @example
 * const response = await openai.chat.completions.create({ ... });
 */
export const openai: OpenAI = new Proxy({} as OpenAI, {
  get(_target, property, receiver) {
    return Reflect.get(getOpenAIClient(), property, receiver);
  },
});
