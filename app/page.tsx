"use client";

import Link from "next/link";
import { motion } from "framer-motion";

import { AlphaBanner } from "@/components/ui/AlphaBanner";
import { FORGE_ALPHA_VERSION } from "@/lib/constants";

export default function Home() {
  return (
    <>
      <AlphaBanner />
      <main className="relative flex min-h-screen items-center justify-center overflow-x-hidden bg-black px-6 pt-20 pb-16 text-white sm:px-8">
        <div className="max-w-5xl text-center">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.05 }}
            className="mb-6 text-sm font-semibold tracking-[0.2em] text-[#22c55e] uppercase"
          >
            {FORGE_ALPHA_VERSION}
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mb-6 text-5xl font-bold tracking-tight sm:text-7xl"
          >
            Forge OS
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="mb-10 text-lg leading-relaxed text-white/60 sm:text-2xl"
          >
            Build products faster.
            <br />
            <span className="font-semibold text-white">
              One Founder. Unlimited AI Employees.
            </span>
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-5"
          >
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Link
                href="/interview"
                className="inline-flex min-h-11 min-w-[180px] items-center justify-center rounded-xl bg-white px-8 py-4 text-sm font-semibold text-black transition-colors hover:bg-white/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#22c55e]"
              >
                Start Building
              </Link>
            </motion.div>

            <motion.button
              type="button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="inline-flex min-h-11 min-w-[180px] items-center justify-center rounded-xl border border-white/20 px-8 py-4 text-sm font-medium text-white/80 transition-colors hover:border-white/40 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#22c55e]"
            >
              Learn More
            </motion.button>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.35 }}
            className="mt-20 text-sm text-white/35"
          >
            Built with care using AI • Forge OS {FORGE_ALPHA_VERSION}
          </motion.p>
        </div>
      </main>
    </>
  );
}
