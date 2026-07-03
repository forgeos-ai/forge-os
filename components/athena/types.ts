export const DISCOVERY_QUESTIONS = [
  "What problem are you trying to solve?",
  "Who experiences this problem the most?",
  "How do they solve it today?",
  "What's frustrating about today's solution?",
  "Describe your solution in one sentence.",
  "What's the smallest version you could launch in 30 days?",
  "If everything goes well, what would success look like after 90 days?",
] as const;

export type InterviewStep = "intro" | "questions" | "brief";

export type DiscoveryAnswers = string[];

export type ProductBriefData = {
  startupIdea: string;
  problem: string;
  customer: string;
  currentSolution: string;
  frustrations: string;
  proposedSolution: string;
  mvp: string;
  successGoal: string;
};

export function buildProductBrief(answers: DiscoveryAnswers): ProductBriefData {
  const [problem, customer, currentSolution, frustrations, proposedSolution, mvp, successGoal] =
    answers;

  return {
    startupIdea: `${proposedSolution} — built for ${customer}`,
    problem,
    customer,
    currentSolution,
    frustrations,
    proposedSolution,
    mvp,
    successGoal,
  };
}
