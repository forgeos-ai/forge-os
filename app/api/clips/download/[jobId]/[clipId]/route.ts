import fs from "node:fs/promises";
import path from "node:path";

import { errorResponse } from "@/lib/api/http";
import { getJob } from "@/lib/clips/jobStore";
import { jobFilePath } from "@/lib/clips/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ jobId: string; clipId: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const { jobId, clipId } = await context.params;
  const job = getJob(jobId);

  if (!job?.clips) {
    return errorResponse("Job or clips not found", "NOT_FOUND", 404);
  }

  const clip = job.clips.find((c) => c.id === clipId);
  if (!clip) {
    return errorResponse("Clip not found", "NOT_FOUND", 404);
  }

  const filename = clip.videoUrl.split("/").pop();
  if (!filename) {
    return errorResponse("Invalid clip path", "INVALID_CLIP", 500);
  }

  const filePath = jobFilePath(jobId, filename);

  try {
    const data = await fs.readFile(filePath);
    const safeTitle = clip.title.replace(/[^\w\s-]/g, "").trim().slice(0, 60);

    return new Response(data, {
      headers: {
        "Content-Type": "video/mp4",
        "Content-Disposition": `attachment; filename="${safeTitle || "clip"}.mp4"`,
        "Content-Length": String(data.length),
      },
    });
  } catch {
    return errorResponse("Clip file not found", "FILE_NOT_FOUND", 404);
  }
}
