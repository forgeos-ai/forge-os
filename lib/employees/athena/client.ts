import type { ApiErrorBody } from "@/lib/api/http";
import type {
  AthenaAnswerResponse,
  AthenaBriefResponse,
  AthenaRationaleResponse,
  AthenaSessionResponse,
} from "./types";

class AthenaClientError extends Error {
  readonly code: string;

  constructor(message: string, code: string) {
    super(message);
    this.name = "AthenaClientError";
    this.code = code;
  }
}

async function parseResponse<T>(response: Response): Promise<T> {
  const data = (await response.json()) as T & Partial<ApiErrorBody>;

  if (!response.ok) {
    const message =
      typeof data.error === "string" && data.error.trim()
        ? data.error
        : "Request failed.";
    const code =
      typeof data.code === "string" && data.code.trim()
        ? data.code
        : "REQUEST_FAILED";

    throw new AthenaClientError(message, code);
  }

  return data as T;
}

export async function startAthenaSession(): Promise<AthenaSessionResponse> {
  const response = await fetch("/api/employees/athena/session", {
    method: "POST",
  });

  return parseResponse<AthenaSessionResponse>(response);
}

export async function submitAthenaAnswer(input: {
  sessionId: string;
  questionId: string;
  answer: string;
}): Promise<AthenaAnswerResponse> {
  const response = await fetch("/api/employees/athena/answer", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  return parseResponse<AthenaAnswerResponse>(response);
}

export async function generateAthenaBrief(
  sessionId: string,
): Promise<AthenaBriefResponse> {
  const response = await fetch("/api/employees/athena/brief", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionId }),
  });

  return parseResponse<AthenaBriefResponse>(response);
}

export async function getAthenaQuestionRationale(input: {
  sessionId: string;
  questionId: string;
}): Promise<AthenaRationaleResponse> {
  const response = await fetch("/api/employees/athena/rationale", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  return parseResponse<AthenaRationaleResponse>(response);
}
