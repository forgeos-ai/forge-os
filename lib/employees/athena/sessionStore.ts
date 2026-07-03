import "server-only";

import type { WorkingMemory } from "@/lib/athena/types";

import { logSessionStoreAccess } from "./pipelineLogger";

const sessions = new Map<string, WorkingMemory>();

export function saveSession(memory: WorkingMemory): void {
  sessions.set(memory.sessionId, memory);
  logSessionStoreAccess("save", memory.sessionId, true);
}

export function getSession(sessionId: string): WorkingMemory | undefined {
  const memory = sessions.get(sessionId);
  logSessionStoreAccess("get", sessionId, Boolean(memory));
  return memory;
}

export function deleteSession(sessionId: string): boolean {
  const deleted = sessions.delete(sessionId);
  logSessionStoreAccess("delete", sessionId, deleted);
  return deleted;
}

export function hasSession(sessionId: string): boolean {
  return sessions.has(sessionId);
}

export function getSessionCount(): number {
  return sessions.size;
}
