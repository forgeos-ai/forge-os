import "server-only";

import { randomUUID } from "node:crypto";

import { getOpenAIClient } from "@/lib/openai";

import {
  MAX_CLIP_SECONDS,
  MIN_CLIP_SECONDS,
  TARGET_CLIP_COUNT,
} from "./constants";
import { formatTranscriptForAI } from "./transcribe";
import type { ClipMoment, TranscriptSegment } from "./types";

type MomentCandidate = {
  start: number;
  end: number;
  reason: string;
  hook: string;
};

type MomentsResponse = {
  moments: MomentCandidate[];
};

type ClipMetadata = {
  title: string;
  caption: string;
  hashtags: string[];
  viralScore: number;
};

export async function findEngagingMoments(
  segments: TranscriptSegment[],
  videoDuration: number,
): Promise<ClipMoment[]> {
  const client = getOpenAIClient();
  const transcript = formatTranscriptForAI(segments);

  const response = await client.chat.completions.create({
    model: process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini",
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: `You identify viral short-form video moments from long-form content.
Return JSON: { "moments": [{ "start": seconds, "end": seconds, "reason": "why this clip works", "hook": "opening hook line" }] }
Rules:
- Find ${TARGET_CLIP_COUNT.min}–${TARGET_CLIP_COUNT.max} distinct moments
- Each clip must be ${MIN_CLIP_SECONDS}–${MAX_CLIP_SECONDS} seconds
- Prefer hooks, insights, emotional peaks, contrarian takes, and actionable advice
- start/end must be within 0–${Math.ceil(videoDuration)} seconds
- Moments must not overlap significantly
- end must be greater than start`,
      },
      {
        role: "user",
        content: `Video duration: ${Math.ceil(videoDuration)}s\n\nTranscript:\n${transcript}`,
      },
    ],
    temperature: 0.7,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error("AI returned no moments");

  let parsed: MomentsResponse;
  try {
    parsed = JSON.parse(content) as MomentsResponse;
  } catch {
    throw new Error("Failed to parse AI moment response");
  }

  return (parsed.moments ?? [])
    .filter(
      (m) =>
        m.end > m.start &&
        m.end - m.start >= MIN_CLIP_SECONDS &&
        m.end - m.start <= MAX_CLIP_SECONDS &&
        m.start >= 0 &&
        m.end <= videoDuration + 2,
    )
    .slice(0, TARGET_CLIP_COUNT.max)
    .map((m) => ({
      id: randomUUID(),
      start: Math.max(0, m.start),
      end: Math.min(videoDuration, m.end),
      reason: m.reason,
      hook: m.hook,
    }));
}

export async function generateClipMetadata(
  moment: ClipMoment,
  segments: TranscriptSegment[],
): Promise<ClipMetadata> {
  const client = getOpenAIClient();
  const clipText = segments
    .filter((s) => s.end > moment.start && s.start < moment.end)
    .map((s) => s.text)
    .join(" ");

  const response = await client.chat.completions.create({
    model: process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini",
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: `Generate short-form video metadata. Return JSON:
{ "title": "punchy title under 60 chars", "caption": "engaging caption 1-2 sentences with CTA", "hashtags": ["tag1","tag2",...], "viralScore": 0-100 }
viralScore reflects hook strength, clarity, shareability, and emotional pull.`,
      },
      {
        role: "user",
        content: `Hook: ${moment.hook}\nReason: ${moment.reason}\nTranscript excerpt:\n${clipText}`,
      },
    ],
    temperature: 0.8,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error("AI returned no metadata");

  const parsed = JSON.parse(content) as ClipMetadata;
  return {
    title: parsed.title ?? moment.hook,
    caption: parsed.caption ?? moment.reason,
    hashtags: Array.isArray(parsed.hashtags) ? parsed.hashtags : [],
    viralScore: Math.min(100, Math.max(0, Math.round(parsed.viralScore ?? 70))),
  };
}

export function createFallbackMoments(videoDuration: number): ClipMoment[] {
  const clipLength = Math.min(MAX_CLIP_SECONDS, Math.max(MIN_CLIP_SECONDS, 30));
  const count = Math.min(
    TARGET_CLIP_COUNT.max,
    Math.max(TARGET_CLIP_COUNT.min, Math.floor(videoDuration / (clipLength * 2))),
  );
  const moments: ClipMoment[] = [];
  const spacing = videoDuration / (count + 1);

  for (let i = 1; i <= count; i++) {
    const center = spacing * i;
    const start = Math.max(0, center - clipLength / 2);
    const end = Math.min(videoDuration, start + clipLength);
    moments.push({
      id: randomUUID(),
      start,
      end,
      reason: "Evenly distributed segment",
      hook: `Clip ${i}`,
    });
  }

  return moments;
}
