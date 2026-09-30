"use client";

import React, { useState, useRef } from "react";
import { Player, PlayerRef } from "@remotion/player";
import { GrooveSwapComposition } from "../../../remotion/GrooveSwapComposition";
import Link from "next/link";
import {
  ArrowLeft,
  UploadCloud,
  Download,
  Trash2,
  Layers,
  Music,
  Zap,
} from "lucide-react";

const TOTAL_FRAMES = 229; // Exactly 7.633s @ 30 FPS (110 BPM)
const TOTAL_SLOTS = 7;

const DEFAULT_PHOTOS = [
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200",
  "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=1200",
  "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=1200",
  "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=1200",
];

export default function GrooveSwapPresetPage() {
  const [uploadedPhotos, setUploadedPhotos] =
    useState<string[]>(DEFAULT_PHOTOS);
  const [resolution, setResolution] = useState<"1080p" | "2k" | "4k">("1080p");
  const [isExporting, setIsExporting] = useState(false);
  const [renderProgress, setRenderProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [playerKey, setPlayerKey] = useState(0);

  const playerRef = useRef<PlayerRef>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileList = Array.from(files);
    Promise.all(
      fileList.map(
        (file) =>
          new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = (event) => resolve(event.target?.result as string);
            reader.readAsDataURL(file);
          }),
      ),
    ).then((newPhotos) => {
      setUploadedPhotos(newPhotos);
      setPlayerKey((k) => k + 1);
    });
  };

  const removePhoto = (index: number) => {
    if (uploadedPhotos.length <= 1) return;
    const filtered = uploadedPhotos.filter((_, i) => i !== index);
    setUploadedPhotos(filtered);
    setPlayerKey((k) => k + 1);
  };

  const handleExport = async () => {
    setIsExporting(true);
    setRenderProgress(0);
    setStatusMessage("Initializing render engine...");

    try {
      const res = await fetch("/api/render", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          compositionId: "GrooveSwapComposition",
          photos: uploadedPhotos,
          resolution,
        }),
      });

      if (!res.ok || !res.body) {
        throw new Error("Failed to connect to export engine");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let done = false;
      let buffer = "";

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;

        if (value) {
          buffer += decoder.decode(value, { stream: true });
          const events = buffer.split("\n\n");
          buffer = events.pop() || "";

          for (const event of events) {
            const trimmed = event.trim();
            if (trimmed.startsWith("data: ")) {
              try {
                const data = JSON.parse(trimmed.replace("data: ", ""));
                if (typeof data.progress === "number")
                  setRenderProgress(data.progress);
                if (data.message) setStatusMessage(data.message);

                if (data.status === "complete" && data.downloadUrl) {
                  const link = document.createElement("a");
                  link.href = data.downloadUrl;
                  link.download = `groove-swap-${resolution}.mp4`;
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                  setStatusMessage("Video downloaded successfully!");
                  setTimeout(() => {
                    setIsExporting(false);
                    setRenderProgress(0);
                  }, 2500);
                  return;
                }
                if (data.status === "error") throw new Error(data.message);
              } catch (err: any) {
                if (err.message && err.message !== "Render failed") {
                  // ignore chunk boundaries
                } else {
                  throw err;
                }
              }
            }
          }
        }
      }
    } catch (err: any) {
      alert(`Export error: ${err.message}`);
      setIsExporting(false);
      setRenderProgress(0);
      setStatusMessage(null);
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 font-sans text-slate-800">
      {/* LEFT PANEL */}
      <aside className="w-[480px] flex flex-col border-r border-slate-200 bg-white shadow-sm z-10">
        <div className="border-b border-slate-100 p-6">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              title="Back to Home"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-50 border border-indigo-100 text-[10px] font-bold text-indigo-700 uppercase tracking-wider mb-1">
                <Zap className="w-3 h-3 text-indigo-600" /> Dedicated Preset
                Engine
              </div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900">
                110 BPM Groove Swap
              </h1>
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            Steady, rhythmic photo cuts synchronized directly to the
            electro-funk slap bass & kick hits with subtle micro-drift.
          </p>

          <div className="mt-4 flex items-center justify-between rounded-xl bg-slate-50 border border-slate-200 px-3.5 py-2.5">
            <div className="flex items-center gap-2.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                <Music className="w-3.5 h-3.5" />
              </span>
              <div>
                <p className="text-xs font-bold text-slate-800">
                  ReelAudio-2 • 110 BPM
                </p>
                <p className="text-[10px] text-slate-400">
                  7 Rhythmic Beats • 7.6s Loop
                </p>
              </div>
            </div>
            <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
              Downbeat Synced
            </span>
          </div>
        </div>

        {/* PHOTO LIST */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Uploaded Photos ({uploadedPhotos.length})
            </span>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handlePhotoUpload}
              multiple
              accept="image/*"
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold transition-colors"
            >
              <UploadCloud className="w-3.5 h-3.5" />
              Add More Photos
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {uploadedPhotos.map((url, idx) => (
              <div
                key={idx}
                className="group relative aspect-[9/14] rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 shadow-sm"
              >
                <img
                  src={url}
                  alt={`Upload ${idx + 1}`}
                  className="w-full h-full object-cover"
                />
                <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur text-[10px] font-bold text-white">
                  Photo {idx + 1}
                </span>
                <button
                  onClick={() => removePhoto(idx)}
                  className="absolute top-2 right-2 p-1.5 rounded-md bg-black/60 text-white/80 hover:text-red-400 hover:bg-black/90 opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Remove"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          {/* 7-SLOT RHYTHM DISTRIBUTION MAP */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 space-y-2.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
              <Layers className="w-3.5 h-3.5 text-indigo-600" /> Auto-Cycle
              Groove Mapping
            </div>
            <p className="text-[11px] text-slate-500">
              Your {uploadedPhotos.length} photo(s) are distributed across all 7
              downbeat slots (~1.10s each):
            </p>
            <div className="grid grid-cols-4 gap-1.5 pt-1">
              {Array.from({ length: TOTAL_SLOTS }).map((_, slotIdx) => {
                const photoNum = (slotIdx % uploadedPhotos.length) + 1;
                return (
                  <div
                    key={slotIdx}
                    className="p-1.5 rounded-lg bg-white border border-slate-200 text-center"
                  >
                    <span className="text-[10px] font-mono text-slate-400 block">
                      Beat {slotIdx + 1}
                    </span>
                    <span className="text-xs font-bold text-indigo-600">
                      Photo {photoNum}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* BOTTOM EXPORT ACTIONS */}
        <div className="border-t border-slate-200 p-5 bg-white space-y-3">
          <div className="flex items-center gap-3">
            <select
              value={resolution}
              onChange={(e) => setResolution(e.target.value as any)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-medium text-slate-700 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-sm"
            >
              <option value="1080p">1080p (FHD)</option>
              <option value="2k">2K (QHD)</option>
              <option value="4k">4K (Ultra HD)</option>
            </select>

            <button
              onClick={handleExport}
              disabled={isExporting || uploadedPhotos.length === 0}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 hover:from-indigo-500 hover:to-pink-500 text-white py-3 px-4 text-xs font-semibold shadow-md shadow-indigo-600/20 disabled:opacity-50 transition-all duration-300"
            >
              <Download className="w-3.5 h-3.5" />
              {isExporting
                ? "Exporting..."
                : `Export ${resolution.toUpperCase()} Reel`}
            </button>
          </div>
        </div>
      </aside>

      {/* RIGHT PREVIEW STAGE */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 bg-slate-100 relative">
        <div className="relative flex flex-col items-center w-full max-w-[440px]">
          {isExporting ? (
            <div className="w-full mb-3 bg-white/95 backdrop-blur border border-indigo-100 rounded-2xl p-4 shadow-lg shadow-indigo-500/5 transition-all">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-800 mb-2">
                <span className="flex items-center gap-2 text-indigo-600">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-indigo-600"></span>
                  </span>
                  Exporting {resolution.toUpperCase()} Reel
                </span>
                <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-lg border border-indigo-100">
                  {renderProgress}%
                </span>
              </div>
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-violet-600 rounded-full transition-all duration-300"
                  style={{ width: `${Math.max(4, renderProgress)}%` }}
                />
              </div>
              <p className="text-[11px] text-slate-500 text-center mt-2 font-medium truncate">
                {statusMessage}
              </p>
            </div>
          ) : (
            <div className="mb-2.5 flex items-center gap-2 rounded-full bg-white/80 backdrop-blur border border-slate-200 px-3.5 py-1 shadow-sm text-xs text-slate-600">
              <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
              <span>7.6s Bass/Kick Synced • 110 BPM</span>
            </div>
          )}

          <div className="h-[84vh] aspect-[9/16] rounded-[24px] overflow-hidden bg-black relative flex items-center justify-center shadow-2xl ring-1 ring-slate-900/10">
            <Player
              key={playerKey}
              ref={playerRef}
              component={GrooveSwapComposition}
              inputProps={{
                photos: uploadedPhotos,
              }}
              durationInFrames={TOTAL_FRAMES}
              fps={30}
              compositionWidth={1080}
              compositionHeight={1920}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
              controls
              loop
              clickToPlay
              acknowledgeRemotionLicense
            />
          </div>
        </div>
      </main>
    </div>
  );
}
