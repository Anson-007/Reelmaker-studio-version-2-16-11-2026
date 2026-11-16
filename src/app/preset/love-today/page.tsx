"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { Player, PlayerRef } from "@remotion/player";
import {
  LoveTodayComposition,
  getLoveTodayTotalFrames,
  OutroTransitionType,
} from "../../../remotion/LoveTodayComposition";
import {
  OutroProps,
  OutroStyle,
  PRESET_GRADIENTS,
} from "../../../remotion/OutroCard";
import {
  AddOutroGridCard,
  SlotCounterPill,
} from "../../../components/EditorMediaAddons";
import { getTemplateConfig } from "../../../data/templates";

import { TrendingExportModal } from "../../../components/TrendingExportModal";
import Link from "next/link";
import {
  ArrowLeft,
  UploadCloud,
  Download,
  Trash2,
  Music,
  Settings2,
  Play,
  Pause,
  Loader2,
  Eye,
  EyeOff,
  Camera,
  AlertCircle,
  ImageIcon,
  CheckCircle2,
  Sparkles,
} from "lucide-react";

const FALLBACK_PHOTOS = [
  "/w1.jpg",
  "/w2.jpg",
  "/w3.jpg",
  "/w4.jpg",
  "/w5.jpg",
  "/w6.jpg",
  "/w7.jpg",
  "/w8.jpg",
  "/w1.jpg",
];
const DEFAULT_PHOTOS = getTemplateConfig("love-today")?.defaultMedia || FALLBACK_PHOTOS;

const SLOT_BADGES = [
  "1 • 2.0s",
  "2 • 3.0s",
  "3 • 4.0s",
  "4 • 5.0s",
  "5 • 6.0s",
  "6 • 7.0s",
  "7 • 8.0s",
  "8 • 9.0s",
  "9 • 10.0s",
];

async function ensureDataUrl(url: string): Promise<string> {
  if (url.startsWith("data:") || url.startsWith("blob:") || url.startsWith("/"))
    return url;
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

type UIOutroData = Omit<OutroProps, "styleType"> & {
  styleType: OutroStyle | "none";
  customBgColor: string;
  gradientIndex: number;
  transitionType: OutroTransitionType;
  logoAnim: "spring" | "fade" | "drop" | "spin";
  textAnim: "slideUp" | "fade" | "scale";
  animSpeed: number;
  contactTextSize: number;
  socialTextSize: number;
};

export default function LoveTodayPresetPage() {
  const [activeTab, setActiveTab] = useState<"media" | "branding">("media");
  const [uploadedPhotos, setUploadedPhotos] =
    useState<string[]>(DEFAULT_PHOTOS);
  const [isUpdating, setIsUpdating] = useState(false);

  const [outroData, setOutroData] = useState<UIOutroData>({
    styleType: "none",
    logoUrl: null,
    bgUrl: null,
    contactText: "123 Business Road, Suite 100\nHyderabad, TG 500034",
    socialHandle: "@yourbrand",
    customBgColor: "#4f46e5",
    gradientIndex: 0,
    transitionType: "circle",
    logoAnim: "spring",
    textAnim: "slideUp",
    animSpeed: 25,
    contactTextSize: 30,
    socialTextSize: 35,
  });

  const isOutroEnabled = outroData.styleType !== "none";
  const needsBgImage = ["classic", "glass", "split"].includes(
    outroData.styleType,
  );
  const needsColorPicker = outroData.styleType === "custom-color";
  const needsGradientPicker = outroData.styleType === "gradient-preset";

  const [resolution, setResolution] = useState<"1080p" | "2k" | "4k">("1080p");
  const [showExportModal, setShowExportModal] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [renderProgress, setRenderProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const [uploadError, setUploadError] = useState<{
    show: boolean;
    message: string;
  }>({ show: false, message: "" });

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [showInstagramOverlay, setShowInstagramOverlay] = useState(false);

  const playerRef = useRef<PlayerRef>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const bgInputRef = useRef<HTMLInputElement>(null);
  const fps = 30;

  const BASE_DURATION = getLoveTodayTotalFrames(false, "cut");
  const activeTotalFrames = getLoveTodayTotalFrames(
    isOutroEnabled,
    outroData.transitionType,
  );

  const ensureOutroVisible = useCallback(
    (startFrameOffset: number = 75) => {
      setIsUpdating(true);
      setTimeout(() => {
        if (playerRef.current) {
          playerRef.current.pause();
          playerRef.current.seekTo(BASE_DURATION + startFrameOffset);
        }
        setIsUpdating(false);
      }, 150);
    },
    [BASE_DURATION],
  );

  const forcePreviewTransition = useCallback(() => {
    setIsUpdating(true);
    setTimeout(() => {
      if (playerRef.current) {
        playerRef.current.seekTo(BASE_DURATION - 30);
        playerRef.current.play();
      }
      setIsUpdating(false);
    }, 150);
  }, [BASE_DURATION]);

  const handleOpenOutroFromGrid = useCallback(() => {
    setActiveTab("branding");
    if (outroData.styleType === "none") {
      setOutroData((prev) => ({ ...prev, styleType: "classic" }));
    }
    ensureOutroVisible(40);
  }, [outroData.styleType, ensureOutroVisible]);


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
    const newFrame = Math.round(percentage * activeTotalFrames);
    playerRef.current.seekTo(newFrame);
    setCurrentFrame(newFrame);
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return "0:00";
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const handleOutroImageUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "logo" | "bg",
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setOutroData((prev) => ({
      ...prev,
      [type === "logo" ? "logoUrl" : "bgUrl"]: url,
    }));
    ensureOutroVisible(30);
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
            if (ratio >= 1.2 && ratio <= 2.3) {
              resolve(tempUrl);
            } else {
              reject(
                `"${file.name}" is not vertical. Upload portrait photos only.`,
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
        return combined.slice(0, 9); // Cap at 9 photos for Love Today
      });
    }

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removePhoto = (index: number) => {
    if (uploadedPhotos.length <= 1) return;
    setUploadedPhotos(uploadedPhotos.filter((_, i) => i !== index));
  };

  const handleExport = async (muteAudio: boolean = false) => {
    setShowExportModal(false);
    if (playerRef.current && playerRef.current.isPlaying()) {
      playerRef.current.pause();
    }
    setIsExporting(true);
    setRenderProgress(0);
    setStatusMessage("Preparing local buffers...");
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
        licenseKey: "free-license",
        delayRenderTimeoutInMilliseconds: 60000,
        composition: {
          id: "LoveTodayComposition",
          component: LoveTodayComposition as React.ComponentType<any>,
          durationInFrames: activeTotalFrames,
          fps,
          width: dimensions.width,
          height: dimensions.height,
        },
        inputProps: {
          photos: safePhotos,
          showOutro: isOutroEnabled,
          muteAudio,
          outroData: {
            ...outroData,
            logoUrl: outroData.logoUrl
              ? await ensureDataUrl(outroData.logoUrl)
              : null,
            bgUrl: outroData.bgUrl
              ? await ensureDataUrl(outroData.bgUrl)
              : null,
            styleType:
              outroData.styleType === "none" ? "classic" : outroData.styleType,
          },
        },
        onProgress: ({ progress }) => {
          const percent = Math.round(progress * 100);
          setRenderProgress(percent);
          setStatusMessage(
            `Encoding ${muteAudio ? "silent " : ""}video on GPU (${percent}%)...`,
          );
        },
      });

      const blob = await getBlob();
      const downloadUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = `love-today-${resolution}${muteAudio ? "-no-audio" : ""}.mp4`;
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

  const OUTRO_STYLES: { id: OutroStyle | "none"; label: string }[] = [
    { id: "none", label: "🚫 None" },
    { id: "classic", label: "Classic Dark" },
    { id: "elegant-dark", label: "Elegant Gold" },
    { id: "aesthetic-pastel", label: "Warm Pastel" },
    { id: "modern-corporate", label: "Corporate Grid" },
    { id: "vibrant-gradient", label: "Neon Glow" },
    { id: "glass", label: "Frosted Glass" },
    { id: "minimalist-light", label: "Editorial Light" },
    { id: "split", label: "Split Screen" },
    { id: "bold", label: "Bold Solid" },
    { id: "minimal", label: "Basic Clean" },
    { id: "custom-color", label: "🎨 Custom Color" },
    { id: "gradient-preset", label: "🌈 Gradients" },
  ];

  return (
    <div className="relative flex flex-col lg:flex-row h-[100dvh] w-full overflow-hidden bg-gradient-to-b from-indigo-950 via-slate-900 to-black lg:bg-none lg:bg-[#FDFDFF] font-sans text-slate-800">
      <TrendingExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        onSelectExport={(mute) => handleExport(mute)}
        audioName="Love today.mp3"
      />

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
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm rounded-[24px]">
              <div className="w-[80%] bg-white/95 backdrop-blur-xl border border-amber-100 rounded-2xl p-5 shadow-2xl transition-all">
                <div className="flex items-center justify-between text-xs font-bold text-slate-800 mb-3">
                  <span className="flex items-center gap-2 text-amber-600">
                    <Loader2 className="w-4 h-4 animate-spin" /> Rendering GPU
                    Frame...
                  </span>
                  <span className="font-mono text-amber-700 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-100">
                    {renderProgress}%
                  </span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 via-rose-500 to-purple-600 rounded-full transition-all duration-300"
                    style={{ width: `${Math.max(4, renderProgress)}%` }}
                  />
                </div>
                <p className="text-[11px] text-slate-500 text-center mt-3 truncate">
                  {statusMessage}
                </p>
              </div>
            </div>
          )}

          {isUpdating && !isExporting && (
            <div className="absolute inset-0 z-40 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm rounded-[24px] pointer-events-none transition-opacity duration-150">
              <Loader2 className="w-8 h-8 text-white animate-spin opacity-80" />
            </div>
          )}

          <div className="h-full max-h-[85%] lg:max-h-[80vh] aspect-[9/16] rounded-2xl lg:rounded-[24px] overflow-hidden bg-black relative flex items-center justify-center shadow-2xl ring-1 ring-white/10 lg:ring-slate-900/10">
            <Player
              ref={playerRef}
              component={LoveTodayComposition}
              inputProps={{
                photos: uploadedPhotos,
                showOutro: isOutroEnabled,
                muteAudio: false,
                outroData: {
                  ...outroData,
                  styleType:
                    outroData.styleType === "none"
                      ? "classic"
                      : outroData.styleType,
                },
              }}
              durationInFrames={activeTotalFrames}
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
                      <div className="h-6 w-6 lg:h-7 lg:w-7 rounded-full border border-white/60 bg-gradient-to-tr from-amber-500 to-rose-600 p-[1.5px]">
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
                      Love Today ✨
                    </p>
                    <div className="flex items-center gap-1 lg:gap-1.5 text-[7px] lg:text-[9px] text-white/90 pt-0.5">
                      <Music className="w-2.5 h-2.5 lg:w-3 lg:h-3 text-white" />
                      <span className="truncate max-w-[150px] lg:max-w-[190px] font-medium">
                        Love today.mp3 • Trending Audio
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
                className="h-full bg-amber-500 rounded-full transition-all duration-75"
                style={{
                  width: `${(currentFrame / activeTotalFrames) * 100}%`,
                }}
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
                {formatTime(activeTotalFrames / fps)}
              </span>
            </div>
          </div>
        </div>
      </main>

      <aside className="order-2 lg:order-1 h-[52dvh] lg:h-full w-full lg:w-[480px] flex flex-col bg-white shadow-[0_-10px_40px_rgba(0,0,0,0.2)] rounded-t-[2rem] lg:rounded-none relative z-20 overflow-hidden">
        <div className="sticky top-0 z-20 bg-white/95 backdrop-blur border-b border-slate-100 pt-3 pb-3 px-4 lg:px-6 space-y-4">
          <div className="w-full flex justify-center pb-1 lg:hidden">
            <div className="w-12 h-1 bg-slate-200 rounded-full" />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Link
                href="/trends"
                className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-900 bg-slate-50 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
              </Link>
              <h1 className="text-base lg:text-xl font-black tracking-tight text-slate-950">
                Love Today
              </h1>
            </div>
            <div className="relative">
              <select
                value={resolution}
                onChange={(e) => setResolution(e.target.value as any)}
                className="appearance-none rounded-full border border-slate-200 bg-slate-50 px-3.5 py-1.5 text-[11px] font-bold text-slate-700 outline-none focus:ring-2 focus:ring-amber-500/20 cursor-pointer pr-7"
              >
                <option value="1080p">1080p</option>
                <option value="2k">2K</option>
                <option value="4k">4K</option>
              </select>
              <Settings2 className="w-3 h-3 text-slate-400 absolute right-2.5 top-2 pointer-events-none" />
            </div>
          </div>

          <div className="flex p-1 bg-slate-100 rounded-xl">
            <button
              onClick={() => setActiveTab("media")}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${activeTab === "media" ? "bg-white text-amber-700 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
            >
              Media & Layers (9 Photos)
            </button>
            <button
              onClick={() => setActiveTab("branding")}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${activeTab === "branding" ? "bg-white text-amber-700 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
            >
              Brand Outro
              {isOutroEnabled && (
                <CheckCircle2 className="w-3 h-3 text-emerald-500" />
              )}
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto w-full pb-24 lg:pb-32 px-4 lg:px-6 pt-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {activeTab === "media" && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="flex gap-2 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden">
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
                  className="flex-shrink-0 flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 py-1.5 px-3.5 text-[11px] font-bold text-amber-700 hover:bg-amber-100 cursor-pointer whitespace-nowrap"
                >
                  <UploadCloud className="w-3.5 h-3.5" /> Add 9 Photos
                </button>
                <SlotCounterPill currentCount={uploadedPhotos.length} maxSlots={9} mediaType="photos" />

                <div className="flex-shrink-0 flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 py-1.5 px-3.5 text-[11px] font-bold text-slate-700 whitespace-nowrap">
                  <Music className="w-3.5 h-3.5 text-amber-600" /> Love
                  today.mp3
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
              </div>

              <div className="grid grid-cols-3 gap-2.5">
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
                    <span className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-md text-[9px] font-bold text-amber-300 bg-black/75 backdrop-blur">
                      {SLOT_BADGES[idx] || `#${idx + 1}`}
                    </span>
                    <button
                      onClick={() => removePhoto(idx)}
                      className="absolute inset-0 bg-black/40 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    >
                      <Trash2 className="w-5 h-5 text-red-400" />
                    </button>
                  </div>
                ))}
                <AddOutroGridCard
                  isOutroEnabled={isOutroEnabled}
                  logoUrl={outroData.logoUrl}
                  onOpenOutroTab={handleOpenOutroFromGrid}
                />
              </div>
            </div>
          )}

          {activeTab === "branding" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                  <span>Outro Card Layout</span>
                  {isOutroEnabled && (
                    <span className="text-[9px] text-amber-500 bg-amber-50 px-1.5 rounded">
                      + 5 SEC
                    </span>
                  )}
                </label>
                <div className="flex flex-wrap gap-2">
                  {OUTRO_STYLES.map((style) => {
                    const isSelected = outroData.styleType === style.id;
                    const isNone = style.id === "none";
                    return (
                      <button
                        key={style.id}
                        onClick={() => {
                          setOutroData((prev) => ({
                            ...prev,
                            styleType: style.id,
                          }));
                          if (!isNone) ensureOutroVisible(40);
                        }}
                        className={`flex-grow py-2 px-3 text-[11px] font-bold rounded-xl border transition-all cursor-pointer whitespace-nowrap text-center ${isSelected ? (isNone ? "bg-red-50 text-red-600 border-red-200 shadow-sm" : "bg-amber-600 text-white border-amber-600 shadow-md") : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"}`}
                      >
                        {style.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {isOutroEnabled && (
                <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-300">
                  <div className="p-4 bg-amber-50/50 border border-amber-100 rounded-2xl space-y-4">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-amber-700">
                      <Sparkles className="w-3.5 h-3.5" /> Animation FX
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-bold text-slate-500 uppercase">
                          Reel Transition
                        </label>
                        <select
                          value={outroData.transitionType}
                          onChange={(e) => {
                            setOutroData((prev) => ({
                              ...prev,
                              transitionType: e.target.value as any,
                            }));
                            forcePreviewTransition();
                          }}
                          className="w-full text-[11px] font-bold py-1.5 px-2 rounded-lg border border-slate-200 cursor-pointer"
                        >
                          <option value="cut">Instant Cut</option>
                          <option value="fade">Smooth Fade</option>
                          <option value="circle">Expanding Circle</option>
                          <option value="slice">Diagonal Slice Wipe</option>
                          <option value="slide">Slide Up</option>
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-bold text-slate-500 uppercase">
                          Logo Anim
                        </label>
                        <select
                          value={outroData.logoAnim}
                          onChange={(e) => {
                            setOutroData((prev) => ({
                              ...prev,
                              logoAnim: e.target.value as any,
                            }));
                            ensureOutroVisible();
                          }}
                          className="w-full text-[11px] font-bold py-1.5 px-2 rounded-lg border border-slate-200 cursor-pointer"
                        >
                          <option value="spring">Spring Bounce</option>
                          <option value="drop">Drop In</option>
                          <option value="spin">Spin Reveal</option>
                          <option value="fade">Simple Fade</option>
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-bold text-slate-500 uppercase">
                          Text Anim
                        </label>
                        <select
                          value={outroData.textAnim}
                          onChange={(e) => {
                            setOutroData((prev) => ({
                              ...prev,
                              textAnim: e.target.value as any,
                            }));
                            ensureOutroVisible(60);
                          }}
                          className="w-full text-[11px] font-bold py-1.5 px-2 rounded-lg border border-slate-200 cursor-pointer"
                        >
                          <option value="slideUp">Slide Up Fade</option>
                          <option value="scale">Scale In</option>
                          <option value="fade">Simple Fade</option>
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-bold text-slate-500 uppercase">
                          Anim Speed (Frames)
                        </label>
                        <input
                          type="range"
                          min="15"
                          max="60"
                          value={outroData.animSpeed}
                          onChange={(e) => {
                            setOutroData((prev) => ({
                              ...prev,
                              animSpeed: Number(e.target.value),
                            }));
                            ensureOutroVisible(60);
                          }}
                          className="w-full accent-amber-600 mt-1 cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>

                  <div
                    className={`grid ${needsBgImage || needsColorPicker || needsGradientPicker ? "grid-cols-2" : "grid-cols-1"} gap-3`}
                  >
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        Brand Logo
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        ref={logoInputRef}
                        className="hidden"
                        onChange={(e) => handleOutroImageUpload(e, "logo")}
                      />
                      <div
                        onClick={() => logoInputRef.current?.click()}
                        className="aspect-square w-full rounded-2xl border-2 border-dashed border-slate-300 bg-white hover:border-amber-400 hover:bg-amber-50 transition-colors flex flex-col items-center justify-center gap-1 cursor-pointer overflow-hidden relative p-2"
                      >
                        {outroData.logoUrl ? (
                          <img
                            src={outroData.logoUrl}
                            alt="Logo"
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <>
                            <ImageIcon className="w-5 h-5 text-slate-400" />
                            <span className="text-[9px] font-bold text-slate-500">
                              Upload Logo
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {needsBgImage && (
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                          9:16 Background
                        </label>
                        <input
                          type="file"
                          accept="image/*"
                          ref={bgInputRef}
                          className="hidden"
                          onChange={(e) => handleOutroImageUpload(e, "bg")}
                        />
                        <div
                          onClick={() => bgInputRef.current?.click()}
                          className="aspect-square w-full rounded-2xl border-2 border-dashed border-slate-300 bg-white hover:border-amber-400 hover:bg-amber-50 transition-colors flex flex-col items-center justify-center gap-1 cursor-pointer overflow-hidden relative"
                        >
                          {outroData.bgUrl ? (
                            <img
                              src={outroData.bgUrl}
                              alt="BG"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <>
                              <ImageIcon className="w-5 h-5 text-slate-400" />
                              <span className="text-[9px] font-bold text-slate-500">
                                Upload Image
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    )}

                    {needsColorPicker && (
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                          Background Color
                        </label>
                        <div className="aspect-square w-full rounded-2xl border-2 border-slate-200 bg-white flex flex-col items-center justify-center gap-2 overflow-hidden relative p-4">
                          <input
                            type="color"
                            value={outroData.customBgColor}
                            onChange={(e) => {
                              setOutroData((prev) => ({
                                ...prev,
                                customBgColor: e.target.value,
                              }));
                              ensureOutroVisible();
                            }}
                            className="w-12 h-12 rounded cursor-pointer border-0 p-0 bg-transparent"
                          />
                          <span className="text-[9px] font-bold text-slate-500 uppercase">
                            {outroData.customBgColor}
                          </span>
                        </div>
                      </div>
                    )}

                    {needsGradientPicker && (
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                          Select Gradient
                        </label>
                        <div className="aspect-square w-full rounded-2xl border-2 border-slate-200 bg-white flex flex-wrap content-center justify-center gap-2 overflow-hidden relative p-3">
                          {PRESET_GRADIENTS.map((grad, i) => (
                            <button
                              key={i}
                              onClick={() => {
                                setOutroData((prev) => ({
                                  ...prev,
                                  gradientIndex: i,
                                }));
                                ensureOutroVisible();
                              }}
                              className={`w-8 h-8 rounded-full border-2 transition-transform cursor-pointer ${outroData.gradientIndex === i ? "border-amber-600 scale-110" : "border-transparent scale-100"}`}
                              style={{ background: grad }}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-4 pt-2 border-t border-slate-100">
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                          Contact & Address
                        </label>
                        <span className="text-[9px] font-bold text-amber-500 bg-amber-50 px-1.5 rounded">
                          {outroData.contactTextSize}px
                        </span>
                      </div>
                      <textarea
                        value={outroData.contactText}
                        onChange={(e) => {
                          setOutroData((prev) => ({
                            ...prev,
                            contactText: e.target.value,
                          }));
                          ensureOutroVisible(60);
                        }}
                        rows={2}
                        className="w-full rounded-xl border border-slate-200 px-3.5 py-3 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 bg-slate-50 focus:bg-white transition-all"
                        placeholder="123 Business Road, Suite 100&#10;Hyderabad, TG 500034"
                      />
                      <input
                        type="range"
                        min="15"
                        max="60"
                        value={outroData.contactTextSize}
                        onChange={(e) => {
                          setOutroData((prev) => ({
                            ...prev,
                            contactTextSize: Number(e.target.value),
                          }));
                          ensureOutroVisible(60);
                        }}
                        className="w-full accent-amber-600 cursor-pointer mt-1"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                          Social Handle
                        </label>
                        <span className="text-[9px] font-bold text-amber-500 bg-amber-50 px-1.5 rounded">
                          {outroData.socialTextSize}px
                        </span>
                      </div>
                      <input
                        type="text"
                        value={outroData.socialHandle}
                        onChange={(e) => {
                          setOutroData((prev) => ({
                            ...prev,
                            socialHandle: e.target.value,
                          }));
                          ensureOutroVisible(60);
                        }}
                        className="w-full rounded-xl border border-slate-200 px-3.5 py-3 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 bg-slate-50 focus:bg-white transition-all"
                        placeholder="@yourbrand"
                      />
                      <input
                        type="range"
                        min="15"
                        max="60"
                        value={outroData.socialTextSize}
                        onChange={(e) => {
                          setOutroData((prev) => ({
                            ...prev,
                            socialTextSize: Number(e.target.value),
                          }));
                          ensureOutroVisible(60);
                        }}
                        className="w-full accent-amber-600 cursor-pointer mt-1"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="absolute bottom-0 left-0 w-full bg-white/95 backdrop-blur-md border-t border-slate-200 p-3 lg:p-4 shadow-[0_-4px_15px_rgba(0,0,0,0.05)] flex flex-col gap-2 z-30">
          <button
            onClick={() => setShowExportModal(true)}
            disabled={isExporting || uploadedPhotos.length === 0}
            className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-500 via-rose-500 to-purple-600 hover:from-amber-400 hover:to-purple-500 text-white py-3.5 text-[11px] font-bold shadow-md disabled:opacity-50 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />{" "}
            {isExporting ? "Exporting..." : "Export MP4"}
          </button>
        </div>
      </aside>
    </div>
  );
}
