import "server-only";

import { jsonResponse } from "@/lib/api/http";
import { startAthenaSession } from "@/lib/employees/athena/service";
import {
  getServerInstanceId,
  logRouteIncoming,
  logRouteReturned,
  logSessionId,
} from "@/lib/employees/athena/pipelineLogger";
import { handleAthenaRouteError } from "@/lib/employees/athena/routeErrors";
import { validateAthenaEnvironment } from "@/lib/employees/athena/validateEnv";

export async function POST() {
  logRouteIncoming("session", { instanceId: getServerInstanceId() });
  validateAthenaEnvironment();

  try {
    const session = await startAthenaSession();

    logSessionId(session.sessionId, "session.response");
    logRouteReturned("session", {
      sessionId: session.sessionId,
      questionId: session.question.id,
      questionPreview: session.question.text.slice(0, 200),
      questionNumber: session.questionNumber,
      confidenceAverage: session.confidence.average,
      status: session.status,
    });

    return jsonResponse(session, 201);
  } catch (error) {
    return handleAthenaRouteError("session", error);
  }
}
