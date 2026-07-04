import { errorResponse, jsonResponse } from "@/lib/api/http";
import { MAX_UPLOAD_BYTES } from "@/lib/clips/constants";
import { createJobId } from "@/lib/clips/download";
import { createJob } from "@/lib/clips/jobStore";
import { startProcessing } from "@/lib/clips/pipeline";
import { ensureClipsDataDir, writeJobFile } from "@/lib/clips/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await ensureClipsDataDir();

    const formData = await request.formData();
    const file = formData.get("video");

    if (!file || !(file instanceof File)) {
      return errorResponse("No video file provided", "MISSING_FILE");
    }

    if (!file.type.includes("video") && !file.name.toLowerCase().endsWith(".mp4")) {
      return errorResponse("Only MP4 video files are supported", "INVALID_FORMAT");
    }

    if (file.size > MAX_UPLOAD_BYTES) {
      return errorResponse("File exceeds 500 MB limit", "FILE_TOO_LARGE", 413);
    }

    const jobId = createJobId();
    createJob({
      id: jobId,
      sourceType: "upload",
      sourceLabel: file.name,
    });

    const buffer = Buffer.from(await file.arrayBuffer());
    await writeJobFile(jobId, "source.mp4", buffer);

    startProcessing(jobId);

    return jsonResponse({ jobId }, 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed";
    return errorResponse(message, "UPLOAD_FAILED", 500);
  }
}
