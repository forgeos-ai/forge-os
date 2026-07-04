"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { ClipCard, ClipsHeader } from "@/components/clips";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { PageTransition } from "@/components/ui/PageTransition";
import { getJobStatus } from "@/lib/clips/client";
import type { ClipJob } from "@/lib/clips/types";

export default function ResultsPage() {
  const params = useParams<{ jobId: string }>();
  const jobId = params.jobId;

  const [job, setJob] = useState<ClipJob | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getJobStatus(jobId)
      .then((status) => {
        if (status.status !== "complete" || !status.clips?.length) {
          setError("Clips are not ready yet. Processing may still be in progress.");
        }
        setJob(status);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Could not load results");
      })
      .finally(() => setLoading(false));
  }, [jobId]);

  return (
    <>
      <ClipsHeader />
      <main className="min-h-screen bg-black px-6 pb-20 pt-28 text-white sm:px-8">
        <PageTransition className="mx-auto max-w-6xl">
          <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-[0.15em] text-[#22c55e]">
                Step 3
              </p>
              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                Your clips are ready
              </h1>
              {job && (
                <p className="mt-2 truncate text-sm text-white/40">{job.sourceLabel}</p>
              )}
            </div>
            <Link
              href="/create"
              className="inline-flex shrink-0 items-center justify-center rounded-xl border border-white/15 px-5 py-2.5 text-xs font-medium text-white/70 transition-colors hover:border-white/30 hover:text-white"
            >
              Process another video
            </Link>
          </div>

          {loading && (
            <div className="py-20 text-center text-sm text-white/40">Loading clips…</div>
          )}

          {error && !loading && (
            <ErrorMessage title="Unable to load clips" message={error} />
          )}

          {job?.clips && job.clips.length > 0 && (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {job.clips.map((clip, index) => (
                <ClipCard key={clip.id} clip={clip} jobId={jobId} index={index} />
              ))}
            </div>
          )}
        </PageTransition>
      </main>
    </>
  );
}
