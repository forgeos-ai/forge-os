"use client";

import { useCallback, useRef, useState } from "react";
import { motion } from "framer-motion";

type UploadZoneProps = {
  onFileSelect: (file: File) => void;
  disabled?: boolean;
  isUploading?: boolean;
};

export function UploadZone({ onFileSelect, disabled, isUploading }: UploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = useCallback(
    (file: File) => {
      if (disabled || isUploading) return;
      onFileSelect(file);
    },
    [disabled, isUploading, onFileSelect],
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        if (!disabled) setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={onDrop}
      className={`relative rounded-2xl border border-dashed p-10 text-center transition-all ${
        isDragging
          ? "border-[#22c55e]/50 bg-[#22c55e]/[0.04]"
          : "border-white/15 bg-white/[0.02] hover:border-white/25 hover:bg-white/[0.03]"
      } ${disabled ? "pointer-events-none opacity-50" : "cursor-pointer"}`}
      onClick={() => inputRef.current?.click()}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept="video/mp4,.mp4"
        className="sr-only"
        disabled={disabled || isUploading}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />

      <motion.div
        animate={isUploading ? { opacity: [0.5, 1, 0.5] } : { opacity: 1 }}
        transition={isUploading ? { repeat: Infinity, duration: 1.5 } : undefined}
      >
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04]">
          <svg
            className="h-6 w-6 text-white/50"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
            />
          </svg>
        </div>

        <p className="text-sm font-medium text-white/85">
          {isUploading ? "Uploading…" : "Drop your MP4 here"}
        </p>
        <p className="mt-1.5 text-xs text-white/40">or click to browse · max 500 MB</p>
      </motion.div>
    </div>
  );
}
