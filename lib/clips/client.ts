import type { ClipJob, CreateJobResponse, JobStatusResponse } from "@/lib/clips/types";

async function handleResponse<T>(response: Response): Promise<T> {
  const data = (await response.json()) as T & { error?: string; code?: string };
  if (!response.ok) {
    throw new Error(data.error ?? "Request failed");
  }
  return data;
}

export async function uploadVideo(file: File): Promise<CreateJobResponse> {
  const formData = new FormData();
  formData.append("video", file);

  const response = await fetch("/api/clips/upload", {
    method: "POST",
    body: formData,
  });

  return handleResponse<CreateJobResponse>(response);
}

export async function importVideoUrl(url: string): Promise<CreateJobResponse> {
  const response = await fetch("/api/clips/url", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  });

  return handleResponse<CreateJobResponse>(response);
}

export async function getJobStatus(jobId: string): Promise<ClipJob> {
  const response = await fetch(`/api/clips/jobs/${jobId}`, {
    cache: "no-store",
  });

  const data = await handleResponse<JobStatusResponse>(response);
  return data.job;
}

export function getClipDownloadUrl(jobId: string, clipId: string): string {
  return `/api/clips/download/${jobId}/${clipId}`;
}

export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function formatHashtags(hashtags: string[]): string {
  return hashtags
    .map((tag) => (tag.startsWith("#") ? tag : `#${tag}`))
    .join(" ");
}

export function viralScoreLabel(score: number): string {
  if (score >= 85) return "Viral potential";
  if (score >= 70) return "Strong hook";
  if (score >= 55) return "Solid clip";
  return "Needs polish";
}

export function viralScoreColor(score: number): string {
  if (score >= 85) return "text-emerald-400";
  if (score >= 70) return "text-[#22c55e]";
  if (score >= 55) return "text-amber-400";
  return "text-white/50";
}
