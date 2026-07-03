import "server-only";

import { generateProductBrief, generateQuestion } from "@/lib/ai/gateway";
import {
  createWorkingMemory,
  getQuestionRationale,
  markComplete,
  markReadyForBrief,
  recordAnswer,
  setPendingQuestion,
} from "@/lib/athena/memory";
import type { PendingQuestion, WorkingMemory } from "@/lib/athena/types";
import {
  getAverageConfidence,
  runThinkingLoop,
} from "@/lib/forge-cortex";
import type { CandidateQuestion, CortexState } from "@/lib/forge-cortex/types";

import {
  logCortexOutput,
  logDiscoveryComplete,
  logOpenAIStarted,
  logParsedResponse,
  logPipelineError,
  logSelectedObjective,
  logSessionId,
  logWorkingMemorySummary,
  summarizeWorkingMemory,
} from "./pipelineLogger";
import { deleteSession, getSession, saveSession } from "./sessionStore";
import type {
  AthenaAnswerResponse,
  AthenaBriefResponse,
  AthenaConfidenceDto,
  AthenaQuestionDto,
  AthenaRationaleResponse,
  AthenaSessionResponse,
} from "./types";
import {
  AthenaServiceError,
  AthenaSessionNotFoundError,
} from "./types";
import { validateAthenaEnvironment } from "./validateEnv";

function requireSession(sessionId: string): WorkingMemory {
  const memory = getSession(sessionId);

  if (!memory) {
    throw new AthenaSessionNotFoundError(sessionId);
  }

  return memory;
}

function toConfidenceDto(state: CortexState): AthenaConfidenceDto {
  return {
    average: getAverageConfidence(state.confidence),
    lowestDimension: state.lowestGap.dimension,
    lowestScore: state.lowestGap.score,
    scores: state.confidence,
  };
}

function toQuestionDto(question: PendingQuestion): AthenaQuestionDto {
  return {
    id: question.id,
    text: question.questionText,
  };
}

function assertQuestionMaterialized(
  question: PendingQuestion | null,
  context: string,
): asserts question is PendingQuestion {
  if (!question?.questionText?.trim()) {
    logPipelineError(`${context}.missing-question-text`, new Error("Empty question text"), {
      questionId: question?.id ?? null,
    });

    throw new AthenaServiceError(
      "Athena failed to materialize the next question.",
      "QUESTION_MATERIALIZATION_FAILED",
      500,
    );
  }
}

async function materializeQuestion(
  memory: WorkingMemory,
  candidate: CandidateQuestion,
  context: string,
): Promise<{ memory: WorkingMemory; question: PendingQuestion; state: CortexState }> {
  logSelectedObjective(candidate.question, candidate.id, `${context}.before-openai`);
  logOpenAIStarted("generate-question", {
    sessionId: memory.sessionId,
    candidateId: candidate.id,
    targetDimension: candidate.targetDimension,
  });

  const generated = await generateQuestion({
    memory,
    candidate,
  });

  logParsedResponse("generate-question", {
    sessionId: memory.sessionId,
    questionPreview: generated.data.question.slice(0, 200),
    provider: generated.provider,
    finishReason: generated.response.finishReason,
  });

  const pendingQuestion: PendingQuestion = {
    id: candidate.id,
    questionText: generated.data.question,
    reason: candidate.reason,
    targetDimension: candidate.targetDimension,
    estimatedInformationGain: candidate.estimatedInformationGain,
    askedAt: new Date(),
  };

  assertQuestionMaterialized(pendingQuestion, context);

  const updatedMemory = setPendingQuestion(memory, pendingQuestion);
  const state = runThinkingLoop(updatedMemory).state;

  return {
    memory: updatedMemory,
    question: pendingQuestion,
    state,
  };
}

async function advanceSession(
  memory: WorkingMemory,
  context: string,
): Promise<{
  memory: WorkingMemory;
  question: PendingQuestion | null;
  state: CortexState;
  readyForBrief: boolean;
}> {
  const loop = runThinkingLoop(memory);
  logCortexOutput(loop, context);

  if (loop.shouldStop || !loop.selectedQuestion) {
    logDiscoveryComplete(context, {
      shouldStop: loop.shouldStop,
      stopReason: loop.stopReason,
      hasSelectedQuestion: Boolean(loop.selectedQuestion),
    });

    return {
      memory: markReadyForBrief(memory),
      question: null,
      state: loop.state,
      readyForBrief: true,
    };
  }

  logSelectedObjective(
    loop.selectedQuestion.question,
    loop.selectedQuestion.id,
    `${context}.selected`,
  );

  const next = await materializeQuestion(memory, loop.selectedQuestion, context);

  return {
    memory: next.memory,
    question: next.question,
    state: next.state,
    readyForBrief: false,
  };
}

function buildSessionResponse(
  memory: WorkingMemory,
  question: PendingQuestion,
  state: CortexState,
): AthenaSessionResponse {
  return {
    sessionId: memory.sessionId,
    status: memory.status,
    question: toQuestionDto(question),
    confidence: toConfidenceDto(state),
    questionNumber: memory.conversation.length + 1,
  };
}

function buildAnswerResponse(
  memory: WorkingMemory,
  question: PendingQuestion | null,
  state: CortexState,
  readyForBrief: boolean,
): AthenaAnswerResponse {
  return {
    sessionId: memory.sessionId,
    status: memory.status,
    question: question ? toQuestionDto(question) : null,
    confidence: toConfidenceDto(state),
    questionNumber: readyForBrief
      ? memory.conversation.length
      : memory.conversation.length + 1,
    readyForBrief,
  };
}

export async function startAthenaSession(): Promise<AthenaSessionResponse> {
  const env = validateAthenaEnvironment();

  if (env.errors.length > 0 && env.isLiveOpenAI) {
    throw new AthenaServiceError(
      env.errors.join(" "),
      "ATHENA_ENV_INVALID",
      500,
    );
  }

  const memory = createWorkingMemory();
  logSessionId(memory.sessionId, "session.start");
  logWorkingMemorySummary(memory, "session.start");

  const advanced = await advanceSession(memory, "session.start");

  if (!advanced.question) {
    throw new AthenaServiceError(
      "Unable to start discovery session.",
      "SESSION_START_FAILED",
      500,
    );
  }

  saveSession(advanced.memory);

  const response = buildSessionResponse(
    advanced.memory,
    advanced.question,
    advanced.state,
  );

  return response;
}

export async function submitAthenaAnswer(
  sessionId: string,
  questionId: string,
  answer: string,
): Promise<AthenaAnswerResponse> {
  const trimmedAnswer = answer.trim();

  if (!trimmedAnswer) {
    throw new AthenaServiceError("Answer cannot be empty.", "EMPTY_ANSWER");
  }

  const memory = requireSession(sessionId);
  logSessionId(sessionId, "answer.submit");
  logWorkingMemorySummary(memory, "answer.before-record");

  if (!memory.pendingQuestion) {
    throw new AthenaServiceError(
      "No active question for this session.",
      "NO_PENDING_QUESTION",
    );
  }

  if (memory.pendingQuestion.id !== questionId) {
    throw new AthenaServiceError(
      "Submitted question does not match the active question.",
      "QUESTION_MISMATCH",
      409,
    );
  }

  const answeredMemory = recordAnswer(memory, trimmedAnswer);
  logWorkingMemorySummary(answeredMemory, "answer.after-record");

  const advanced = await advanceSession(answeredMemory, "answer.advance");

  if (!advanced.readyForBrief) {
    assertQuestionMaterialized(advanced.question, "answer.advance");
  }

  saveSession(advanced.memory);
  logWorkingMemorySummary(advanced.memory, "answer.saved");

  const response = buildAnswerResponse(
    advanced.memory,
    advanced.question,
    advanced.state,
    advanced.readyForBrief,
  );

  if (!response.readyForBrief && !response.question) {
    throw new AthenaServiceError(
      "Answer recorded but no next question was produced.",
      "NEXT_QUESTION_MISSING",
      500,
    );
  }

  return response;
}

export async function generateAthenaBrief(
  sessionId: string,
): Promise<AthenaBriefResponse> {
  const memory = requireSession(sessionId);
  logSessionId(sessionId, "brief.generate");
  logWorkingMemorySummary(memory, "brief.before-generate");

  if (memory.status !== "ready-for-brief" && memory.status !== "complete") {
    throw new AthenaServiceError(
      "Discovery is not complete. Continue answering questions before generating a brief.",
      "DISCOVERY_INCOMPLETE",
    );
  }

  logOpenAIStarted("generate-product-brief", {
    sessionId,
    conversationCount: memory.conversation.length,
  });

  const result = await generateProductBrief({ memory });

  logParsedResponse("generate-product-brief", {
    sessionId,
    provider: result.provider,
    finishReason: result.response.finishReason,
    blueprintVersion: result.data.metadata.version,
  });

  const completedMemory = markComplete(memory);
  saveSession(completedMemory);

  return {
    sessionId,
    brief: result.data,
    provider: result.provider,
  };
}

export function getAthenaQuestionRationale(
  sessionId: string,
  questionId: string,
): AthenaRationaleResponse {
  const memory = requireSession(sessionId);
  const rationale = getQuestionRationale(memory, questionId);

  if (!rationale) {
    throw new AthenaServiceError(
      "Rationale not found for this question.",
      "RATIONALE_NOT_FOUND",
      404,
    );
  }

  return {
    sessionId,
    questionId,
    rationale,
  };
}

export function resetAthenaSession(sessionId: string): void {
  requireSession(sessionId);
  deleteSession(sessionId);
}

export function getAthenaPipelineDiagnostics(sessionId?: string) {
  const env = validateAthenaEnvironment();
  const memory = sessionId ? getSession(sessionId) : null;

  return {
    env,
    sessionId: sessionId ?? null,
    sessionFound: sessionId ? Boolean(memory) : null,
    sessionSummary: memory ? summarizeWorkingMemory(memory) : null,
  };
}
