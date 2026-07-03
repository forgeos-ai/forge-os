import "server-only";

import { AIGatewayError } from "@/lib/ai/types";
import { errorResponse, jsonResponse, parseJsonBody } from "@/lib/api/http";
import { generateAthenaBrief } from "@/lib/employees/athena/service";
import { AthenaServiceError } from "@/lib/employees/athena/types";
import { MissingOpenAIApiKeyError } from "@/lib/openai";

export async function POST(request: Request) {
  try {
    const body = await parseJsonBody<{ sessionId?: string }>(request);

    if (!body?.sessionId) {
      return errorResponse(
        "Request body must include sessionId.",
        "INVALID_REQUEST",
      );
    }

    const result = await generateAthenaBrief(body.sessionId);
    return jsonResponse(result);
  } catch (error) {
    return handleAthenaError(error);
  }
}

function handleAthenaError(error: unknown) {
  if (error instanceof AthenaServiceError) {
    return errorResponse(error.message, error.code, error.statusCode);
  }

  if (error instanceof MissingOpenAIApiKeyError) {
    return errorResponse(error.message, "MISSING_OPENAI_API_KEY", 500);
  }

  if (error instanceof AIGatewayError) {
    return errorResponse(error.message, "AI_GATEWAY_ERROR", 502);
  }

  console.error("[athena/brief]", error);
  return errorResponse("Internal server error.", "INTERNAL_ERROR", 500);
}
