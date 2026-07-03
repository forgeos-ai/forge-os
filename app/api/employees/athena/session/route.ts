import "server-only";

import { errorResponse, jsonResponse } from "@/lib/api/http";
import { startAthenaSession } from "@/lib/employees/athena/service";
import { AthenaServiceError } from "@/lib/employees/athena/types";

export async function POST() {
  try {
    const session = startAthenaSession();
    return jsonResponse(session, 201);
  } catch (error) {
    return handleAthenaError(error);
  }
}

function handleAthenaError(error: unknown) {
  if (error instanceof AthenaServiceError) {
    return errorResponse(error.message, error.code, error.statusCode);
  }

  console.error("[athena/session]", error);
  return errorResponse("Internal server error.", "INTERNAL_ERROR", 500);
}
