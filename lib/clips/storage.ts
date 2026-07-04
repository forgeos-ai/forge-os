import "server-only";

import fs from "node:fs/promises";
import path from "node:path";

import { CLIPS_DATA_DIR } from "./constants";

export function getJobDir(jobId: string): string {
  return path.join(CLIPS_DATA_DIR, jobId);
}

export async function ensureJobDir(jobId: string): Promise<string> {
  const dir = getJobDir(jobId);
  await fs.mkdir(dir, { recursive: true });
  return dir;
}

export async function ensureClipsDataDir(): Promise<void> {
  await fs.mkdir(CLIPS_DATA_DIR, { recursive: true });
}

export function jobFilePath(jobId: string, ...segments: string[]): string {
  return path.join(getJobDir(jobId), ...segments);
}

export async function writeJobFile(
  jobId: string,
  filename: string,
  data: Buffer | Uint8Array,
): Promise<string> {
  const dir = await ensureJobDir(jobId);
  const filePath = path.join(dir, filename);
  await fs.writeFile(filePath, data);
  return filePath;
}

export async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

export async function readJobFile(jobId: string, filename: string): Promise<Buffer> {
  return fs.readFile(jobFilePath(jobId, filename));
}
