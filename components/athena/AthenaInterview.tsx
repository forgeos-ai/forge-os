"use client";

import dynamic from "next/dynamic";
import { useCallback, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

import { AthenaLoadingMessages } from "@/components/ui/AthenaLoadingMessages";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { PageTransition } from "@/components/ui/PageTransition";
import type { FounderBlueprint } from "@/lib/ai/types";
import type { AthenaConfidenceDto, AthenaQuestionDto } from "@/lib/employees/athena/types";
import {
  generateAthenaBrief,
  getAthenaQuestionRationale,
  startAthenaSession,
  submitAthenaAnswer,
} from "@/lib/employees/athena/client";

import { AthenaIntro } from "./AthenaIntro";
import { AthenaWorkspace } from "./AthenaWorkspace";
import { ProgressBar } from "./ProgressBar";
import { QuestionCard } from "./QuestionCard";

const ProductBrief = dynamic(
  () => import("./ProductBrief").then((module) => module.ProductBrief),
  {
    loading: () => (
      <div className="flex flex-1 flex-col justify-center py-16">
        <AthenaLoadingMessages />
        <p className="mt-4 text-sm text-white/40">
          Synthesizing your Founder Blueprint...
        </p>
      </div>
    ),
    ssr: false,
  },
);

type InterviewStep = "intro" | "questions" | "brief";

function parseErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error) {
    if (/fetch|network|failed to fetch/i.test(error.message)) {
      return "Please retry in a few moments.";
    }

    return error.message;
  }

  return fallback;
}

export function AthenaInterview() {
  const [step, setStep] = useState<InterviewStep>("intro");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [question, setQuestion] = useState<AthenaQuestionDto | null>(null);
  const [answer, setAnswer] = useState("");
  const [confidence, setConfidence] = useState<AthenaConfidenceDto | null>(null);
  const [brief, setBrief] = useState<FounderBlueprint | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleStart = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const session = await startAthenaSession();
      setSessionId(session.sessionId);
      setQuestion(session.question);
      setConfidence(session.confidence);
      setAnswer("");
      setStep("questions");
    } catch (startError) {
      setError(parseErrorMessage(startError, "Unable to start Athena session."));
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleAnswerChange = useCallback((value: string) => {
    setAnswer(value);
  }, []);

  const handleBack = useCallback(() => {
    setStep("intro");
    setSessionId(null);
    setQuestion(null);
    setAnswer("");
    setConfidence(null);
    setError(null);
  }, []);

  const handleNext = useCallback(async () => {
    if (!sessionId || !question) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await submitAthenaAnswer({
        sessionId,
        questionId: question.id,
        answer,
      });

      setConfidence(result.confidence);
      setAnswer("");

      if (result.readyForBrief) {
        const briefResult = await generateAthenaBrief(sessionId);
        setBrief(briefResult.brief);
        setQuestion(null);
        setStep("brief");
        return;
      }

      if (!result.question) {
        setError(
          "Athena did not return a next question. Please try again or start over.",
        );
        return;
      }

      setQuestion(result.question);
    } catch (submitError) {
      setError(parseErrorMessage(submitError, "Unable to submit answer."));
    } finally {
      setIsLoading(false);
    }
  }, [answer, question, sessionId]);

  const handleWhyAsked = useCallback(async () => {
    if (!sessionId || !question) {
      return null;
    }

    const result = await getAthenaQuestionRationale({
      sessionId,
      questionId: question.id,
    });

    return result.rationale;
  }, [question, sessionId]);

  const handleStartOver = useCallback(() => {
    setStep("intro");
    setSessionId(null);
    setQuestion(null);
    setAnswer("");
    setConfidence(null);
    setBrief(null);
    setError(null);
  }, []);

  return (
    <AthenaWorkspace>
      <AnimatePresence mode="wait">
        {step === "intro" && (
          <PageTransition key="intro">
            {error && (
              <div className="mb-6">
                <ErrorMessage message={error} />
              </div>
            )}
            <AthenaIntro onStart={handleStart} isLoading={isLoading} />
          </PageTransition>
        )}

        {step === "questions" && (
          <PageTransition key="questions">
            {confidence ? (
              <ProgressBar confidence={confidence.average} />
            ) : null}

            {error && (
              <div className="mb-6">
                <ErrorMessage message={error} />
              </div>
            )}

            {question && confidence ? (
              <QuestionCard
                questionId={question.id}
                question={question.text}
                value={answer}
                onChange={handleAnswerChange}
                onBack={handleBack}
                onNext={handleNext}
                onWhyAsked={handleWhyAsked}
                isLoading={isLoading}
              />
            ) : (
              <EmptyState
                title="Preparing your session"
                description="Athena is starting your discovery session."
              />
            )}
          </PageTransition>
        )}

        {step === "brief" && (
          <PageTransition key="brief">
            {brief ? (
              <ProductBrief brief={brief} onStartOver={handleStartOver} />
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-1 flex-col justify-center py-16"
              >
                <EmptyState
                  title="No blueprint yet"
                  description="Complete the conversation to generate your Founder Blueprint."
                />
              </motion.div>
            )}
          </PageTransition>
        )}
      </AnimatePresence>
    </AthenaWorkspace>
  );
}
