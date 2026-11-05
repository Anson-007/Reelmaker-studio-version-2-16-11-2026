"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { Player, PlayerRef } from "@remotion/player";
import { ReelComposition } from "../../remotion/ReelComposition";
import {
  ReelSlide,
  CameraMovement,
  SlideTransition,
  AudioTrack,
  MotionComboPreset,
} from "../../types/reel";
import {
  RotateCw,
  Download,
  UploadCloud,
  Trash2,
  Camera,
  Sparkles,
  Clock,
  AlertCircle,
  Music,
  Play,
  Pause,
  X,
  Volume2,
  VolumeX,
  Check,
  Flame,
  Zap,
  Search,
  Loader2,
  Heart,
  MessageCircle,
  Send,
  Bookmark,
  MoreHorizontal,
  Disc3,
  Eye,
  EyeOff,
  ArrowLeft,
  Sliders,
  Settings2,
} from "lucide-react";
import Link from "next/link";

const MOTION_COMBOS: MotionComboPreset[] = [
  {
    id: "whip-jib-reveal",
    name: "Hyper-Speed Whip & Jib",
    description: "Dynamic Whip Zoom → Low-Angle Jib Push",
    transition: "whipZoom",
    cameraMovement: "lowAngleJibPush",
  },
  {
    id: "kinetic-impact-push",
    name: "Kinetic Impact & Push",
    description: "Kinetic Skew Slide → Parallax 2.5D Push",
    transition: "skewSlide",
    cameraMovement: "parallaxDepthPush",
  },
  {
    id: "spiral-dive",
    name: "Vortex Spiral Dive",
    description: "Spiral Dive In → Vortex Roll & Dive",
    transition: "spiralVortex",
    cameraMovement: "spiralDive",
  },
  {
    id: "exposure-bloom",
    name: "Editorial Flash & Glide",
    description: "Exposure Glow Bloom → Steadicam Glide",
    transition: "exposureGlow",
    cameraMovement: "steadicamGlide",
  },
  {
    id: "optical-drift",
    name: "Optical Film Dissolve",
    description: "Contrast Film Dissolve → Zero-G Orbital Float",
    transition: "opticalDissolve",
    cameraMovement: "zeroGFloat",
  },
  {
    id: "whip-flyover",
    name: "Viral Whip & Flyover",
    description: "Dynamic Whip Zoom → Drone Flyover",
    transition: "whipZoom",
    cameraMovement: "droneFlyover",
  },
  {
    id: "showcase-flip",
    name: "Showcase 3D Flip",
    description: "3D Card Flip → Arc Sweep Reveal",
    transition: "flip3D",
    cameraMovement: "arcSweepReveal",
  },
  {
    id: "gravity-jib",
    name: "Gravity Drop & Jib",
    description: "Gravity Drop & Bounce → Low-Angle Jib Push",
    transition: "dropBounce",
    cameraMovement: "lowAngleJibPush",
  },
  {
    id: "kinetic-skew",
    name: "Kinetic Skew Track",
    description: "Kinetic Skew Slide → Dynamic S-Curve Ease Pan",
    transition: "skewSlide",
    cameraMovement: "sCurvePan",
  },
  {
    id: "cinematic-doc",
    name: "Cinematic Documentary",
    description: "Soft Cross-Fade → Handheld Gimbal Breathing",
    transition: "crossFade",
    cameraMovement: "handheldBreathing",
  },
];

const DEFAULT_SLIDES: ReelSlide[] = [
  {
    id: "1",
    imageUrl:
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200",
    durationInSeconds: 4,
    cameraMovement: "lowAngleJibPush",
    transition: "whipZoom",
  },
  {
    id: "2",
    imageUrl:
      "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=1200",
    durationInSeconds: 4,
    cameraMovement: "lowAngleJibPush",
    transition: "whipZoom",
  },
  {
    id: "3",
    imageUrl:
      "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=1200",
    durationInSeconds: 4,
    cameraMovement: "lowAngleJibPush",
    transition: "whipZoom",
  },
];

async function ensureDataUrl(url: string): Promise<string> {
  if (url.startsWith("data:") || url.startsWith("blob:")) {
    return url;
  }
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

export default function StudioPage() {
  const [slides, setSlides] = useState<ReelSlide[]>(DEFAULT_SLIDES);
  const [previewSlides, setPreviewSlides] =
    useState<ReelSlide[]>(DEFAULT_SLIDES);

  const [motionMode, setMotionMode] = useState<"combo" | "custom">("combo");
  const [activeGlobalComboId, setActiveGlobalComboId] =
    useState<string>("whip-jib-reveal");

  const [showInstagramOverlay, setShowInstagramOverlay] =
    useState<boolean>(false);

  const [onlineTracks, setOnlineTracks] = useState<AudioTrack[]>([]);
  const [isLoadingMusic, setIsLoadingMusic] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeGenre, setActiveGenre] = useState("all");

  const [selectedAudio, setSelectedAudio] = useState<AudioTrack | null>(null);
  const [previewAudio, setPreviewAudio] = useState<AudioTrack | null>(null);
  const [audioVolume, setAudioVolume] = useState<number>(0.8);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isAudioDrawerOpen, setIsAudioDrawerOpen] = useState<boolean>(false);
  const [previewingAudioId, setPreviewingAudioId] = useState<string | null>(
    null,
  );

  const [audioCurrentTime, setAudioCurrentTime] = useState<number>(0);
  const [audioDuration, setAudioDuration] = useState<number>(0);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentFrame, setCurrentFrame] = useState(0);

  const [playerKey, setPlayerKey] = useState<number>(0);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [resolution, setResolution] = useState<"1080p" | "2k" | "4k">("1080p");
  const [isExporting, setIsExporting] = useState(false);
  const [renderProgress, setRenderProgress] = useState<number>(0);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const playerRef = useRef<PlayerRef>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioFileInputRef = useRef<HTMLInputElement>(null);
  const audioPreviewRef = useRef<HTMLAudioElement | null>(null);
  const trackListContainerRef = useRef<HTMLDivElement | null>(null);

  const fps = 30;
  const totalFrames = Math.max(
    1,
    previewSlides.reduce(
      (acc, s) => acc + Math.round(s.durationInSeconds * fps),
      0,
    ),
  );

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return "0:00";
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

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
      if (playerRef.current.isPlaying()) {
        playerRef.current.pause();
      } else {
        playerRef.current.play();
      }
    }
  };

  const handleSeekVideo = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!playerRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, clickX / rect.width));
    const newFrame = Math.round(percentage * totalFrames);
    playerRef.current.seekTo(newFrame);
    setCurrentFrame(newFrame);
  };

  const fetchTracks = async (term = "", reset = true) => {
    if (reset) {
      setIsLoadingMusic(true);
      setHasMore(true);
    }
    try {
      const url = term
        ? `/api/music?q=${encodeURIComponent(term)}&offset=0&limit=15`
        : `/api/music?offset=0&limit=15`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.tracks && Array.isArray(data.tracks)) {
        setOnlineTracks(data.tracks);
        setHasMore(Boolean(data.hasMore));
      }
    } catch (err) {
      console.error("Failed to load tracks", err);
    } finally {
      if (reset) setIsLoadingMusic(false);
    }
  };

  const loadMoreTracks = useCallback(async () => {
    if (isLoadingMore || !hasMore || isLoadingMusic) return;
    setIsLoadingMore(true);
    try {
      const offset = onlineTracks.length;
      const url = searchQuery
        ? `/api/music?q=${encodeURIComponent(searchQuery)}&offset=${offset}&limit=15`
        : `/api/music?offset=${offset}&limit=15`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.tracks && Array.isArray(data.tracks) && data.tracks.length > 0) {
        setOnlineTracks((prev) => {
          const existingIds = new Set(prev.map((t) => t.id));
          const newUnique = data.tracks.filter(
            (t: AudioTrack) => !existingIds.has(t.id),
          );
          return [...prev, ...newUnique];
        });
        setHasMore(Boolean(data.hasMore));
      } else {
        setHasMore(false);
      }
    } catch (err) {
      console.error("Failed to load more tracks", err);
    } finally {
      setIsLoadingMore(false);
    }
  }, [
    isLoadingMore,
    hasMore,
    isLoadingMusic,
    onlineTracks.length,
    searchQuery,
  ]);

  const handleScroll = () => {
    if (!trackListContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } =
      trackListContainerRef.current;
    if (scrollHeight - scrollTop - clientHeight < 120) {
      loadMoreTracks();
    }
  };

  useEffect(() => {
    fetchTracks();
  }, []);

  const applyGlobalCombo = (comboId: string) => {
    setActiveGlobalComboId(comboId);
    const combo = MOTION_COMBOS.find((c) => c.id === comboId);
    if (!combo) return;

    setSlides((prev) =>
      prev.map((s) => ({
        ...s,
        transition: combo.transition,
        cameraMovement: combo.cameraMovement,
      })),
    );
    setHasUnsavedChanges(true);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setStatusMessage("Importing photos...");
    const fileList = Array.from(files);
    const activeCombo =
      MOTION_COMBOS.find((c) => c.id === activeGlobalComboId) ||
      MOTION_COMBOS[0];

    Promise.all(
      fileList.map((file, idx) => {
        return new Promise<ReelSlide>((resolve) => {
          const reader = new FileReader();
          reader.onload = (event) => {
            resolve({
              id: `${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
              imageUrl: event.target?.result as string,
              durationInSeconds: 4,
              cameraMovement: activeCombo.cameraMovement,
              transition: activeCombo.transition,
            });
          };
          reader.readAsDataURL(file);
        });
      }),
    ).then((newSlides) => {
      setSlides(newSlides);
      setPreviewSlides(newSlides);
      setHasUnsavedChanges(false);
      setStatusMessage(null);
      setPlayerKey((k) => k + 1);
    });
  };

  const handleCustomAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const customTrack: AudioTrack = {
        id: `custom-${Date.now()}`,
        title: file.name.replace(/\.[^/.]+$/, ""),
        artist: "Uploaded Audio",
        tag: "Custom Audio",
        duration: "Full",
        url: event.target?.result as string,
      };
      setSelectedAudio(customTrack);
      setPreviewAudio(customTrack);
      setIsMuted(false);
      setPlayerKey((k) => k + 1);
      setHasUnsavedChanges(false);
    };
    reader.readAsDataURL(file);
  };

  const toggleAudioPreview = async (track: AudioTrack) => {
    if (previewingAudioId === track.id) {
      if (audioPreviewRef.current) audioPreviewRef.current.pause();
      setPreviewingAudioId(null);
      setAudioCurrentTime(0);
      return;
    }
    if (audioPreviewRef.current) {
      audioPreviewRef.current.pause();
      audioPreviewRef.current = null;
    }
    const playWithRetry = async (attemptsLeft = 2): Promise<void> => {
      const audio = new Audio();
      audio.preload = "auto";
      audio.crossOrigin = "anonymous";
      audio.src = track.url;
      audio.volume = isMuted ? 0 : audioVolume;
      audioPreviewRef.current = audio;
      audio.ontimeupdate = () => {
        setAudioCurrentTime(audio.currentTime);
        if (!isNaN(audio.duration) && audio.duration > 0) {
          setAudioDuration(audio.duration);
        }
      };
      audio.onloadedmetadata = () => {
        if (!isNaN(audio.duration)) setAudioDuration(audio.duration);
      };
      try {
        setPreviewingAudioId(track.id);
        setAudioCurrentTime(0);
        await audio.play();
        audio.onended = () => {
          setPreviewingAudioId(null);
          setAudioCurrentTime(0);
          audioPreviewRef.current = null;
        };
      } catch (err: any) {
        if (err.name === "AbortError") return;
        if (attemptsLeft > 0) {
          await new Promise((r) => setTimeout(r, 400));
          return playWithRetry(attemptsLeft - 1);
        }
        setPreviewingAudioId(null);
      }
    };
    await playWithRetry();
  };

  const handleSeekAudio = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioPreviewRef.current || !audioDuration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, clickX / rect.width));
    const newTime = percentage * audioDuration;
    audioPreviewRef.current.currentTime = newTime;
    setAudioCurrentTime(newTime);
  };

  const updateSlide = (id: string, updates: Partial<ReelSlide>) => {
    setSlides((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...updates } : s)),
    );
    setHasUnsavedChanges(true);
  };

  const removeSlide = (id: string) => {
    const updated = slides.filter((s) => s.id !== id);
    setSlides(updated);
    setPreviewSlides(updated);
    setHasUnsavedChanges(false);
    setPlayerKey((k) => k + 1);
  };

  const handleUpdatePreview = () => {
    setPreviewSlides([...slides]);
    setPreviewAudio(selectedAudio ? { ...selectedAudio } : null);
    setHasUnsavedChanges(false);
    setPlayerKey((k) => k + 1);
  };

  const handleExport = async () => {
    if (previewSlides.length === 0) return;
    setIsExporting(true);
    setRenderProgress(0);
    setStatusMessage("Preparing local image buffers...");
    const dimensions = {
      "1080p": { width: 1080, height: 1920 },
      "2k": { width: 1440, height: 2560 },
      "4k": { width: 2160, height: 3840 },
    }[resolution];

    try {
      const safeSlides = await Promise.all(
        previewSlides.map(async (slide) => {
          const safeUrl = await ensureDataUrl(slide.imageUrl);
          return { ...slide, imageUrl: safeUrl };
        }),
      );
      setStatusMessage("Initializing browser GPU encoder...");
      const { renderMediaOnWeb } = await import("@remotion/web-renderer");
      const { getBlob } = await renderMediaOnWeb({
        composition: {
          id: "ReelComposition",
          component: ReelComposition as React.ComponentType<any>,
          durationInFrames: totalFrames,
          fps: fps,
          width: dimensions.width,
          height: dimensions.height,
        },
        inputProps: {
          slides: safeSlides,
          audioUrl: isMuted ? undefined : previewAudio?.url,
          audioVolume: isMuted ? 0 : audioVolume,
        },
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
      link.download = `reel-${resolution}.mp4`;
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
      console.error("Web render error:", err);
      alert(`Export error: ${err.message || "Failed to render video"}`);
      setIsExporting(false);
      setRenderProgress(0);
      setStatusMessage(null);
    }
  };

  return (
    <div className="relative flex flex-col lg:flex-row h-[100dvh] w-full overflow-hidden bg-gradient-to-b from-indigo-950 via-slate-900 to-black lg:bg-none lg:bg-[#FDFDFF] font-sans text-slate-800 selection:bg-indigo-500/20 selection:text-indigo-950">
      {/* 1. TOP STAGE: CAPCUT-STYLE CLEAN VIDEO PLAYER */}
      <main className="order-1 lg:order-2 h-[48dvh] lg:h-full w-full flex-1 flex flex-col items-center justify-center pt-2 pb-0 px-2 lg:p-6 relative z-10 lg:bg-slate-100">
        <div className="relative flex flex-col items-center justify-center w-full h-full max-w-[460px]">
          {isExporting ? (
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
                  className="h-full bg-gradient-to-r from-indigo-500 to-pink-500 lg:to-indigo-600 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${Math.max(4, renderProgress)}%` }}
                />
              </div>
              <p className="text-[10px] lg:text-[11px] text-slate-300 lg:text-slate-500 text-center mt-2 truncate">
                {statusMessage}
              </p>
            </div>
          ) : (
            <div className="hidden lg:flex mb-2.5 items-center gap-2 rounded-full bg-white/90 backdrop-blur border border-slate-200/80 px-4 py-1 shadow-sm text-xs font-semibold text-slate-600">
              <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
              <span>
                9:16 Reel Stage • {(totalFrames / fps).toFixed(1)}s total
              </span>
            </div>
          )}

          {/* 9:16 SCREEN VIEWPORT */}
          <div className="h-full max-h-[85%] lg:max-h-[80vh] aspect-[9/16] rounded-2xl lg:rounded-[24px] overflow-hidden bg-black relative flex items-center justify-center shadow-2xl ring-1 ring-white/10 lg:ring-slate-900/10">
            {previewSlides.length > 0 ? (
              <>
                <Player
                  key={playerKey}
                  ref={playerRef}
                  component={ReelComposition}
                  inputProps={{
                    slides: previewSlides,
                    audioUrl: isMuted ? undefined : previewAudio?.url,
                    audioVolume: isMuted ? 0 : audioVolume,
                  }}
                  durationInFrames={totalFrames}
                  fps={fps}
                  compositionWidth={1080}
                  compositionHeight={1920}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  controls={false}
                  loop
                  clickToPlay
                  acknowledgeRemotionLicense
                />

                {/* IG OVERLAY */}
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
                          <span className="text-[7px] lg:text-[9px] font-semibold border border-white/70 px-1.5 lg:px-2 py-[1px] rounded-md bg-black/20 backdrop-blur-sm">
                            Follow
                          </span>
                        </div>
                        <p className="text-[10px] lg:text-[10px] leading-tight text-white/95 line-clamp-2">
                          Cinematic 3D Spatial Transitions & Custom Motion ✨
                        </p>
                        <div className="flex items-center gap-1 lg:gap-1.5 text-[7px] lg:text-[9px] text-white/90 pt-0.5">
                          <Music className="w-2.5 h-2.5 lg:w-3 lg:h-3 text-white" />
                          <span className="truncate max-w-[150px] lg:max-w-[190px] font-medium">
                            {previewAudio && !isMuted
                              ? `${previewAudio.title} • ${previewAudio.artist}`
                              : "No Audio / Studio Silent"}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col items-center gap-2 lg:gap-3.5 text-white drop-shadow-lg pr-1">
                        <div className="flex flex-col items-center gap-0.5">
                          <Heart className="w-4 h-4 lg:w-5 lg:h-5 text-white stroke-[2.2]" />
                          <span className="text-[7px] lg:text-[9px] font-semibold tracking-tight">
                            124K
                          </span>
                        </div>
                        <div className="flex flex-col items-center gap-0.5">
                          <MessageCircle className="w-4 h-4 lg:w-5 lg:h-5 text-white stroke-[2.2] -rotate-90" />
                          <span className="text-[7px] lg:text-[9px] font-semibold tracking-tight">
                            1,842
                          </span>
                        </div>
                        <div className="flex flex-col items-center gap-0.5">
                          <Send className="w-4 h-4 lg:w-5 lg:h-5 text-white stroke-[2.2]" />
                          <span className="text-[7px] lg:text-[9px] font-semibold tracking-tight hidden lg:block">
                            48.2K
                          </span>
                        </div>
                        <Bookmark className="w-3.5 h-3.5 lg:w-4 lg:h-4 text-white stroke-[2.2]" />
                        <MoreHorizontal className="w-3.5 h-3.5 lg:w-4 lg:h-4 text-white stroke-[2.4]" />
                        <div className="pt-0.5 hidden lg:block">
                          <div className="relative h-6 w-6 lg:h-7 lg:w-7 rounded-full border-2 border-slate-900 bg-slate-900 flex items-center justify-center animate-spin [animation-duration:5s] ring-1 ring-white/40 shadow-lg">
                            <Disc3 className="w-full h-full text-white/80" />
                            <div className="absolute h-2.5 w-2.5 rounded-full bg-slate-800 border border-white/60" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="h-full w-full flex items-center justify-center text-slate-500 text-xs font-medium bg-slate-100">
                Upload photos to preview
              </div>
            )}
          </div>

          {/* CUSTOM CLEAN PLAYER TOOLBAR (CapCut Style) */}
          <div className="w-full max-w-[90%] lg:max-w-[80%] flex flex-col gap-2 mt-3 lg:mt-4">
            <div
              className="w-full h-1.5 lg:h-2 bg-white/20 lg:bg-slate-200 rounded-full cursor-pointer relative overflow-hidden"
              onClick={handleSeekVideo}
            >
              <div
                className="h-full bg-indigo-500 rounded-full transition-all duration-75"
                style={{ width: `${(currentFrame / totalFrames) * 100}%` }}
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
                {formatTime(totalFrames / fps)}
              </span>
            </div>
          </div>
        </div>
      </main>

      {/* 2. BOTTOM EDITOR PANEL (Scrollable Bottom Sheet Style) */}
      <aside className="order-2 lg:order-1 h-[52dvh] lg:h-full w-full lg:w-[480px] flex flex-col bg-white shadow-[0_-10px_40px_rgba(0,0,0,0.2)] lg:shadow-xl lg:border-r border-slate-200/80 rounded-t-[2rem] lg:rounded-none relative z-20 overflow-hidden">
        {/* ALL EDITOR CONTENT WRAPPED IN SCROLLABLE AREA */}
        <div className="flex-1 overflow-y-auto w-full pb-24 lg:pb-32 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {/* Sticky Header Section */}
          <div className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b border-slate-100 pt-4 pb-4 px-4 lg:px-6 space-y-4">
            {/* Title Row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Link
                  href="/"
                  className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                </Link>
                <h1 className="text-base lg:text-xl font-black tracking-tight text-slate-950">
                  ReelStudio{" "}
                  <span className="text-indigo-600 font-bold">Pro</span>
                </h1>
              </div>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-[10px] font-bold text-slate-600 border border-slate-200">
                {slides.length} Shots
              </span>
            </div>

            {/* Horizontally Scrollable Tool Pills */}
            <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 lg:mx-0 lg:px-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                multiple
                accept="image/*"
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex-shrink-0 flex items-center gap-1.5 rounded-full border border-indigo-200 bg-indigo-50 py-1.5 px-3.5 text-[11px] font-bold text-indigo-700 hover:bg-indigo-100 shadow-sm cursor-pointer whitespace-nowrap"
              >
                <UploadCloud className="w-3.5 h-3.5" /> Photos
              </button>

              <button
                onClick={() => setIsAudioDrawerOpen(true)}
                className={`flex-shrink-0 flex items-center gap-1.5 rounded-full border py-1.5 px-3.5 text-[11px] font-bold whitespace-nowrap cursor-pointer ${
                  previewAudio && !isMuted
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border-slate-200 bg-slate-50 text-slate-700"
                }`}
              >
                <Music
                  className={`w-3.5 h-3.5 ${previewAudio && !isMuted ? "text-emerald-600" : ""}`}
                />
                {previewAudio ? (isMuted ? "Muted" : "Audio Set") : "Add Music"}
              </button>

              <button
                onClick={() => setShowInstagramOverlay(!showInstagramOverlay)}
                className={`flex-shrink-0 flex items-center gap-1.5 rounded-full border py-1.5 px-3.5 text-[11px] font-bold whitespace-nowrap cursor-pointer ${
                  showInstagramOverlay
                    ? "border-pink-300 bg-pink-500 text-white"
                    : "border-slate-200 bg-slate-50 text-slate-700"
                }`}
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
                  className="appearance-none rounded-full border border-slate-200 bg-slate-50 px-3.5 py-1.5 text-[11px] font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer pr-7"
                >
                  <option value="1080p">1080p</option>
                  <option value="2k">2K</option>
                  <option value="4k">4K</option>
                </select>
                <Settings2 className="w-3 h-3 text-slate-400 absolute right-2.5 top-2 pointer-events-none" />
              </div>
            </div>

            {/* Combo / Custom Switcher */}
            <div className="bg-slate-100 rounded-xl p-1 flex">
              <button
                onClick={() => {
                  setMotionMode("combo");
                  applyGlobalCombo(activeGlobalComboId);
                }}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                  motionMode === "combo"
                    ? "bg-white text-indigo-700 shadow-sm"
                    : "text-slate-500"
                }`}
              >
                <Zap className="w-3 h-3" /> 1-Click Combo
              </button>
              <button
                onClick={() => setMotionMode("custom")}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                  motionMode === "custom"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500"
                }`}
              >
                <Sliders className="w-3 h-3" /> Custom
              </button>
            </div>
          </div>

          <div className="px-4 lg:px-6 pt-4 space-y-4">
            {/* Global Combo Dropdown (Only shows if combo is active) */}
            {motionMode === "combo" && (
              <div className="p-3 rounded-xl bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100">
                <span className="block text-[9px] font-bold text-indigo-700 uppercase tracking-wider mb-1.5">
                  Apply to all shots
                </span>
                <select
                  value={activeGlobalComboId}
                  onChange={(e) => applyGlobalCombo(e.target.value)}
                  className="w-full rounded-lg border border-indigo-200 bg-white px-2.5 py-1.5 text-[11px] font-bold text-indigo-950 focus:outline-none cursor-pointer"
                >
                  {MOTION_COMBOS.map((combo) => (
                    <option key={combo.id} value={combo.id}>
                      ⚡ {combo.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Shots Timeline */}
            <div className="space-y-3">
              {slides.map((slide, index) => (
                <div
                  key={slide.id}
                  className="relative rounded-xl border border-slate-200 bg-white p-3 shadow-sm"
                >
                  <div className="flex items-center justify-between mb-2.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Shot {index + 1}
                    </span>
                    <button
                      onClick={() => removeSlide(slide.id)}
                      className="text-slate-400 hover:text-red-500 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="flex gap-3">
                    <div className="h-24 w-16 flex-shrink-0 rounded-lg overflow-hidden border border-slate-100 bg-slate-100">
                      <img
                        src={slide.imageUrl}
                        alt={`Shot ${index + 1}`}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="flex-1 space-y-2">
                      {motionMode === "custom" ? (
                        <>
                          <select
                            value={slide.cameraMovement}
                            onChange={(e) =>
                              updateSlide(slide.id, {
                                cameraMovement: e.target
                                  .value as CameraMovement,
                              })
                            }
                            className="w-full rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-[10px] font-semibold text-slate-800 cursor-pointer"
                          >
                            <option value="lowAngleJibPush">
                              Low-Angle Jib Push
                            </option>
                            <option value="parallaxDepthPush">
                              Parallax Depth Push
                            </option>
                            <option value="spiralDive">Spiral Dive</option>
                            <option value="handheldBreathing">
                              Handheld Gimbal
                            </option>
                          </select>
                          <select
                            value={slide.transition}
                            onChange={(e) =>
                              updateSlide(slide.id, {
                                transition: e.target.value as SlideTransition,
                              })
                            }
                            className="w-full rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-[10px] font-semibold text-slate-800 cursor-pointer"
                          >
                            <option value="whipZoom">Whip Zoom-In</option>
                            <option value="skewSlide">
                              Kinetic Skew Slide
                            </option>
                            <option value="exposureGlow">Exposure Flash</option>
                          </select>
                        </>
                      ) : (
                        <div className="h-full flex flex-col justify-center text-[10px] text-slate-400 bg-slate-50 rounded-lg p-2 border border-slate-100">
                          Preset active. Switch to Custom to edit.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* STICKY BOTTOM ACTIONS (Export & Update) */}
        <div className="absolute bottom-0 left-0 w-full bg-white/95 backdrop-blur-md border-t border-slate-200 p-3 lg:p-4 shadow-[0_-4px_15px_rgba(0,0,0,0.05)] flex flex-col gap-2 z-30">
          {hasUnsavedChanges && (
            <div className="flex items-center justify-center gap-1.5 text-[10px] font-bold text-amber-600 bg-amber-50 py-1.5 rounded-md">
              <AlertCircle className="w-3.5 h-3.5" /> Unsaved adjustments. Tap
              Update Preview.
            </div>
          )}
          <div className="flex gap-2">
            <button
              onClick={handleUpdatePreview}
              className={`flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-[11px] font-bold transition-all cursor-pointer ${
                hasUnsavedChanges
                  ? "bg-amber-500 hover:bg-amber-600 text-white shadow-md shadow-amber-500/20"
                  : "bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200"
              }`}
            >
              <RotateCw className="w-3.5 h-3.5" /> Update Preview
            </button>
            <button
              onClick={handleExport}
              disabled={isExporting || previewSlides.length === 0}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 text-[11px] font-bold shadow-md shadow-indigo-600/25 disabled:opacity-50 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />{" "}
              {isExporting ? "Exporting..." : "Export MP4"}
            </button>
          </div>
        </div>
      </aside>

      {/* 3. AUDIO CATALOG BOTTOM SHEET / DESKTOP PANEL */}
      {isAudioDrawerOpen && (
        <>
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setIsAudioDrawerOpen(false)}
          />

          <aside className="fixed bottom-0 left-0 w-full h-[85dvh] lg:h-full lg:w-[410px] lg:static bg-white lg:border-l border-slate-200 rounded-t-3xl lg:rounded-none shadow-2xl lg:shadow-none flex flex-col z-50 animate-in slide-in-from-bottom-full lg:slide-in-from-right duration-300">
            <div className="w-full flex justify-center pt-3 pb-1 lg:hidden bg-white rounded-t-3xl shrink-0">
              <div className="w-12 h-1 bg-slate-200 rounded-full" />
            </div>

            <div className="p-4 lg:p-5 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                  <Flame className="w-4 h-4" />
                </span>
                <div>
                  <h2 className="text-[13px] lg:text-sm font-bold text-slate-900">
                    Music Library
                  </h2>
                  <p className="text-[10px] lg:text-[11px] text-slate-400">
                    Royalty-Free Audio Stream
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAudioDrawerOpen(false)}
                className="p-1.5 bg-slate-50 text-slate-400 rounded-full cursor-pointer hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2 lg:gap-3 bg-slate-50/50 shrink-0">
              <Volume2 className="w-3.5 h-3.5 lg:w-4 lg:h-4 text-slate-500" />
              <div className="flex-1">
                <div className="flex justify-between text-[10px] font-semibold text-slate-600 mb-0.5">
                  <span>Volume</span>
                  <span>{Math.round(audioVolume * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={audioVolume}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    setAudioVolume(val);
                    if (audioPreviewRef.current)
                      audioPreviewRef.current.volume = val;
                  }}
                  className="w-full accent-indigo-600 h-1 lg:h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                />
              </div>
            </div>

            <div className="p-4 border-b border-slate-100 space-y-3 shrink-0">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search tracks, genres, vibes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) =>
                    e.key === "Enter" && fetchTracks(searchQuery, true)
                  }
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-8 pr-16 py-2 text-xs text-slate-800 focus:border-indigo-500 focus:outline-none"
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                <button
                  onClick={() => fetchTracks(searchQuery, true)}
                  className="absolute right-1.5 top-1.5 rounded-lg bg-indigo-600 px-2.5 py-1 text-[10px] font-bold text-white cursor-pointer"
                >
                  Search
                </button>
              </div>

              <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                {[
                  { label: "All", query: "" },
                  { label: "Pop", query: "pop" },
                  { label: "Rock", query: "rock" },
                  { label: "Phonk", query: "phonk" },
                  { label: "Lo-Fi", query: "lofi" },
                  { label: "Cinematic", query: "cinematic" },
                ].map((chip) => (
                  <button
                    key={chip.label}
                    onClick={() => {
                      setActiveGenre(chip.label);
                      setSearchQuery(chip.query);
                      fetchTracks(chip.query, true);
                    }}
                    className={`px-3 py-1 rounded-full font-bold whitespace-nowrap text-[10px] lg:text-[11px] cursor-pointer ${
                      activeGenre === chip.label
                        ? "bg-indigo-600 text-white"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-4 border-b border-slate-100 bg-slate-50/50 shrink-0">
              <input
                type="file"
                ref={audioFileInputRef}
                accept="audio/*"
                onChange={handleCustomAudioUpload}
                className="hidden"
              />
              <button
                onClick={() => audioFileInputRef.current?.click()}
                className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg border border-dashed border-slate-300 text-[11px] font-semibold text-slate-600 bg-white cursor-pointer hover:bg-slate-50"
              >
                <UploadCloud className="w-3.5 h-3.5" /> Upload local MP3
              </button>
            </div>

            <div
              ref={trackListContainerRef}
              onScroll={handleScroll}
              className="flex-1 overflow-y-auto p-4 space-y-2.5 pb-24 lg:pb-4 bg-slate-50/30 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
            >
              {onlineTracks.map((track) => {
                const isSelected = selectedAudio?.id === track.id;
                const isPreviewing = previewingAudioId === track.id;
                return (
                  <div
                    key={track.id}
                    className={`p-2.5 rounded-xl border flex flex-col gap-2 ${isSelected ? "border-indigo-500 bg-indigo-50/40" : "border-slate-200 bg-white"}`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <button
                        onClick={() => toggleAudioPreview(track)}
                        className={`h-8 w-8 rounded-lg cursor-pointer ${isPreviewing ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-700"}`}
                      >
                        {isPreviewing ? (
                          <Pause className="w-3.5 h-3.5 m-auto" />
                        ) : (
                          <Play className="w-3.5 h-3.5 m-auto ml-1" />
                        )}
                      </button>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-bold text-slate-900 truncate">
                          {track.title}
                        </p>
                        <p className="text-[9px] text-slate-400 truncate">
                          {track.artist}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedAudio(track);
                          setPreviewAudio(track);
                          setPlayerKey((k) => k + 1);
                        }}
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-bold cursor-pointer ${isSelected ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-700"}`}
                      >
                        {isSelected ? "Added" : "Select"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="absolute bottom-0 left-0 w-full lg:static p-4 border-t border-slate-100 bg-white/95 backdrop-blur shadow-[0_-4px_15px_rgba(0,0,0,0.05)] shrink-0 z-10">
              <button
                onClick={() => {
                  if (audioPreviewRef.current) audioPreviewRef.current.pause();
                  setPreviewingAudioId(null);
                  setIsAudioDrawerOpen(false);
                  handleUpdatePreview();
                }}
                className="w-full py-3 rounded-xl bg-indigo-600 text-white text-[11px] font-bold shadow-md cursor-pointer hover:bg-indigo-700 transition-colors"
              >
                Apply & Close
              </button>
            </div>
          </aside>
        </>
      )}
    </div>
  );
}
