import type { Metadata } from "next";

import { AthenaInterview } from "@/components/athena";
import { FORGE_ALPHA_VERSION } from "@/lib/constants";

export const metadata: Metadata = {
  title: `Athena — Forge OS ${FORGE_ALPHA_VERSION}`,
  description:
    "Work with Athena, your AI Product Manager, to transform your startup idea into an execution plan.",
};

export default function InterviewPage() {
  return <AthenaInterview />;
}
