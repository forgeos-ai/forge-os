import "server-only";

import type { ClipJob, ProcessingStage } from "./types";

const jobs = new Map<string, ClipJob>();

export function createJob(
  partial: Pick<ClipJob, "id" | "sourceType" | "sourceLabel">,
): ClipJob {
  const now = Date.now();
  const job: ClipJob = {
    ...partial,
    status: "pending",
    stage: "queued",
    stageProgress: 0,
    createdAt: now,
    updatedAt: now,
  };
  jobs.set(job.id, job);
  return job;
}

export function getJob(jobId: string): ClipJob | undefined {
  return jobs.get(jobId);
}

export function updateJob(jobId: string, patch: Partial<ClipJob>): ClipJob | undefined {
  const job = jobs.get(jobId);
  if (!job) return undefined;

  const updated: ClipJob = {
    ...job,
    ...patch,
    updatedAt: Date.now(),
  };
  jobs.set(jobId, updated);
  return updated;
}

export function setJobStage(
  jobId: string,
  stage: ProcessingStage,
  stageProgress = 0,
): ClipJob | undefined {
  return updateJob(jobId, { stage, stageProgress, status: "processing" });
}
