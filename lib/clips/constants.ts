import path from "node:path";

export const CLIPS_DATA_DIR = path.join(process.cwd(), ".clips-data");

export const MAX_UPLOAD_BYTES = 500 * 1024 * 1024; // 500 MB

export const MIN_CLIP_SECONDS = 15;
export const MAX_CLIP_SECONDS = 60;
export const TARGET_CLIP_COUNT = { min: 5, max: 10 };

export const PROCESSING_STAGES = [
  { id: "extracting_audio", label: "Extracting audio" },
  { id: "generating_transcript", label: "Generating transcript" },
  { id: "finding_moments", label: "Finding best moments" },
  { id: "generating_subtitles", label: "Generating subtitles" },
  { id: "rendering_clips", label: "Rendering clips" },
] as const;

export const SUPPORTED_FORMATS = ["MP4", "YouTube", "Podcasts", "Webinars"] as const;

export const COMING_SOON_FEATURES = [
  { id: "batch", label: "Batch upload", description: "Process multiple videos at once" },
  { id: "brand", label: "Brand templates", description: "Consistent fonts, colors, and logos" },
  { id: "posting", label: "Auto posting", description: "Publish directly to social platforms" },
  { id: "languages", label: "Languages", description: "Subtitles and captions in 20+ languages" },
] as const;
