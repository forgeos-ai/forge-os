import { errorResponse, jsonResponse, parseJsonBody } from "@/lib/api/http";
import { createJobId, downloadVideoFromUrl, isValidVideoUrl } from "@/lib/clips/download";
import { createJob } from "@/lib/clips/jobStore";
import { startProcessing } from "@/lib/clips/pipeline";
import { ensureJobDir } from "@/lib/clips/storage";
import fs from "node:fs/promises";
import path from "node:path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 600;

type UrlBody = { url?: string };

export async function POST(request: Request) {
  try {
    const body = await parseJsonBody<UrlBody>(request);
    const url = body?.url?.trim();

    if (!url) {
      return errorResponse("Video URL is required", "MISSING_URL");
    }

    if (!isValidVideoUrl(url)) {
      return errorResponse("Invalid URL format", "INVALID_URL");
    }

    const jobId = createJobId();
    const jobDir = await ensureJobDir(jobId);

    createJob({
      id: jobId,
      sourceType: "url",
      sourceLabel: url,
    });

    const { filePath, title } = await downloadVideoFromUrl(url, jobDir);
    const destPath = path.join(jobDir, "source.mp4");
    if (filePath !== destPath) {
      await fs.rename(filePath, destPath);
    }

    const { updateJob } = await import("@/lib/clips/jobStore");
    updateJob(jobId, { sourceLabel: title || url });

    startProcessing(jobId);

    return jsonResponse({ jobId }, 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : "URL import failed";
    return errorResponse(message, "URL_IMPORT_FAILED", 500);
  }
}
