import fs from "node:fs/promises";
import path from "node:path";

import { errorResponse } from "@/lib/api/http";
import { jobFilePath } from "@/lib/clips/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ jobId: string; filename: string }> };

const MIME: Record<string, string> = {
  ".mp4": "video/mp4",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
};

export async function GET(_request: Request, context: RouteContext) {
  const { jobId, filename } = await context.params;

  if (filename.includes("..") || filename.includes("/") || filename.includes("\\")) {
    return errorResponse("Invalid filename", "INVALID_PATH", 400);
  }

  const filePath = jobFilePath(jobId, filename);
  const ext = path.extname(filename).toLowerCase();

  try {
    const data = await fs.readFile(filePath);
    return new Response(data, {
      headers: {
        "Content-Type": MIME[ext] ?? "application/octet-stream",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch {
    return errorResponse("File not found", "NOT_FOUND", 404);
  }
}
