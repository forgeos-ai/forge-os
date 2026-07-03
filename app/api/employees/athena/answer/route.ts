import "server-only";

import { errorResponse, jsonResponse, parseJsonBody } from "@/lib/api/http";
import { submitAthenaAnswer } from "@/lib/employees/athena/service";
import {
  getServerInstanceId,
  logRouteIncoming,
  logRouteReturned,
  logSessionId,
} from "@/lib/employees/athena/pipelineLogger";
import { handleAthenaRouteError } from "@/lib/employees/athena/routeErrors";

export async function POST(request: Request) {
  const body = await parseJsonBody<{
    sessionId?: string;
    questionId?: string;
    answer?: string;
  }>(request);

  logRouteIncoming("answer", {
    instanceId: getServerInstanceId(),
    sessionId: body?.sessionId ?? null,
    questionId: body?.questionId ?? null,
    answerLength: body?.answer?.length ?? 0,
  });

  try {
    if (!body?.sessionId || !body.questionId || body.answer === undefined) {
      return errorResponse(
        "Request body must include sessionId, questionId, and answer.",
        "INVALID_REQUEST",
      );
    }

    const result = await submitAthenaAnswer(
      body.sessionId,
      body.questionId,
      body.answer,
    );

    logSessionId(result.sessionId, "answer.response");
    logRouteReturned("answer", {
      sessionId: result.sessionId,
      status: result.status,
      readyForBrief: result.readyForBrief,
      questionId: result.question?.id ?? null,
      questionPreview: result.question?.text?.slice(0, 200) ?? null,
      questionNumber: result.questionNumber,
      confidenceAverage: result.confidence.average,
    });

    return jsonResponse(result);
  } catch (error) {
    return handleAthenaRouteError("answer", error);
  }
}
