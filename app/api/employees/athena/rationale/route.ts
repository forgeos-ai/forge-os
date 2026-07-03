import "server-only";

import { AIGatewayError } from "@/lib/ai/types";
import { errorResponse, jsonResponse, parseJsonBody } from "@/lib/api/http";
import { getAthenaQuestionRationale } from "@/lib/employees/athena/service";
import { AthenaServiceError } from "@/lib/employees/athena/types";

export async function POST(request: Request) {
  try {
    const body = await parseJsonBody<{
      sessionId?: string;
      questionId?: string;
    }>(request);

    if (!body?.sessionId || !body.questionId) {
      return errorResponse(
        "Request body must include sessionId and questionId.",
        "INVALID_REQUEST",
      );
    }

    const result = getAthenaQuestionRationale(body.sessionId, body.questionId);
    return jsonResponse(result);
  } catch (error) {
    return handleAthenaError(error);
  }
}

function handleAthenaError(error: unknown) {
  if (error instanceof AthenaServiceError) {
    return errorResponse(error.message, error.code, error.statusCode);
  }

  console.error("[athena/rationale]", error);
  return errorResponse("Internal server error.", "INTERNAL_ERROR", 500);
}
