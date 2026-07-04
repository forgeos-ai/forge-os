"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { ClipsHeader, ProcessingProgress } from "@/components/clips";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { PageTransition } from "@/components/ui/PageTransition";
import { getJobStatus } from "@/lib/clips/client";
import type { ClipJob } from "@/lib/clips/types";

const POLL_INTERVAL_MS = 2000;

export default function ProcessingPage() {
  const params = useParams<{ jobId: string }>();
  const router = useRouter();
  const jobId = params.jobId;

  const [job, setJob] = useState<ClipJob | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      try {
        const status = await getJobStatus(jobId);
        if (cancelled) return;

        setJob(status);

        if (status.status === "complete") {
          router.replace(`/results/${jobId}`);
          return;
        }

        if (status.status === "failed") {
          setError(status.error ?? "Processing failed");
          return;
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Could not fetch job status");
        }
      }
    }

    poll();
    const interval = setInterval(poll, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [jobId, router]);

  return (
    <>
      <ClipsHeader />
      <main className="flex min-h-screen flex-col items-center justify-center bg-black px-6 pb-16 pt-28 text-white sm:px-8">
        <PageTransition className="w-full">
          {error ? (
            <div className="mx-auto max-w-lg space-y-6 text-center">
              <ErrorMessage title="Processing failed" message={error} />
              <Link
                href="/create"
                className="inline-flex rounded-xl bg-white px-6 py-3 text-sm font-semibold text-black hover:bg-white/90"
              >
                Try again
              </Link>
            </div>
          ) : job ? (
            <ProcessingProgress
              stage={job.stage}
              stageProgress={job.stageProgress}
              sourceLabel={job.sourceLabel}
            />
          ) : (
            <div className="mx-auto max-w-lg text-center">
              <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-white/10 border-t-[#22c55e]" />
              <p className="text-sm text-white/40">Starting processing…</p>
            </div>
          )}
        </PageTransition>
      </main>
    </>
  );
}
