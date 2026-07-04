"use client";

import { useState } from "react";
import { motion } from "framer-motion";

import {
  formatDuration,
  formatHashtags,
  getClipDownloadUrl,
  viralScoreColor,
  viralScoreLabel,
} from "@/lib/clips/client";
import type { GeneratedClip } from "@/lib/clips/types";

type ClipCardProps = {
  clip: GeneratedClip;
  jobId: string;
  index: number;
};

export function ClipCard({ clip, jobId, index }: ClipCardProps) {
  const [copied, setCopied] = useState<"title" | "caption" | null>(null);

  const copyText = async (text: string, field: "title" | "caption") => {
    await navigator.clipboard.writeText(text);
    setCopied(field);
    setTimeout(() => setCopied(null), 2000);
  };

  const fullCaption = `${clip.caption}\n\n${formatHashtags(clip.hashtags)}`;

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.45, ease: [0.25, 0.1, 0.25, 1] }}
      className="overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.02]"
    >
      <div className="relative aspect-[9/16] max-h-[420px] w-full overflow-hidden bg-black">
        <video
          src={clip.videoUrl}
          poster={clip.thumbnailUrl}
          controls
          playsInline
          className="h-full w-full object-cover"
        />
        <div className="absolute left-3 top-3 rounded-full bg-black/60 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur-sm">
          {formatDuration(clip.duration)}
        </div>
        <div
          className={`absolute right-3 top-3 rounded-full border border-white/10 bg-black/60 px-2.5 py-1 text-[11px] font-semibold backdrop-blur-sm ${viralScoreColor(clip.viralScore)}`}
        >
          {clip.viralScore} · {viralScoreLabel(clip.viralScore)}
        </div>
      </div>

      <div className="space-y-4 p-5">
        <div>
          <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-white">
            {clip.title}
          </h3>
          <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-white/45">
            {clip.caption}
          </p>
          {clip.hashtags.length > 0 && (
            <p className="mt-2 text-[11px] text-[#22c55e]/70">
              {formatHashtags(clip.hashtags)}
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2">
          <a
            href={getClipDownloadUrl(jobId, clip.id)}
            download
            className="col-span-2 flex items-center justify-center gap-2 rounded-xl bg-white py-2.5 text-xs font-semibold text-black transition-colors hover:bg-white/90"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
            Download
          </a>

          <button
            type="button"
            onClick={() => copyText(clip.title, "title")}
            className="rounded-xl border border-white/10 py-2.5 text-xs font-medium text-white/70 transition-colors hover:border-white/20 hover:text-white"
          >
            {copied === "title" ? "Copied!" : "Copy title"}
          </button>

          <button
            type="button"
            onClick={() => copyText(fullCaption, "caption")}
            className="rounded-xl border border-white/10 py-2.5 text-xs font-medium text-white/70 transition-colors hover:border-white/20 hover:text-white"
          >
            {copied === "caption" ? "Copied!" : "Copy caption"}
          </button>
        </div>
      </div>
    </motion.article>
  );
}
