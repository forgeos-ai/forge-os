"use client";

import Link from "next/link";
import { motion } from "framer-motion";

import { SUPPORTED_FORMATS } from "@/lib/clips/constants";

import { ComingSoonFeatures } from "./ComingSoonFeatures";

export function Hero() {
  return (
    <section className="relative overflow-hidden pt-14">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(34,197,94,0.12),transparent)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-0 h-px w-[min(100%,48rem)] -translate-x-1/2 bg-gradient-to-r from-transparent via-white/20 to-transparent"
      />

      <div className="relative mx-auto max-w-6xl px-6 pb-24 pt-24 sm:px-8 sm:pt-32">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
          className="mx-auto max-w-3xl text-center"
        >
          <p className="mb-5 text-xs font-medium uppercase tracking-[0.2em] text-[#22c55e]">
            AI video repurposing
          </p>

          <h1 className="mb-6 text-5xl font-semibold tracking-tight text-white sm:text-7xl">
            Forge Clips
          </h1>

          <p className="mb-10 text-lg leading-relaxed text-white/55 sm:text-xl">
            Turn one long video into multiple short-form clips with AI.
          </p>

          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
            <Link
              href="/create?mode=upload"
              className="inline-flex min-h-12 min-w-[200px] items-center justify-center rounded-xl bg-white px-8 text-sm font-semibold text-black transition-all hover:bg-white/90 hover:shadow-[0_0_40px_rgba(255,255,255,0.08)]"
            >
              Upload Video
            </Link>
            <Link
              href="/create?mode=url"
              className="inline-flex min-h-12 min-w-[200px] items-center justify-center rounded-xl border border-white/15 bg-white/[0.03] px-8 text-sm font-medium text-white/85 backdrop-blur-sm transition-all hover:border-white/25 hover:bg-white/[0.06]"
            >
              Paste Video URL
            </Link>
          </div>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-2">
            <span className="text-xs text-white/35">Supported:</span>
            {SUPPORTED_FORMATS.map((format) => (
              <span
                key={format}
                className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs text-white/60"
              >
                {format}
              </span>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.15, ease: [0.25, 0.1, 0.25, 1] }}
          className="mx-auto mt-20 max-w-4xl"
        >
          <div className="rounded-2xl border border-white/[0.08] bg-gradient-to-b from-white/[0.04] to-transparent p-1 shadow-[0_20px_80px_rgba(0,0,0,0.5)]">
            <div className="rounded-[14px] border border-white/[0.06] bg-[#0a0a0a] p-6 sm:p-8">
              <div className="mb-6 flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-[#22c55e]" />
                <span className="text-xs font-medium text-white/40">Preview workflow</span>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                {[
                  { step: "01", label: "Upload", desc: "MP4 or paste a URL you own" },
                  { step: "02", label: "Process", desc: "AI finds hooks & renders 9:16 clips" },
                  { step: "03", label: "Export", desc: "Download with titles & captions" },
                ].map((item) => (
                  <div
                    key={item.step}
                    className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4"
                  >
                    <span className="text-[10px] font-mono text-[#22c55e]/80">{item.step}</span>
                    <p className="mt-1 text-sm font-medium text-white/90">{item.label}</p>
                    <p className="mt-1 text-xs leading-relaxed text-white/40">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        <ComingSoonFeatures />
      </div>
    </section>
  );
}
