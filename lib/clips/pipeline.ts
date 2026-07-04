import "server-only";

import { randomUUID } from "node:crypto";
import fs from "node:fs/promises";

import {
  createFallbackMoments,
  findEngagingMoments,
  generateClipMetadata,
} from "./analyze";
import {
  cutAndConvertClip,
  extractAudio,
  generateThumbnail,
  getVideoDuration,
} from "./ffmpeg";
import { createJob, getJob, setJobStage, updateJob } from "./jobStore";
import { jobFilePath, writeJobFile } from "./storage";
import { transcribeAudio, writeClipSrt } from "./transcribe";
import type { ClipJob, GeneratedClip } from "./types";

const activeProcessing = new Set<string>();

export async function startProcessing(jobId: string): Promise<void> {
  if (activeProcessing.has(jobId)) return;

  const job = getJob(jobId);
  if (!job) throw new Error("Job not found");
  if (job.status === "complete") return;
  if (job.status === "processing" && activeProcessing.has(jobId)) return;

  activeProcessing.add(jobId);
  processJob(jobId)
    .catch((error) => {
      const message = error instanceof Error ? error.message : "Processing failed";
      updateJob(jobId, {
        status: "failed",
        stage: "failed",
        error: message,
      });
    })
    .finally(() => {
      activeProcessing.delete(jobId);
    });
}

async function processJob(jobId: string): Promise<void> {
  const videoPath = jobFilePath(jobId, "source.mp4");
  const audioPath = jobFilePath(jobId, "audio.mp3");

  updateJob(jobId, { status: "processing" });

  // Stage 1: Extract audio
  setJobStage(jobId, "extracting_audio", 10);
  await extractAudio(videoPath, audioPath);
  setJobStage(jobId, "extracting_audio", 100);

  // Stage 2: Transcribe
  setJobStage(jobId, "generating_transcript", 10);
  const duration = await getVideoDuration(videoPath);
  const transcript = await transcribeAudio(audioPath);
  setJobStage(jobId, "generating_transcript", 100);
  updateJob(jobId, { transcript });

  // Stage 3: Find moments
  setJobStage(jobId, "finding_moments", 20);
  let moments;
  try {
    moments = await findEngagingMoments(transcript, duration);
    if (moments.length === 0) {
      moments = createFallbackMoments(duration);
    }
  } catch {
    moments = createFallbackMoments(duration);
  }
  setJobStage(jobId, "finding_moments", 100);
  updateJob(jobId, { moments });

  // Stage 4 & 5: Subtitles + render clips
  setJobStage(jobId, "generating_subtitles", 10);
  const clips: GeneratedClip[] = [];
  const total = moments.length;

  for (let i = 0; i < moments.length; i++) {
    const moment = moments[i];
    const clipId = randomUUID();
    const clipDuration = moment.end - moment.start;
    const srtPath = jobFilePath(jobId, `clip_${i}.srt`);
    const rawClipPath = jobFilePath(jobId, `clip_${i}_raw.mp4`);
    const finalClipPath = jobFilePath(jobId, `clip_${i}.mp4`);
    const thumbPath = jobFilePath(jobId, `clip_${i}_thumb.jpg`);

    await writeClipSrt(transcript, moment.start, moment.end, srtPath);

    const subtitleProgress = Math.round(((i + 0.5) / total) * 100);
    setJobStage(jobId, "generating_subtitles", subtitleProgress);

    setJobStage(jobId, "rendering_clips", Math.round((i / total) * 100));

    await cutAndConvertClip(videoPath, moment.start, clipDuration, srtPath, finalClipPath);

    const thumbTime = moment.start + clipDuration / 3;
    try {
      await generateThumbnail(videoPath, thumbTime, thumbPath);
    } catch {
      await fs.copyFile(finalClipPath, thumbPath).catch(() => undefined);
    }

    let metadata;
    try {
      metadata = await generateClipMetadata(moment, transcript);
    } catch {
      metadata = {
        title: moment.hook,
        caption: moment.reason,
        hashtags: ["#forgeclips", "#shorts"],
        viralScore: 65,
      };
    }

    clips.push({
      id: clipId,
      momentId: moment.id,
      title: metadata.title,
      caption: metadata.caption,
      hashtags: metadata.hashtags,
      viralScore: metadata.viralScore,
      duration: clipDuration,
      thumbnailUrl: `/api/clips/files/${jobId}/clip_${i}_thumb.jpg`,
      videoUrl: `/api/clips/files/${jobId}/clip_${i}.mp4`,
      start: moment.start,
      end: moment.end,
    });

    await fs.unlink(srtPath).catch(() => undefined);
    await fs.unlink(rawClipPath).catch(() => undefined);

    setJobStage(jobId, "rendering_clips", Math.round(((i + 1) / total) * 100));
  }

  updateJob(jobId, {
    status: "complete",
    stage: "complete",
    stageProgress: 100,
    clips,
  });
}

export function registerUploadedJob(
  sourceLabel: string,
  sourceType: ClipJob["sourceType"],
): ClipJob {
  const jobId = randomUUID();
  return createJob({ id: jobId, sourceType, sourceLabel });
}

export async function saveUploadedVideo(
  jobId: string,
  data: Buffer,
  originalName: string,
): Promise<string> {
  const ext = originalName.toLowerCase().endsWith(".mp4") ? "mp4" : "mp4";
  return writeJobFile(jobId, `source.${ext}`, data);
}

export { getJob };
