import { errorResponse, jsonResponse } from "@/lib/api/http";
import { getJob } from "@/lib/clips/jobStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ jobId: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const { jobId } = await context.params;
  const job = getJob(jobId);

  if (!job) {
    return errorResponse("Job not found", "NOT_FOUND", 404);
  }

  return jsonResponse({ job });
}
