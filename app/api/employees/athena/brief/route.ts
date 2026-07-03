import "server-only";

import { jsonResponse, parseJsonBody, errorResponse } from "@/lib/api/http";
import { generateAthenaBrief } from "@/lib/employees/athena/service";
import {
  getServerInstanceId,
  logRouteIncoming,
  logRouteReturned,
  logSessionId,
} from "@/lib/employees/athena/pipelineLogger";
import { handleAthenaRouteError } from "@/lib/employees/athena/routeErrors";

export async function POST(request: Request) {
  const body = await parseJsonBody<{ sessionId?: string }>(request);

  logRouteIncoming("brief", {
    instanceId: getServerInstanceId(),
    sessionId: body?.sessionId ?? null,
  });

  try {
    if (!body?.sessionId) {
      return errorResponse(
        "Request body must include sessionId.",
        "INVALID_REQUEST",
      );
    }

    const result = await generateAthenaBrief(body.sessionId);

    logSessionId(result.sessionId, "brief.response");
    logRouteReturned("brief", {
      sessionId: result.sessionId,
      provider: result.provider,
      blueprintVersion: result.brief.metadata.version,
    });

    return jsonResponse(result);
  } catch (error) {
    return handleAthenaRouteError("brief", error);
  }
}
