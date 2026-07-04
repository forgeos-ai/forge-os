export type ProcessingStage =
  | "queued"
  | "extracting_audio"
  | "generating_transcript"
  | "finding_moments"
  | "generating_subtitles"
  | "rendering_clips"
  | "complete"
  | "failed";

export type JobStatus = "pending" | "processing" | "complete" | "failed";

export type TranscriptSegment = {
  start: number;
  end: number;
  text: string;
};

export type ClipMoment = {
  id: string;
  start: number;
  end: number;
  reason: string;
  hook: string;
};

export type GeneratedClip = {
  id: string;
  momentId: string;
  title: string;
  caption: string;
  hashtags: string[];
  viralScore: number;
  duration: number;
  thumbnailUrl: string;
  videoUrl: string;
  start: number;
  end: number;
};

export type ClipJob = {
  id: string;
  status: JobStatus;
  stage: ProcessingStage;
  stageProgress: number;
  error?: string;
  sourceType: "upload" | "url";
  sourceLabel: string;
  createdAt: number;
  updatedAt: number;
  transcript?: TranscriptSegment[];
  moments?: ClipMoment[];
  clips?: GeneratedClip[];
};

export type CreateJobResponse = {
  jobId: string;
};

export type JobStatusResponse = {
  job: ClipJob;
};
