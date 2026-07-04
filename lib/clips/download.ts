import "server-only";

import { execFile } from "node:child_process";
import { randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export class YtDlpNotFoundError extends Error {
  constructor() {
    super(
      "yt-dlp is not installed. Install yt-dlp to download videos from URLs, or upload an MP4 directly.",
    );
    this.name = "YtDlpNotFoundError";
  }
}

export async function checkYtDlpAvailable(): Promise<boolean> {
  try {
    await execFileAsync("yt-dlp", ["--version"], { timeout: 5000 });
    return true;
  } catch {
    try {
      await execFileAsync("youtube-dl", ["--version"], { timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }
}

function getYtDlpCommand(): string {
  return "yt-dlp";
}

export async function downloadVideoFromUrl(
  url: string,
  outputDir: string,
): Promise<{ filePath: string; title: string }> {
  const available = await checkYtDlpAvailable();
  if (!available) throw new YtDlpNotFoundError();

  await fs.mkdir(outputDir, { recursive: true });
  const outputTemplate = path.join(outputDir, "source.%(ext)s");

  const cmd = getYtDlpCommand();
  await execFileAsync(
    cmd,
    [
      url,
      "-f",
      "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best",
      "--merge-output-format",
      "mp4",
      "-o",
      outputTemplate,
      "--no-playlist",
      "--max-filesize",
      "500M",
      "--print",
      "title",
    ],
    { timeout: 600_000, maxBuffer: 5 * 1024 * 1024 },
  );

  const files = await fs.readdir(outputDir);
  const videoFile = files.find((f) => f.startsWith("source.") && !f.endsWith(".part"));
  if (!videoFile) {
    throw new Error("Download completed but no video file was found");
  }

  let title = "Video";
  try {
    const { stdout } = await execFileAsync(
      cmd,
      [url, "--print", "title", "--skip-download"],
      { timeout: 30_000 },
    );
    title = stdout.trim() || title;
  } catch {
    // use default title
  }

  return {
    filePath: path.join(outputDir, videoFile),
    title,
  };
}

export function isValidVideoUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return ["http:", "https:"].includes(parsed.protocol);
  } catch {
    return false;
  }
}

export function createJobId(): string {
  return randomUUID();
}
