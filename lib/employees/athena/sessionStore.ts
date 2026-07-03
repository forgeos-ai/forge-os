import "server-only";

import type { WorkingMemory } from "@/lib/athena/types";

const sessions = new Map<string, WorkingMemory>();

export function saveSession(memory: WorkingMemory): void {
  sessions.set(memory.sessionId, memory);
}

export function getSession(sessionId: string): WorkingMemory | undefined {
  return sessions.get(sessionId);
}

export function deleteSession(sessionId: string): boolean {
  return sessions.delete(sessionId);
}

export function hasSession(sessionId: string): boolean {
  return sessions.has(sessionId);
}

export function getSessionCount(): number {
  return sessions.size;
}
