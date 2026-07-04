import "server-only";

import { execFile } from "node:child_process";
import path from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export class FfmpegNotFoundError extends Error {
  constructor() {
    super(
      "FFmpeg is not installed or not on PATH. Install FFmpeg to process videos locally.",
    );
    this.name = "FfmpegNotFoundError";
  }
}

let ffmpegAvailable: boolean | null = null;

export async function checkFfmpegAvailable(): Promise<boolean> {
  if (ffmpegAvailable !== null) return ffmpegAvailable;
  try {
    await execFileAsync("ffmpeg", ["-version"], { timeout: 5000 });
    ffmpegAvailable = true;
  } catch {
    ffmpegAvailable = false;
  }
  return ffmpegAvailable;
}

async function runFfmpeg(args: string[]): Promise<void> {
  const available = await checkFfmpegAvailable();
  if (!available) throw new FfmpegNotFoundError();

  try {
    await execFileAsync("ffmpeg", ["-y", ...args], {
      timeout: 600_000,
      maxBuffer: 10 * 1024 * 1024,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "FFmpeg command failed";
    throw new Error(`FFmpeg error: ${message}`);
  }
}

export async function getVideoDuration(videoPath: string): Promise<number> {
  const available = await checkFfmpegAvailable();
  if (!available) throw new FfmpegNotFoundError();

  const { stdout } = await execFileAsync(
    "ffprobe",
    [
      "-v",
      "error",
      "-show_entries",
      "format=duration",
      "-of",
      "default=noprint_wrappers=1:nokey=1",
      videoPath,
    ],
    { timeout: 30_000 },
  );

  const duration = parseFloat(stdout.trim());
  if (Number.isNaN(duration)) {
    throw new Error("Could not determine video duration");
  }
  return duration;
}

export async function extractAudio(
  videoPath: string,
  audioPath: string,
): Promise<void> {
  await runFfmpeg([
    "-i",
    videoPath,
    "-vn",
    "-acodec",
    "libmp3lame",
    "-q:a",
    "4",
    "-ar",
    "16000",
    "-ac",
    "1",
    audioPath,
  ]);
}

export async function generateThumbnail(
  videoPath: string,
  timestamp: number,
  outputPath: string,
): Promise<void> {
  await runFfmpeg([
    "-ss",
    String(timestamp),
    "-i",
    videoPath,
    "-vframes",
    "1",
    "-q:v",
    "2",
    outputPath,
  ]);
}

export async function cutAndConvertClip(
  videoPath: string,
  start: number,
  duration: number,
  srtPath: string | null,
  outputPath: string,
): Promise<void> {
  const escapedSrt = srtPath
    ? path.resolve(srtPath).replace(/\\/g, "/").replace(/:/g, "\\:")
    : null;

  const subtitleFilter = escapedSrt
    ? `,subtitles='${escapedSrt}':force_style='FontName=Arial,FontSize=22,PrimaryColour=&HFFFFFF,OutlineColour=&H000000,Outline=2,Alignment=2,MarginV=80'`
    : "";

  const vf = `scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920${subtitleFilter}`;

  await runFfmpeg([
    "-ss",
    String(start),
    "-i",
    videoPath,
    "-t",
    String(duration),
    "-vf",
    vf,
    "-c:v",
    "libx264",
    "-preset",
    "fast",
    "-crf",
    "23",
    "-c:a",
    "aac",
    "-b:a",
    "128k",
    "-movflags",
    "+faststart",
    outputPath,
  ]);
}

export async function compressAudioForWhisper(
  inputPath: string,
  outputPath: string,
): Promise<void> {
  await runFfmpeg([
    "-i",
    inputPath,
    "-acodec",
    "libmp3lame",
    "-b:a",
    "64k",
    "-ar",
    "16000",
    "-ac",
    "1",
    outputPath,
  ]);
}

export async function splitAudio(
  inputPath: string,
  outputPattern: string,
  segmentSeconds: number,
): Promise<string[]> {
  await runFfmpeg([
    "-i",
    inputPath,
    "-f",
    "segment",
    "-segment_time",
    String(segmentSeconds),
    "-c",
    "copy",
    outputPattern,
  ]);

  const { readdir } = await import("node:fs/promises");
  const dir = inputPath.substring(0, inputPath.lastIndexOf("/") || inputPath.lastIndexOf("\\"));
  const baseName = outputPattern.split(/[/\\]/).pop()?.replace("%03d", "") ?? "segment_";
  const files = await readdir(dir);
  return files
    .filter((f) => f.startsWith(baseName.replace(".mp3", "")) || f.match(/segment_\d+/))
    .sort()
    .map((f) => `${dir}/${f}`.replace(/\//g, "\\"));
}
