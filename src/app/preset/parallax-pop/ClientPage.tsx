"use client";

import React, { useState, useRef, useEffect } from "react";
import { Player, PlayerRef } from "@remotion/player";
import {
  ParallelParallaxComposition,
  BASE_DURATION,
} from "../../../remotion/ParallelParallaxComposition";
import { removeBackground, Config } from "@imgly/background-removal";
import Link from "next/link";
import {
  ArrowLeft,
  UploadCloud,
  Play,
  Pause,
  Loader2,
  Music,
  Scissors,
  Download,
} from "lucide-react";

type AssetItem = { originalUrl: string; cutoutUrl: string | null };

const DEFAULT_ASSETS: AssetItem[] = [
  { originalUrl: "/w1.jpg", cutoutUrl: null },
  { originalUrl: "/w2.jpg", cutoutUrl: null },
  { originalUrl: "/w3.jpg", cutoutUrl: null },
  { originalUrl: "/w4.jpg", cutoutUrl: null },
  { originalUrl: "/w5.jpg", cutoutUrl: null },
  { originalUrl: "/w6.jpg", cutoutUrl: null },
  { originalUrl: "/w7.jpg", cutoutUrl: null },
];

export default function ClientPage() {
  const [assets, setAssets] = useState<AssetItem[]>(DEFAULT_ASSETS);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressMsg, setProgressMsg] = useState<string>("");
  const [detailMsg, setDetailMsg] = useState<string>("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [isExporting, setIsExporting] = useState(false);

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
    const newFrame = Math.round(percentage * BASE_DURATION);
    playerRef.current.seekTo(newFrame);
    setCurrentFrame(newFrame);
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files).slice(0, 7);
    const newAssets = [...assets];
    setIsProcessing(true);

    for (let i = 0; i < fileArray.length; i++) {
      setProgressMsg(`Processing Photo ${i + 1} of ${fileArray.length}...`);
      const url = URL.createObjectURL(fileArray[i]);

      newAssets[i] = { originalUrl: url, cutoutUrl: null };
      setAssets([...newAssets]);

      try {
        const config: Config = {
          progress: (key, current, total) => {
            const percent = Math.round((current / total) * 100);
            if (key.includes("fetch")) {
              setDetailMsg(`Downloading AI Weights: ${percent}%`);
            } else {
              setDetailMsg(`Extracting AI Subject: ${percent}%`);
            }
          },
        };

        const blob = await removeBackground(url, config);
        const cutoutUrl = URL.createObjectURL(blob);
        newAssets[i] = { originalUrl: url, cutoutUrl };
      } catch (error) {
        console.error("AI processing failed for image", i, error);
      }
      setAssets([...newAssets]);
    }

    setIsProcessing(false);
    setProgressMsg("");
    setDetailMsg("");

    setTimeout(() => {
      playerRef.current?.seekTo(0);
      playerRef.current?.play();
    }, 500);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Convert browser Blob URLs to Base64 so Node.js can read them
  const blobToBase64 = async (url: string | null) => {
    if (!url || url.startsWith("/")) return url;
    const res = await fetch(url);
    const blob = await res.blob();
    return new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });
  };

  const handleExport = async () => {
    setIsExporting(true);
    setProgressMsg("Preparing Assets...");
    setDetailMsg("Converting images for the rendering engine");

    try {
      const base64Assets = await Promise.all(
        assets.map(async (asset) => ({
          originalUrl: await blobToBase64(asset.originalUrl),
          cutoutUrl: await blobToBase64(asset.cutoutUrl),
        })),
      );

      setProgressMsg("Rendering MP4...");
      setDetailMsg("Check your VS Code terminal for detailed progress.");

      const res = await fetch("/api/render", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assets: base64Assets }),
      });

      if (!res.ok) throw new Error("Render failed on server");

      const data = await res.json();

      setProgressMsg("Success!");
      setDetailMsg("Downloading your video...");

      const a = document.createElement("a");
      a.href = data.url;
      a.download = "Parallel_Parallax.mp4";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (error) {
      console.error(error);
      alert(
        "Render failed. Make sure @remotion/bundler and @remotion/renderer are installed.",
      );
    } finally {
      setTimeout(() => setIsExporting(false), 2000);
    }
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return "0:00";
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  return (
    <div className="relative flex flex-col lg:flex-row h-[100dvh] w-full bg-slate-900 font-sans text-slate-100">
      <main className="order-1 lg:order-2 h-[48dvh] lg:h-full w-full flex-1 flex flex-col items-center justify-center p-6 relative z-10">
        <div className="relative flex flex-col items-center justify-center w-full h-full max-w-[460px]">
          {(isProcessing || isExporting) && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm rounded-[24px]">
              <div className="bg-slate-800 border border-purple-500/30 rounded-2xl p-6 shadow-2xl flex flex-col items-center max-w-[80%] text-center">
                <Loader2 className="w-8 h-8 text-purple-400 animate-spin mb-3" />
                <h3 className="text-sm font-bold text-white mb-1">
                  {progressMsg}
                </h3>
                <p className="text-xs text-purple-300 font-mono">{detailMsg}</p>
              </div>
            </div>
          )}

          <div className="h-full max-h-[80vh] aspect-[9/16] rounded-[24px] overflow-hidden bg-black relative shadow-2xl ring-1 ring-white/10">
            <Player
              ref={playerRef}
              component={ParallelParallaxComposition}
              inputProps={{ assets }}
              durationInFrames={BASE_DURATION}
              fps={fps}
              compositionWidth={1080}
              compositionHeight={1920}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
              controls={false}
              loop
            />
          </div>

          <div className="w-full max-w-[90%] flex flex-col gap-3 mt-4">
            <div
              className="w-full h-2 bg-slate-700 rounded-full cursor-pointer relative overflow-hidden"
              onClick={handleSeekVideo}
            >
              <div
                className="h-full bg-purple-500 rounded-full transition-all duration-75"
                style={{ width: `${(currentFrame / BASE_DURATION) * 100}%` }}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={togglePlayPause}
                  className="w-9 h-9 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-white shadow-sm border border-slate-600 transition-colors cursor-pointer"
                >
                  {isPlaying ? (
                    <Pause className="w-4 h-4" />
                  ) : (
                    <Play className="w-4 h-4 ml-0.5" />
                  )}
                </button>
                <span className="text-xs font-mono font-medium text-slate-400">
                  {formatTime(currentFrame / fps)} /{" "}
                  {formatTime(BASE_DURATION / fps)}
                </span>
              </div>

              <button
                onClick={handleExport}
                className="flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 px-3 py-1.5 text-[11px] font-bold text-white shadow-sm transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" /> Export MP4
              </button>
            </div>
          </div>
        </div>
      </main>

      <aside className="order-2 lg:order-1 h-[52dvh] lg:h-full w-full lg:w-[480px] flex flex-col bg-slate-950 border-r border-slate-800 shadow-xl relative z-20 overflow-hidden">
        <div className="sticky top-0 z-10 bg-slate-950/95 backdrop-blur border-b border-slate-800 p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Link
              href="/templates"
              className="p-1.5 rounded-lg border border-slate-800 text-slate-400 hover:text-white bg-slate-900 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <h1 className="text-xl font-black tracking-tight text-white">
              Parallel Parallax
            </h1>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto w-full p-6 space-y-6 [&::-webkit-scrollbar]:hidden">
          <div className="rounded-2xl border border-purple-500/20 bg-purple-500/10 p-4 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-purple-400">
              <Scissors className="w-4 h-4" /> Automated Cutout Engine
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              Upload 7 photos. The AI will isolate the subject of each photo
              automatically to create a multi-layered 3D parallax sequence
              synced to the beat.
            </p>
          </div>

          <div className="flex gap-2 pb-1">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handlePhotoUpload}
              accept="image/*"
              multiple
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex-shrink-0 flex items-center gap-1.5 rounded-full border border-purple-500 bg-purple-600 py-1.5 px-4 text-[11px] font-bold text-white hover:bg-purple-500 transition-colors cursor-pointer"
            >
              <UploadCloud className="w-3.5 h-3.5" /> Upload 7 Photos
            </button>
            <div className="flex-shrink-0 flex items-center gap-1.5 rounded-full border border-slate-700 bg-slate-800 py-1.5 px-4 text-[11px] font-bold text-slate-300">
              <Music className="w-3.5 h-3.5 text-purple-400" />{" "}
              ReelAudio-Parallel
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {assets.map((asset, idx) => (
              <div
                key={idx}
                className="group relative aspect-[9/14] rounded-xl overflow-hidden border border-slate-800 bg-slate-900 shadow-sm"
              >
                <img
                  src={asset.originalUrl}
                  alt={`Slot ${idx + 1}`}
                  className="w-full h-full object-cover opacity-50"
                />
                {asset.cutoutUrl && (
                  <img
                    src={asset.cutoutUrl}
                    alt={`Cutout ${idx + 1}`}
                    className="absolute inset-0 w-full h-full object-cover filter drop-shadow-[0_5px_5px_rgba(0,0,0,0.5)]"
                  />
                )}
                <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded text-[8px] font-bold text-white bg-black/60 backdrop-blur">
                  Clip {idx + 1}
                </span>
                {!asset.cutoutUrl && isProcessing && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                    <Loader2 className="w-4 h-4 text-purple-400 animate-spin" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </aside>
    </div>
  );
}
