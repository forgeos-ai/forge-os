import type { Metadata } from "next";

import { AthenaInterview } from "@/components/athena/AthenaInterview";

export const metadata: Metadata = {
  title: "Athena — Forge OS",
  description:
    "Work with Athena, your AI Product Manager, to transform your startup idea into an execution plan.",
};

export default function InterviewPage() {
  return <AthenaInterview />;
}
