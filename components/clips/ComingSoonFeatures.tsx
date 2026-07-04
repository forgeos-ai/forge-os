"use client";

import { COMING_SOON_FEATURES } from "@/lib/clips/constants";

export function ComingSoonFeatures() {
  return (
    <section className="mx-auto mt-24 max-w-4xl">
      <p className="mb-6 text-center text-xs font-medium uppercase tracking-[0.15em] text-white/30">
        Roadmap
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        {COMING_SOON_FEATURES.map((feature) => (
          <div
            key={feature.id}
            className="relative overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 opacity-60"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-white/70">{feature.label}</p>
                <p className="mt-1 text-xs leading-relaxed text-white/35">
                  {feature.description}
                </p>
              </div>
              <span className="shrink-0 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-white/40">
                Coming Soon
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
