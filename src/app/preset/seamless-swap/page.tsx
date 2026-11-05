"use client";

import React, { useState, useRef, useEffect } from "react";
import { Player, PlayerRef } from "@remotion/player";
import {
  SeamlessSwapComposition,
  TOTAL_FRAMES,
} from "../../../remotion/SeamlessSwapComposition";
import Link from "next/link";
import {
  ArrowLeft,
  UploadCloud,
  Download,
  Trash2,
  Layers,
  Music,
  Settings2,
  Play,
  Pause,
  Loader2,
  Eye,
  EyeOff,
  Camera,
  AlertCircle,
} from "lucide-react";

const DEFAULT_PHOTOS = [
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200",
  "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=1200",
];

async function ensureDataUrl(url: string): Promise<string> {
  if (url.startsWith("data:") || url.startsWith("blob:")) return url;
  try {
    const res = await fetch(url, { mode: "cors" });
    const blob = await res.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });
  } catch {
    return url;
  }
}

export default function SeamlessSwapPresetPage() {
  const [uploadedPhotos, setUploadedPhotos] =
    useState<string[]>(DEFAULT_PHOTOS);
  const [resolution, setResolution] = useState<"1080p" | "2k" | "4k">("1080p");
  const [isExporting, setIsExporting] = useState(false);
  const [renderProgress, setRenderProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const [uploadError, setUploadError] = useState<{
    show: boolean;
    message: string;
  }>({ show: false, message: "" });
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [playerKey, setPlayerKey] = useState(0);
  const [showInstagramOverlay, setShowInstagramOverlay] = useState(false);

  const playerRef = useRef<PlayerRef>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fps = 30;

  useEffect(() => {
    let animationFrameId: number;
    const updatePlayerState = () => {
      if (playerRef.current) {
        setIsPlaying(playerRef.current.isPlaying());
        setCurrentFrame(playerRef.current.getCurrentFrame());
      }
      animationFrameId = requestAnimationFrame(updatePlayerState);
    };
    updatePlayerState();
    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  const togglePlayPause = () => {
    if (playerRef.current) {
      if (playerRef.current.isPlaying()) playerRef.current.pause();
      else playerRef.current.play();
    }
  };

  const handleSeekVideo = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!playerRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, clickX / rect.width));
    const newFrame = Math.round(percentage * TOTAL_FRAMES);
    playerRef.current.seekTo(newFrame);
    setCurrentFrame(newFrame);
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return "0:00";
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const fileList = Array.from(files);

    const validUrls: string[] = [];

    for (const file of fileList) {
      try {
        const url = await new Promise<string>((resolve, reject) => {
          const tempUrl = URL.createObjectURL(file);
          const img = new Image();
          img.onload = () => {
            const ratio = img.height / img.width;
            if (ratio >= 1.4 && ratio <= 2.2) {
              resolve(tempUrl);
            } else {
              reject(
                `"${file.name}" is not vertical. Upload 9:16 portrait photos only.`,
              );
            }
          };
          img.onerror = () => reject(`Failed to load "${file.name}".`);
          img.src = tempUrl;
        });
        validUrls.push(url);
      } catch (error: any) {
        setUploadError({ show: true, message: error });
        break;
      }
    }

    if (validUrls.length > 0) {
      setUploadedPhotos((prev) => {
        const combined =
          prev === DEFAULT_PHOTOS ? validUrls : [...prev, ...validUrls];
        return combined.slice(0, 34); // Cap at exactly 34 photos for Seamless Swap
      });
      setPlayerKey((k) => k + 1);
    }

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removePhoto = (index: number) => {
    if (uploadedPhotos.length <= 1) return;
    setUploadedPhotos(uploadedPhotos.filter((_, i) => i !== index));
    setPlayerKey((k) => k + 1);
  };

  const handleExport = async () => {
    setIsExporting(true);
    setRenderProgress(0);
    setStatusMessage("Preparing local image buffers...");
    const dimensions = {
      "1080p": { width: 1080, height: 1920 },
      "2k": { width: 1440, height: 2560 },
      "4k": { width: 2160, height: 3840 },
    }[resolution];

    try {
      const safePhotos = await Promise.all(
        uploadedPhotos.map((url) => ensureDataUrl(url)),
      );
      setStatusMessage("Initializing browser GPU encoder...");
      const { renderMediaOnWeb } = await import("@remotion/web-renderer");

      const { getBlob } = await renderMediaOnWeb({
        composition: {
          id: "SeamlessSwapComposition",
          component: SeamlessSwapComposition as React.ComponentType<any>,
          durationInFrames: TOTAL_FRAMES,
          fps,
          width: dimensions.width,
          height: dimensions.height,
        },
        inputProps: { photos: safePhotos },
        onProgress: ({ progress }) => {
          const percent = Math.round(progress * 100);
          setRenderProgress(percent);
          setStatusMessage(`Encoding video on GPU (${percent}%)...`);
        },
      });

      const blob = await getBlob();
      const downloadUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = `seamless-swap-${resolution}.mp4`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(downloadUrl);
      setStatusMessage("Video downloaded successfully!");
      setTimeout(() => {
        setIsExporting(false);
        setRenderProgress(0);
      }, 2500);
    } catch (err: any) {
      console.error(err);
      alert(`Export error: ${err.message || "Failed to render video"}`);
      setIsExporting(false);
    }
  };

  return (
    <div className="relative flex flex-col lg:flex-row h-[100dvh] w-full overflow-hidden bg-gradient-to-b from-indigo-950 via-slate-900 to-black lg:bg-none lg:bg-[#FDFDFF] font-sans text-slate-800">
      {uploadError.show && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-white rounded-[2rem] p-6 shadow-2xl border border-slate-100 text-center animate-in zoom-in-95 duration-200">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-500 mb-4 border border-red-100 shadow-sm">
              <AlertCircle className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-black text-slate-900 tracking-tight">
              Upload Issue
            </h3>
            <p className="text-xs text-slate-500 mt-2 mb-6 px-2 leading-relaxed">
              {uploadError.message}
            </p>
            <button
              onClick={() => setUploadError({ show: false, message: "" })}
              className="w-full py-3 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors shadow-md"
            >
              Got it
            </button>
          </div>
        </div>
      )}

      <main className="order-1 lg:order-2 h-[48dvh] lg:h-full w-full flex-1 flex flex-col items-center justify-center pt-2 pb-0 px-2 lg:p-6 relative z-10 lg:bg-slate-100">
        <div className="relative flex flex-col items-center justify-center w-full h-full max-w-[460px]">
          {isExporting && (
            <div className="w-full max-w-[320px] lg:max-w-full mb-2 lg:mb-3 bg-white/10 lg:bg-white/95 backdrop-blur-xl border border-white/20 lg:border-indigo-100 rounded-2xl p-4 shadow-2xl lg:shadow-xl transition-all">
              <div className="flex items-center justify-between text-xs font-bold text-white lg:text-slate-800 mb-2">
                <span className="flex items-center gap-2 text-indigo-300 lg:text-indigo-600">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> GPU Export
                </span>
                <span className="lg:font-mono lg:text-indigo-700 lg:bg-indigo-50 lg:px-2.5 lg:py-0.5 lg:rounded-lg lg:border lg:border-indigo-100">
                  {renderProgress}%
                </span>
              </div>
              <div className="w-full h-1.5 lg:h-2.5 bg-slate-800 lg:bg-slate-100 rounded-full overflow-hidden lg:p-0.5 lg:border lg:border-slate-200">
                <div
                  className="h-full bg-gradient-to-r from-purple-500 to-indigo-600 rounded-full transition-all duration-300"
                  style={{ width: `${Math.max(4, renderProgress)}%` }}
                />
              </div>
              <p className="text-[10px] lg:text-[11px] text-slate-300 lg:text-slate-500 text-center mt-2 truncate">
                {statusMessage}
              </p>
            </div>
          )}

          <div className="h-full max-h-[85%] lg:max-h-[80vh] aspect-[9/16] rounded-2xl lg:rounded-[24px] overflow-hidden bg-black relative flex items-center justify-center shadow-2xl ring-1 ring-white/10 lg:ring-slate-900/10">
            <Player
              key={playerKey}
              ref={playerRef}
              component={SeamlessSwapComposition}
              inputProps={{ photos: uploadedPhotos }}
              durationInFrames={TOTAL_FRAMES}
              fps={fps}
              compositionWidth={1080}
              compositionHeight={1920}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
              controls={false}
              loop
              clickToPlay
              acknowledgeRemotionLicense
            />

            {showInstagramOverlay && (
              <div className="absolute inset-0 pointer-events-none z-30 flex flex-col justify-between p-3 lg:p-4 pt-4 lg:pt-6 pb-4 lg:pb-5 font-sans select-none">
                <div className="w-full flex items-center justify-between text-white/95 drop-shadow-md px-1 lg:px-2">
                  <span className="text-[10px] lg:text-xs font-bold tracking-tight">
                    Reels
                  </span>
                  <Camera className="w-4 h-4 lg:w-5 lg:h-5 text-white stroke-[2.2]" />
                </div>
                <div className="absolute top-10 lg:top-14 left-2 right-2 lg:left-3 lg:right-3 border-b border-dashed border-red-400/40 text-[7px] lg:text-[9px] font-mono text-red-300 text-center pb-0.5 tracking-wider">
                  TOP SAFE ZONE
                </div>
                <div className="w-full flex items-end justify-between pb-2 lg:pb-3 h-full">
                  <div className="flex-1 max-w-[70%] lg:max-w-[76%] text-white drop-shadow-md space-y-1.5 pl-1 mb-2 lg:mb-0">
                    <div className="flex items-center gap-1.5 lg:gap-2">
                      <div className="h-6 w-6 lg:h-7 lg:w-7 rounded-full border border-white/60 bg-gradient-to-tr from-amber-500 to-purple-600 p-[1.5px]">
                        <div className="h-full w-full rounded-full bg-slate-900 flex items-center justify-center">
                          <span className="text-[7px] lg:text-[9px] font-bold text-white">
                            RS
                          </span>
                        </div>
                      </div>
                      <span className="text-[11px] lg:text-[11px] font-bold text-white">
                        reelstudio.ai
                      </span>
                    </div>
                    <p className="text-[10px] lg:text-[10px] leading-tight text-white/95 line-clamp-2">
                      Seamless Morph Spatial Transition ✨
                    </p>
                    <div className="flex items-center gap-1 lg:gap-1.5 text-[7px] lg:text-[9px] text-white/90 pt-0.5">
                      <Music className="w-2.5 h-2.5 lg:w-3 lg:h-3 text-white" />
                      <span className="truncate max-w-[150px] lg:max-w-[190px] font-medium">
                        ReelAudio-1 • Transient Synced
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="w-full max-w-[90%] lg:max-w-[80%] flex flex-col gap-2 mt-3 lg:mt-4">
            <div
              className="w-full h-1.5 lg:h-2 bg-white/20 lg:bg-slate-200 rounded-full cursor-pointer relative overflow-hidden"
              onClick={handleSeekVideo}
            >
              <div
                className="h-full bg-indigo-500 rounded-full transition-all duration-75"
                style={{ width: `${(currentFrame / TOTAL_FRAMES) * 100}%` }}
              />
            </div>
            <div className="flex items-center justify-between">
              <button
                onClick={togglePlayPause}
                className="w-8 h-8 lg:w-9 lg:h-9 rounded-full bg-white/10 lg:bg-white hover:bg-white/20 lg:hover:bg-slate-50 flex items-center justify-center text-white lg:text-slate-700 backdrop-blur lg:shadow-sm lg:border lg:border-slate-200 transition-colors cursor-pointer"
              >
                {isPlaying ? (
                  <Pause className="w-4 h-4 fill-white lg:fill-slate-700" />
                ) : (
                  <Play className="w-4 h-4 fill-white lg:fill-slate-700 ml-0.5" />
                )}
              </button>
              <span className="text-[11px] lg:text-xs font-mono font-medium text-slate-300 lg:text-slate-500">
                {formatTime(currentFrame / fps)} /{" "}
                {formatTime(TOTAL_FRAMES / fps)}
              </span>
            </div>
          </div>
        </div>
      </main>

      <aside className="order-2 lg:order-1 h-[52dvh] lg:h-full w-full lg:w-[480px] flex flex-col bg-white shadow-[0_-10px_40px_rgba(0,0,0,0.2)] rounded-t-[2rem] lg:rounded-none relative z-20 overflow-hidden">
        <div className="flex-1 overflow-y-auto w-full pb-24 lg:pb-32 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <div className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b border-slate-100 pt-3 pb-4 px-4 lg:px-6 space-y-4">
            <div className="w-full flex justify-center pb-2 lg:hidden">
              <div className="w-12 h-1 bg-slate-200 rounded-full" />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Link
                  href="/templates"
                  className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-900 bg-slate-50 transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                </Link>
                <h1 className="text-base lg:text-xl font-black tracking-tight text-slate-950">
                  Seamless Morph
                </h1>
              </div>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 lg:mx-0 lg:px-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
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
                className="flex-shrink-0 flex items-center gap-1.5 rounded-full border border-purple-200 bg-purple-50 py-1.5 px-3.5 text-[11px] font-bold text-purple-700 hover:bg-purple-100 cursor-pointer whitespace-nowrap"
              >
                <UploadCloud className="w-3.5 h-3.5" /> Add Photos
              </button>
              <div className="flex-shrink-0 flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 py-1.5 px-3.5 text-[11px] font-bold text-slate-700 whitespace-nowrap">
                <Music className="w-3.5 h-3.5 text-purple-600" /> ReelAudio-1
              </div>
              <button
                onClick={() => setShowInstagramOverlay(!showInstagramOverlay)}
                className={`flex-shrink-0 flex items-center gap-1.5 rounded-full border py-1.5 px-3.5 text-[11px] font-bold whitespace-nowrap cursor-pointer ${showInstagramOverlay ? "border-pink-300 bg-pink-500 text-white" : "border-slate-200 bg-slate-50 text-slate-700"}`}
              >
                {showInstagramOverlay ? (
                  <EyeOff className="w-3.5 h-3.5" />
                ) : (
                  <Eye className="w-3.5 h-3.5 text-pink-500" />
                )}{" "}
                IG UI
              </button>
              <div className="flex-shrink-0 relative">
                <select
                  value={resolution}
                  onChange={(e) => setResolution(e.target.value as any)}
                  className="appearance-none rounded-full border border-slate-200 bg-slate-50 px-3.5 py-1.5 text-[11px] font-bold text-slate-700 outline-none focus:ring-2 focus:ring-purple-500/20 cursor-pointer pr-7"
                >
                  <option value="1080p">1080p</option>
                  <option value="2k">2K</option>
                  <option value="4k">4K</option>
                </select>
                <Settings2 className="w-3 h-3 text-slate-400 absolute right-2.5 top-2 pointer-events-none" />
              </div>
            </div>
          </div>

          <div className="px-4 lg:px-6 pt-4 space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 space-y-2.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                <Layers className="w-3.5 h-3.5 text-purple-600" /> Pattern
              </div>
              <p className="text-[11px] text-slate-600">
                34 Beat Transients Synced at 132 BPM.
              </p>
              <p className="text-[10px] text-purple-700 font-bold">
                Only 9:16 vertical photos allowed. Maximum 34 photos.
              </p>
            </div>
            <div className="grid grid-cols-3 lg:grid-cols-4 gap-2">
              {uploadedPhotos.map((url, idx) => (
                <div
                  key={idx}
                  className="group relative aspect-[9/14] rounded-xl overflow-hidden border border-slate-200 bg-slate-100 shadow-sm"
                >
                  <img
                    src={url}
                    alt={`Upload ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded text-[8px] font-bold text-white bg-black/60 backdrop-blur">
                    {idx + 1}
                  </span>
                  <button
                    onClick={() => removePhoto(idx)}
                    className="absolute inset-0 bg-black/40 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-5 h-5 text-red-400" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 w-full bg-white/95 backdrop-blur-md border-t border-slate-200 p-3 lg:p-4 shadow-[0_-4px_15px_rgba(0,0,0,0.05)] flex flex-col gap-2 z-30">
          <button
            onClick={handleExport}
            disabled={isExporting || uploadedPhotos.length === 0}
            className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white py-3.5 text-[11px] font-bold shadow-md disabled:opacity-50 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />{" "}
            {isExporting ? "Exporting..." : "Export MP4"}
          </button>
        </div>
      </aside>
    </div>
  );
}
