import "server-only";

import fs from "node:fs";
import path from "node:path";

import { getOpenAIClient } from "@/lib/openai";

import type { TranscriptSegment } from "./types";

type WhisperSegment = {
  start: number;
  end: number;
  text: string;
};

type WhisperVerboseResponse = {
  text: string;
  segments?: WhisperSegment[];
};

const WHISPER_MAX_BYTES = 24 * 1024 * 1024;

export async function transcribeAudio(
  audioPath: string,
  timeOffset = 0,
): Promise<TranscriptSegment[]> {
  const client = getOpenAIClient();
  const stat = await fs.promises.stat(audioPath);

  if (stat.size > WHISPER_MAX_BYTES) {
    const { compressAudioForWhisper } = await import("./ffmpeg");
    const compressedPath = audioPath.replace(/\.[^.]+$/, "_compressed.mp3");
    await compressAudioForWhisper(audioPath, compressedPath);
    return transcribeAudio(compressedPath, timeOffset);
  }

  const transcription = await client.audio.transcriptions.create({
    file: fs.createReadStream(audioPath),
    model: "whisper-1",
    response_format: "verbose_json",
    timestamp_granularities: ["segment"],
  });

  const verbose = transcription as unknown as WhisperVerboseResponse;
  const segments = verbose.segments ?? [];

  return segments.map((seg) => ({
    start: seg.start + timeOffset,
    end: seg.end + timeOffset,
    text: seg.text.trim(),
  }));
}

export function segmentsToPlainText(segments: TranscriptSegment[]): string {
  return segments.map((s) => s.text).join(" ");
}

export function formatTranscriptForAI(segments: TranscriptSegment[]): string {
  return segments
    .map((s) => `[${formatTime(s.start)} → ${formatTime(s.end)}] ${s.text}`)
    .join("\n");
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function getSegmentsInRange(
  segments: TranscriptSegment[],
  start: number,
  end: number,
): TranscriptSegment[] {
  return segments.filter((seg) => seg.end > start && seg.start < end);
}

export function buildClipSrt(
  segments: TranscriptSegment[],
  clipStart: number,
  clipEnd: number,
): string {
  const clipSegments = getSegmentsInRange(segments, clipStart, clipEnd);
  let index = 1;
  const lines: string[] = [];

  for (const seg of clipSegments) {
    const relStart = Math.max(0, seg.start - clipStart);
    const relEnd = Math.min(clipEnd - clipStart, seg.end - clipStart);
    if (relEnd <= relStart) continue;

    lines.push(String(index));
    lines.push(`${toSrtTime(relStart)} --> ${toSrtTime(relEnd)}`);
    lines.push(seg.text.trim());
    lines.push("");
    index++;
  }

  return lines.join("\n");
}

function toSrtTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.round((seconds % 1) * 1000);
  return `${pad(h)}:${pad(m)}:${pad(s)},${ms.toString().padStart(3, "0")}`;
}

function pad(n: number): string {
  return n.toString().padStart(2, "0");
}

export async function writeClipSrt(
  segments: TranscriptSegment[],
  clipStart: number,
  clipEnd: number,
  outputPath: string,
): Promise<string> {
  const content = buildClipSrt(segments, clipStart, clipEnd);
  await fs.promises.writeFile(outputPath, content, "utf-8");
  return path.resolve(outputPath);
}
