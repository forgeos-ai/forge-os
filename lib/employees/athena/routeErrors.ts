import "server-only";

import { AIGatewayError } from "@/lib/ai/types";
import { errorResponse } from "@/lib/api/http";
import { AthenaServiceError } from "@/lib/employees/athena/types";
import { MissingOpenAIApiKeyError } from "@/lib/openai";

import {
  logPipelineError,
  type AthenaPipelineRoute,
} from "./pipelineLogger";

export function handleAthenaRouteError(
  route: AthenaPipelineRoute,
  error: unknown,
) {
  if (error instanceof AthenaServiceError) {
    logPipelineError(`${route}.service-error`, error, {
      code: error.code,
      statusCode: error.statusCode,
    });

    return errorResponse(error.message, error.code, error.statusCode);
  }

  if (error instanceof MissingOpenAIApiKeyError) {
    logPipelineError(`${route}.missing-openai-key`, error);
    return errorResponse(error.message, "MISSING_OPENAI_API_KEY", 500);
  }

  if (error instanceof AIGatewayError) {
    logPipelineError(`${route}.ai-gateway-error`, error);
    return errorResponse(error.message, "AI_GATEWAY_ERROR", 502);
  }

  logPipelineError(`${route}.unexpected-error`, error);
  console.error(`[athena/${route}] unexpected exception`, error);

  return errorResponse("Internal server error.", "INTERNAL_ERROR", 500);
}
