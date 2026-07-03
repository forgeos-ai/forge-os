import {
  createWorkingMemory,
  markComplete,
  markReadyForBrief,
  recordAnswer,
  setPendingQuestion,
} from "./memory";

export {
  buildDiscoveryContext,
  createWorkingMemory,
  getLastConversationTurn,
  getQuestionRationale,
  markComplete,
  markReadyForBrief,
  recordAnswer,
  setPendingQuestion,
} from "./memory";

export type {
  ConversationTurn,
  DiscoveryContext,
  PendingQuestion,
  ProductBrief,
  WorkingMemory,
} from "./types";

export { IncompleteDiscoveryError } from "./types";
