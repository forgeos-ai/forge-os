"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

import { ClipsHeader, UploadZone, UrlInput } from "@/components/clips";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { PageTransition } from "@/components/ui/PageTransition";
import { importVideoUrl, uploadVideo } from "@/lib/clips/client";

type Mode = "upload" | "url";

function CreateContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialMode = (searchParams.get("mode") as Mode) || "upload";

  const [mode, setMode] = useState<Mode>(initialMode);
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const goToProcessing = (jobId: string) => {
    router.push(`/processing/${jobId}`);
  };

  const handleUpload = async (file: File) => {
    setError(null);
    setIsSubmitting(true);
    try {
      const { jobId } = await uploadVideo(file);
      goToProcessing(jobId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
      setIsSubmitting(false);
    }
  };

  const handleUrlImport = async () => {
    setError(null);
    setIsSubmitting(true);
    try {
      const { jobId } = await importVideoUrl(url.trim());
      goToProcessing(jobId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed");
      setIsSubmitting(false);
    }
  };

  return (
    <PageTransition className="mx-auto w-full max-w-xl">
      <div className="mb-8 text-center">
        <p className="mb-2 text-xs font-medium uppercase tracking-[0.15em] text-[#22c55e]">
          Step 1
        </p>
        <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
          Add your video
        </h1>
        <p className="mt-2 text-sm text-white/45">
          Upload an MP4 or paste a URL for content you have rights to repurpose.
        </p>
      </div>

      <div className="mb-6 flex rounded-xl border border-white/[0.08] bg-white/[0.02] p-1">
        {(["upload", "url"] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setMode(tab)}
            disabled={isSubmitting}
            className={`flex-1 rounded-lg py-2.5 text-xs font-medium transition-all ${
              mode === tab
                ? "bg-white text-black"
                : "text-white/50 hover:text-white/80"
            }`}
          >
            {tab === "upload" ? "Upload MP4" : "Paste URL"}
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-6">
          <ErrorMessage title="Something went wrong" message={error} />
        </div>
      )}

      {mode === "upload" ? (
        <UploadZone
          onFileSelect={handleUpload}
          isUploading={isSubmitting}
          disabled={isSubmitting}
        />
      ) : (
        <UrlInput
          value={url}
          onChange={setUrl}
          onSubmit={handleUrlImport}
          isSubmitting={isSubmitting}
          disabled={isSubmitting}
        />
      )}
    </PageTransition>
  );
}

export default function CreatePage() {
  return (
    <>
      <ClipsHeader />
      <main className="min-h-screen bg-black px-6 pb-16 pt-28 text-white sm:px-8">
        <Suspense fallback={<div className="mx-auto max-w-xl animate-pulse text-white/30">Loading…</div>}>
          <CreateContent />
        </Suspense>
      </main>
    </>
  );
}
