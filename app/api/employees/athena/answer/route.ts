import "server-only";

import { errorResponse, jsonResponse, parseJsonBody } from "@/lib/api/http";
import { submitAthenaAnswer } from "@/lib/employees/athena/service";
import { AthenaServiceError } from "@/lib/employees/athena/types";

export async function POST(request: Request) {
  try {
    const body = await parseJsonBody<{
      sessionId?: string;
      questionId?: string;
      answer?: string;
    }>(request);

    if (!body?.sessionId || !body.questionId || body.answer === undefined) {
      return errorResponse(
        "Request body must include sessionId, questionId, and answer.",
        "INVALID_REQUEST",
      );
    }

    const result = submitAthenaAnswer(
      body.sessionId,
      body.questionId,
      body.answer,
    );

    return jsonResponse(result);
  } catch (error) {
    return handleAthenaError(error);
  }
}

function handleAthenaError(error: unknown) {
  if (error instanceof AthenaServiceError) {
    return errorResponse(error.message, error.code, error.statusCode);
  }

  console.error("[athena/answer]", error);
  return errorResponse("Internal server error.", "INTERNAL_ERROR", 500);
}
