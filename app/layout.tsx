import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { FORGE_CLIPS_VERSION } from "@/lib/constants";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Forge Clips",
  description:
    "Turn one long video into multiple short-form clips with AI. Upload MP4 or paste a URL.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col overflow-x-hidden">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-[#22c55e] focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-black"
        >
          Skip to main content
        </a>
        <div id="main-content" className="flex min-h-full flex-1 flex-col">
          {children}
        </div>
        <span className="sr-only">{FORGE_CLIPS_VERSION}</span>
      </body>
    </html>
  );
}
