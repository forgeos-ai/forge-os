import { errorResponse, jsonResponse } from "@/lib/api/http";
import { getJob } from "@/lib/clips/jobStore";
import { startProcessing } from "@/lib/clips/pipeline";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ jobId: string }> };

export async function POST(_request: Request, context: RouteContext) {
  const { jobId } = await context.params;
  const job = getJob(jobId);

  if (!job) {
    return errorResponse("Job not found", "NOT_FOUND", 404);
  }

  if (job.status === "complete") {
    return jsonResponse({ started: false, status: job.status });
  }

  startProcessing(jobId);
  return jsonResponse({ started: true, status: "processing" });
}
