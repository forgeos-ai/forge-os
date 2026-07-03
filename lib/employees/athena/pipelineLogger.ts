import "server-only";

import type { ThinkingLoopResult } from "@/lib/forge-cortex/thinkingLoop";
import type { WorkingMemory } from "@/lib/athena/types";

const SERVER_INSTANCE_ID =
  globalThis.crypto?.randomUUID?.().slice(0, 8) ?? `srv-${Date.now()}`;

export type AthenaPipelineRoute = "session" | "answer" | "brief";

type LogLevel = "info" | "warn" | "error";

function log(level: LogLevel, event: string, payload: Record<string, unknown>) {
  const entry = {
    level,
    service: "athena-pipeline",
    event,
    instanceId: SERVER_INSTANCE_ID,
    timestamp: new Date().toISOString(),
    ...payload,
  };

  const serialized = JSON.stringify(entry);

  if (level === "error") {
    console.error(serialized);
    return;
  }

  if (level === "warn") {
    console.warn(serialized);
    return;
  }

  console.log(serialized);
}

export function getServerInstanceId(): string {
  return SERVER_INSTANCE_ID;
}

export function summarizeWorkingMemory(memory: WorkingMemory) {
  return {
    sessionId: memory.sessionId,
    status: memory.status,
    conversationCount: memory.conversation.length,
    pendingQuestionId: memory.pendingQuestion?.id ?? null,
    pendingQuestionPreview: memory.pendingQuestion?.questionText?.slice(0, 120) ?? null,
    lastTurn: memory.conversation.at(-1)
      ? {
          id: memory.conversation.at(-1)!.id,
          targetDimension: memory.conversation.at(-1)!.targetDimension,
          answerPreview: memory.conversation.at(-1)!.answer.slice(0, 120),
        }
      : null,
  };
}

export function summarizeCortexOutput(loop: ThinkingLoopResult) {
  return {
    shouldStop: loop.shouldStop,
    stopReason: loop.stopReason,
    selectedQuestionId: loop.selectedQuestion?.id ?? null,
    selectedObjective: loop.selectedQuestion?.question?.slice(0, 200) ?? null,
    selectedDimension: loop.selectedQuestion?.targetDimension ?? null,
    estimatedInformationGain: loop.selectedQuestion?.estimatedInformationGain ?? null,
    candidateCount: loop.candidates.length,
    gapCount: loop.gaps.length,
    assumptionCount: loop.assumptions.length,
    contradictionCount: loop.contradictions.length,
    confidenceAverage: loop.state.confidence
      ? Math.round(
          Object.values(loop.state.confidence).reduce((sum, score) => sum + score, 0) /
            Object.values(loop.state.confidence).length,
        )
      : null,
  };
}

export function logRouteIncoming(
  route: AthenaPipelineRoute,
  payload: Record<string, unknown> = {},
) {
  log("info", `${route}.request.incoming`, { route, ...payload });
}

export function logRouteReturned(
  route: AthenaPipelineRoute,
  payload: Record<string, unknown> = {},
) {
  log("info", `${route}.response.returned`, { route, ...payload });
}

export function logSessionId(sessionId: string, context: string) {
  log("info", "session.id", { sessionId, context });
}

export function logWorkingMemorySummary(
  memory: WorkingMemory,
  context: string,
) {
  log("info", "working-memory.summary", {
    context,
    memory: summarizeWorkingMemory(memory),
  });
}

export function logCortexOutput(loop: ThinkingLoopResult, context: string) {
  log("info", "cortex.output", {
    context,
    cortex: summarizeCortexOutput(loop),
  });
}

export function logSelectedObjective(
  objective: string | null,
  questionId: string | null,
  context: string,
) {
  log("info", "cortex.selected-objective", {
    context,
    questionId,
    objective: objective?.slice(0, 200) ?? null,
  });
}

export function logOpenAIStarted(task: string, metadata: Record<string, unknown>) {
  log("info", "openai.request.started", { task, ...metadata });
}

export function logOpenAIReceived(
  task: string,
  metadata: Record<string, unknown>,
) {
  log("info", "openai.response.received", { task, ...metadata });
}

export function logOpenAIError(task: string, error: unknown) {
  log("error", "openai.request.failed", {
    task,
    error: serializeError(error),
  });
}

export function logParsedResponse(
  task: string,
  parsed: Record<string, unknown>,
) {
  log("info", "openai.response.parsed", { task, parsed });
}

export function logParseFailure(task: string, rawContent: string) {
  log("error", "openai.response.parse-failed", {
    task,
    rawContentPreview: rawContent.slice(0, 2000),
    rawContentLength: rawContent.length,
  });
}

export function logSessionStoreAccess(
  action: "get" | "save" | "delete",
  sessionId: string,
  found: boolean,
) {
  log("info", "session-store.access", {
    action,
    sessionId,
    found,
    instanceId: SERVER_INSTANCE_ID,
  });
}

export function logPipelineError(
  context: string,
  error: unknown,
  metadata: Record<string, unknown> = {},
) {
  log("error", "pipeline.error", {
    context,
    ...metadata,
    error: serializeError(error),
  });
}

export function logEnvValidation(result: unknown) {
  log("info", "env.validation", { result });
}

export function logDiscoveryComplete(
  context: string,
  payload: Record<string, unknown>,
) {
  log("info", "discovery.complete", { context, ...payload });
}

function serializeError(error: unknown) {
  if (error instanceof Error) {
    const extended = error as Error & { status?: number; code?: string };

    return {
      name: extended.name,
      message: extended.message,
      stack: extended.stack,
      status: extended.status,
      code: extended.code,
    };
  }

  return { message: String(error) };
}
