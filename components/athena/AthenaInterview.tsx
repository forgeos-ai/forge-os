"use client";

import { useCallback, useState } from "react";

import { AthenaIntro } from "./AthenaIntro";
import { AthenaWorkspace } from "./AthenaWorkspace";
import { ProductBrief } from "./ProductBrief";
import { ProgressBar } from "./ProgressBar";
import { QuestionCard } from "./QuestionCard";
import {
  buildProductBrief,
  DISCOVERY_QUESTIONS,
  type InterviewStep,
} from "./types";

const TOTAL_QUESTIONS = DISCOVERY_QUESTIONS.length;

function createEmptyAnswers(): string[] {
  return Array(TOTAL_QUESTIONS).fill("");
}

export function AthenaInterview() {
  const [step, setStep] = useState<InterviewStep>("intro");
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<string[]>(createEmptyAnswers);

  const handleStart = useCallback(() => {
    setStep("questions");
    setCurrentQuestion(0);
  }, []);

  const handleAnswerChange = useCallback((value: string) => {
    setAnswers((prev) => {
      const next = [...prev];
      next[currentQuestion] = value;
      return next;
    });
  }, [currentQuestion]);

  const handleBack = useCallback(() => {
    if (currentQuestion === 0) {
      setStep("intro");
      return;
    }
    setCurrentQuestion((prev) => prev - 1);
  }, [currentQuestion]);

  const handleNext = useCallback(() => {
    if (currentQuestion < TOTAL_QUESTIONS - 1) {
      setCurrentQuestion((prev) => prev + 1);
      return;
    }
    setStep("brief");
  }, [currentQuestion]);

  const handleStartOver = useCallback(() => {
    setStep("intro");
    setCurrentQuestion(0);
    setAnswers(createEmptyAnswers());
  }, []);

  const brief = buildProductBrief(answers);

  return (
    <AthenaWorkspace>
      {step === "intro" && <AthenaIntro onStart={handleStart} />}

      {step === "questions" && (
        <>
          <ProgressBar current={currentQuestion + 1} total={TOTAL_QUESTIONS} />
          <QuestionCard
            questionNumber={currentQuestion + 1}
            question={DISCOVERY_QUESTIONS[currentQuestion]}
            value={answers[currentQuestion]}
            onChange={handleAnswerChange}
            onBack={handleBack}
            onNext={handleNext}
            isLast={currentQuestion === TOTAL_QUESTIONS - 1}
          />
        </>
      )}

      {step === "brief" && (
        <ProductBrief brief={brief} onStartOver={handleStartOver} />
      )}
    </AthenaWorkspace>
  );
}
