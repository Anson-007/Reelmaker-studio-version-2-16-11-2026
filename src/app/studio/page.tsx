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
} from "lucide-react";
import Link from "next/link";

// ==========================================
// 10 CURATED MOTION COMBOS
// ==========================================
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

export default function StudioPage() {
  const [slides, setSlides] = useState<ReelSlide[]>(DEFAULT_SLIDES);
  const [previewSlides, setPreviewSlides] =
    useState<ReelSlide[]>(DEFAULT_SLIDES);

  // EDITING MODE: "combo" (1-click preset applied to all) vs "custom" (per-shot tweaking)
  const [motionMode, setMotionMode] = useState<"combo" | "custom">("combo");
  const [activeGlobalComboId, setActiveGlobalComboId] =
    useState<string>("whip-jib-reveal");

  // Instagram Safe Zone Overlay Toggle
  const [showInstagramOverlay, setShowInstagramOverlay] =
    useState<boolean>(false);

  // Online Audio State & Infinite Scrolling
  const [onlineTracks, setOnlineTracks] = useState<AudioTrack[]>([]);
  const [isLoadingMusic, setIsLoadingMusic] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeGenre, setActiveGenre] = useState("all");

  // Selection & Player State (DEFAULT: NO AUDIO)
  const [selectedAudio, setSelectedAudio] = useState<AudioTrack | null>(null);
  const [previewAudio, setPreviewAudio] = useState<AudioTrack | null>(null);
  const [audioVolume, setAudioVolume] = useState<number>(0.8);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isAudioDrawerOpen, setIsAudioDrawerOpen] = useState<boolean>(false);
  const [previewingAudioId, setPreviewingAudioId] = useState<string | null>(
    null,
  );

  // Real-time Audio Scrubber State
  const [audioCurrentTime, setAudioCurrentTime] = useState<number>(0);
  const [audioDuration, setAudioDuration] = useState<number>(0);

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
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const fps = 30;
  const totalFrames = Math.max(
    1,
    previewSlides.reduce(
      (acc, s) => acc + Math.round(s.durationInSeconds * fps),
      0,
    ),
  );

  // =========================================================================
  // INTERACTIVE WATER-TEXTURE MOUSE TRAIL
  // =========================================================================
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    interface TrailPoint {
      x: number;
      y: number;
      radius: number;
      alpha: number;
      color: string;
      vx: number;
      vy: number;
    }

    const points: TrailPoint[] = [];
    const colors = [
      "rgba(217, 70, 239, ",
      "rgba(99, 102, 241, ",
      "rgba(14, 165, 233, ",
      "rgba(245, 158, 11, ",
    ];

    let lastX = 0;
    let lastY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      const speed = Math.sqrt(dx * dx + dy * dy);

      const count = Math.min(4, Math.max(1, Math.floor(speed / 8)));
      for (let i = 0; i < count; i++) {
        points.push({
          x: e.clientX + (Math.random() - 0.5) * 20,
          y: e.clientY + (Math.random() - 0.5) * 20,
          radius: Math.random() * 55 + 40,
          alpha: 0.35,
          color: colors[Math.floor(Math.random() * colors.length)],
          vx: (Math.random() - 0.5) * 0.8,
          vy: (Math.random() - 0.5) * 0.8,
        });
      }

      lastX = e.clientX;
      lastY = e.clientY;
    };

    window.addEventListener("mousemove", handleMouseMove);

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      for (let i = points.length - 1; i >= 0; i--) {
        const p = points[i];
        p.x += p.vx;
        p.y += p.vy;
        p.alpha *= 0.96;
        p.radius *= 1.015;

        if (p.alpha < 0.005) {
          points.splice(i, 1);
          continue;
        }

        const gradient = ctx.createRadialGradient(
          p.x,
          p.y,
          0,
          p.x,
          p.y,
          p.radius,
        );
        gradient.addColorStop(0, `${p.color}${p.alpha})`);
        gradient.addColorStop(0.5, `${p.color}${p.alpha * 0.4})`);
        gradient.addColorStop(1, `${p.color}0)`);

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return "0:00";
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? "0" : ""}${s}`;
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
        // NOTE: We deliberately DO NOT auto-set selectedAudio to data.tracks[0]
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
    setStatusMessage("Initializing render engine...");

    try {
      const res = await fetch("/api/render", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slides: previewSlides,
          resolution,
          audioUrl: isMuted ? null : previewAudio?.url || null,
          audioVolume: isMuted ? 0 : audioVolume,
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

                if (typeof data.progress === "number") {
                  setRenderProgress(data.progress);
                }
                if (data.message) {
                  setStatusMessage(data.message);
                }

                if (data.status === "complete" && data.downloadUrl) {
                  const link = document.createElement("a");
                  link.href = data.downloadUrl;
                  link.download = `reel-${resolution}.mp4`;
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

                if (data.status === "error") {
                  throw new Error(data.message || "Render failed");
                }
              } catch (parseErr: any) {
                if (parseErr.message && parseErr.message !== "Render failed") {
                  // ignore stream chunk boundaries
                } else {
                  throw parseErr;
                }
              }
            }
          }
        }
      }
    } catch (err: any) {
      alert(`Export error: ${err.message}`);
      setStatusMessage(null);
      setIsExporting(false);
      setRenderProgress(0);
    }
  };

  return (
    <div className="relative flex h-screen w-screen overflow-hidden bg-[#FDFDFF] font-sans text-slate-800 selection:bg-indigo-500/20 selection:text-indigo-950">
      {/* BACKGROUND INTERACTIVE WATER-TEXTURE CANVAS */}
      <canvas
        ref={canvasRef}
        className="pointer-events-none fixed inset-0 z-0 opacity-70 mix-blend-multiply"
      />

      {/* LEFT CONTROLS PANEL */}
      <aside className="w-[520px] flex flex-col border-r border-slate-200/80 bg-white/80 backdrop-blur-xl shadow-xl z-10">
        {/* Header */}
        <div className="border-b border-slate-200/60 p-6 bg-white/40">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link
                href="/"
                className="p-1.5 rounded-xl border border-slate-200/90 text-slate-500 hover:text-slate-900 hover:bg-white shadow-sm transition-all"
                title="Back to Home"
              >
                <ArrowLeft className="w-4 h-4" />
              </Link>
              <div>
                <h1 className="text-xl font-black tracking-tight text-slate-950">
                  ReelStudio{" "}
                  <span className="text-indigo-600 font-bold">Pro</span>
                </h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  Dynamic 3D Camera Sweeps & Motion Transitions
                </p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50/90 px-3 py-1 text-xs font-bold text-indigo-700 border border-indigo-100/90 shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              {slides.length} Shots
            </span>
          </div>

          {/* Quick Action Bar */}
          <div className="mt-5 flex flex-wrap gap-2">
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
              className="flex-1 min-w-[120px] flex items-center justify-center gap-1.5 rounded-xl border border-dashed border-indigo-300 bg-indigo-50/60 py-2.5 px-3 text-xs font-bold text-indigo-700 hover:bg-indigo-100/60 transition-all shadow-sm"
            >
              <UploadCloud className="w-4 h-4 text-indigo-600" />
              Upload Photos
            </button>

            {/* AUDIO BUTTON: Select / Change Track */}
            <button
              onClick={() => setIsAudioDrawerOpen(true)}
              className={`flex items-center gap-1.5 rounded-xl border py-2.5 px-3 text-xs font-semibold transition-all shadow-sm ${
                previewAudio && !isMuted
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100/70"
                  : "border-slate-200 bg-white/80 text-slate-700 hover:bg-white"
              }`}
            >
              <Music
                className={`w-3.5 h-3.5 ${
                  previewAudio && !isMuted
                    ? "text-emerald-600"
                    : "text-slate-500"
                }`}
              />
              {previewAudio
                ? isMuted
                  ? "Audio Muted"
                  : "Sound Attached"
                : "Add Music"}
            </button>

            {/* AUDIO TOGGLE (MUTE / UNMUTE) */}
            {previewAudio && (
              <button
                onClick={() => {
                  setIsMuted((prev) => !prev);
                  setPlayerKey((k) => k + 1);
                }}
                className={`p-2.5 rounded-xl border transition-all shadow-sm ${
                  isMuted
                    ? "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100"
                    : "border-slate-200 bg-white/80 text-slate-600 hover:bg-white"
                }`}
                title={isMuted ? "Unmute Audio" : "Mute Audio"}
              >
                {isMuted ? (
                  <VolumeX className="w-3.5 h-3.5" />
                ) : (
                  <Volume2 className="w-3.5 h-3.5" />
                )}
              </button>
            )}

            {/* INSTAGRAM SAFE ZONE TOGGLE */}
            <button
              onClick={() => setShowInstagramOverlay((prev) => !prev)}
              className={`flex items-center gap-1.5 rounded-xl border py-2.5 px-3 text-xs font-semibold transition-all shadow-sm ${
                showInstagramOverlay
                  ? "border-pink-300 bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-pink-200"
                  : "border-slate-200 bg-white/80 text-slate-700 hover:bg-white"
              }`}
              title="Toggle Instagram Reels safe zone overlay"
            >
              {showInstagramOverlay ? (
                <>
                  <EyeOff className="w-3.5 h-3.5" />
                  Hide IG
                </>
              ) : (
                <>
                  <Eye className="w-3.5 h-3.5 text-pink-600" />
                  Instagram UI
                </>
              )}
            </button>

            <select
              value={resolution}
              onChange={(e) => setResolution(e.target.value as any)}
              className="rounded-xl border border-slate-200 bg-white/90 px-3 py-2 text-xs font-bold text-slate-700 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-sm"
            >
              <option value="1080p">1080p (FHD)</option>
              <option value="2k">2K (QHD)</option>
              <option value="4k">4K (Ultra HD)</option>
            </select>
          </div>

          {/* TWO-MODE SELECTOR */}
          <div className="mt-4 p-1.5 bg-slate-100/90 rounded-2xl border border-slate-200/80 flex gap-1">
            <button
              onClick={() => {
                setMotionMode("combo");
                applyGlobalCombo(activeGlobalComboId);
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                motionMode === "combo"
                  ? "bg-white text-indigo-700 shadow-sm shadow-indigo-500/10 border border-slate-200/60"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-indigo-600" />
              1-Click Motion Combo (All Shots)
            </button>

            <button
              onClick={() => setMotionMode("custom")}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                motionMode === "custom"
                  ? "bg-white text-slate-900 shadow-sm border border-slate-200/60"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Sliders className="w-3.5 h-3.5 text-slate-600" />
              Custom Per-Shot Settings
            </button>
          </div>

          {/* GLOBAL COMBO SELECTOR */}
          {motionMode === "combo" && (
            <div className="mt-3 p-3.5 rounded-2xl bg-gradient-to-r from-indigo-50/90 via-violet-50/60 to-pink-50/40 border border-indigo-100 shadow-sm animate-in fade-in">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-indigo-600" /> Active Global
                  Motion Combo
                </span>
                <span className="text-[10px] text-indigo-600 font-semibold bg-white/90 px-2 py-0.5 rounded-md border border-indigo-100">
                  Applies to all {slides.length} shots
                </span>
              </div>
              <select
                value={activeGlobalComboId}
                onChange={(e) => applyGlobalCombo(e.target.value)}
                className="w-full rounded-xl border border-indigo-200 bg-white/95 px-3 py-2 text-xs font-bold text-indigo-950 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
              >
                {MOTION_COMBOS.map((combo) => (
                  <option key={combo.id} value={combo.id}>
                    ⚡ {combo.name} ({combo.description})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Audio Info pill */}
          {previewAudio && (
            <div className="mt-3 flex items-center justify-between rounded-xl bg-slate-50/90 border border-slate-200/80 px-3 py-2 text-xs">
              <div className="flex items-center gap-2 overflow-hidden">
                <span
                  className={`flex h-5 w-5 items-center justify-center rounded-full ${
                    isMuted
                      ? "bg-amber-100 text-amber-700"
                      : "bg-emerald-100 text-emerald-700"
                  }`}
                >
                  {isMuted ? (
                    <VolumeX className="w-3 h-3" />
                  ) : (
                    <Music className="w-3 h-3" />
                  )}
                </span>
                <div className="truncate">
                  <p className="font-bold text-slate-800 truncate">
                    {previewAudio.title} {isMuted && "(Muted)"}
                  </p>
                  <p className="text-[10px] text-slate-400">
                    {previewAudio.artist} • {previewAudio.tag}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 ml-2">
                <button
                  onClick={() => setIsAudioDrawerOpen(true)}
                  className="text-[11px] font-semibold text-indigo-600 hover:underline"
                >
                  Change
                </button>
                <button
                  onClick={() => {
                    setSelectedAudio(null);
                    setPreviewAudio(null);
                    setPlayerKey((k) => k + 1);
                  }}
                  className="p-1 text-slate-400 hover:text-red-500 rounded"
                  title="Remove audio"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Scrollable Shot List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {slides.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-slate-200 rounded-3xl p-6 text-center bg-white/40">
              <UploadCloud className="w-10 h-10 text-slate-300 mb-2" />
              <p className="text-sm font-bold text-slate-700">
                No photos loaded
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Upload 3 to 8 photos to build your reel.
              </p>
            </div>
          ) : (
            slides.map((slide, index) => (
              <div
                key={slide.id}
                className="group relative rounded-2xl border border-slate-200/90 bg-white/90 backdrop-blur-sm p-4 shadow-sm hover:shadow-md hover:border-slate-300 transition-all"
              >
                <div className="flex items-center justify-between mb-3.5">
                  <div className="flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-[11px] font-bold text-slate-700">
                      {index + 1}
                    </span>
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Shot {index + 1}
                    </span>
                  </div>

                  <button
                    onClick={() => removeSlide(slide.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50"
                    title="Remove Shot"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex gap-4">
                  <div className="relative h-28 w-20 flex-shrink-0 overflow-hidden rounded-xl border border-slate-100 bg-slate-100 shadow-inner">
                    <img
                      src={slide.imageUrl}
                      alt={`Shot ${index + 1}`}
                      className="h-full w-full object-cover"
                    />
                  </div>

                  <div className="flex-1 space-y-2.5">
                    {motionMode === "combo" ? (
                      <div className="p-2.5 rounded-xl bg-indigo-50/70 border border-indigo-100/80">
                        <div className="flex items-center gap-1.5 text-[11px] font-bold text-indigo-800">
                          <Zap className="w-3.5 h-3.5 text-indigo-600" />
                          {MOTION_COMBOS.find(
                            (c) => c.id === activeGlobalComboId,
                          )?.name || "Preset Combo Active"}
                        </div>
                        <p className="text-[10px] text-slate-500 mt-0.5">
                          Unified 3D animation applied across all shots.
                        </p>
                      </div>
                    ) : (
                      <>
                        {/* Camera Movement */}
                        <div>
                          <label className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                            <Camera className="w-3 h-3 text-slate-400" /> Camera
                            Drift
                          </label>
                          <select
                            value={slide.cameraMovement}
                            onChange={(e) =>
                              updateSlide(slide.id, {
                                cameraMovement: e.target
                                  .value as CameraMovement,
                              })
                            }
                            className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                          >
                            <optgroup label="3D Depth">
                              <option value="lowAngleJibPush">
                                Low-Angle Jib Push
                              </option>
                              <option value="parallaxDepthPush">
                                Parallax 2.5D Depth Push
                              </option>
                              <option value="vertigoWarp">
                                Vertigo Hitchcock Warp
                              </option>
                              <option value="droneFlyover">
                                Cinematic Drone Flyover
                              </option>
                            </optgroup>
                            <optgroup label="Orbits & Sweeps">
                              <option value="arcSweepReveal">
                                Arc Sweep Reveal
                              </option>
                              <option value="spiralDive">
                                Spiral Push & Dive
                              </option>
                              <option value="sCurvePan">
                                Dynamic S-Curve Ease Pan
                              </option>
                              <option value="craneRise">
                                Cinematic Crane Rise
                              </option>
                            </optgroup>
                            <optgroup label="Organic Drift">
                              <option value="handheldBreathing">
                                Handheld Gimbal Breathing
                              </option>
                              <option value="steadicamGlide">
                                Wobble Steadicam Glide
                              </option>
                              <option value="zeroGFloat">
                                Zero-G Orbital Float
                              </option>
                              <option value="slowZoomIn">
                                Slow Cinematic Zoom In
                              </option>
                            </optgroup>
                          </select>
                        </div>

                        {/* Transition Entrance */}
                        <div>
                          <label className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                            <Sparkles className="w-3 h-3 text-slate-400" />{" "}
                            Transition Into Shot
                          </label>
                          <select
                            value={slide.transition}
                            onChange={(e) =>
                              updateSlide(slide.id, {
                                transition: e.target.value as SlideTransition,
                              })
                            }
                            className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                          >
                            <optgroup label="3D Dimension">
                              <option value="whipZoom">
                                Dynamic Whip Zoom-In
                              </option>
                              <option value="skewSlide">
                                Kinetic Skew Slide
                              </option>
                              <option value="curvedSlider3D">
                                3D Curved Panoramic Slider
                              </option>
                              <option value="carousel3DSpin">
                                3D Spinning Cube Carousel
                              </option>
                              <option value="carousel3D">
                                3D Revolving Tunnel Card
                              </option>
                              <option value="flip3D">
                                Cinematic 3D Card Flip
                              </option>
                              <option value="dropBounce">
                                Gravity Drop & Bounce
                              </option>
                            </optgroup>
                            <optgroup label="Dynamic Zooms">
                              <option value="spiralVortex">
                                Spiral Vortex Dive
                              </option>
                              <option value="spinZoom">
                                Vortex Spin & Punch
                              </option>
                            </optgroup>
                            <optgroup label="Optical & Cuts">
                              <option value="exposureGlow">
                                Exposure Glow Bloom Flash
                              </option>
                              <option value="opticalDissolve">
                                Optical Contrast Film Dissolve
                              </option>
                              <option value="crossFade">
                                Smooth Soft Cross-Fade
                              </option>
                              <option value="none">
                                Direct Cut (No Transition)
                              </option>
                            </optgroup>
                          </select>
                        </div>
                      </>
                    )}

                    {/* Duration Controller */}
                    <div className="flex items-center gap-2 pt-0.5">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span className="text-[11px] font-semibold text-slate-500">
                        Duration:
                      </span>
                      <select
                        value={slide.durationInSeconds}
                        onChange={(e) =>
                          updateSlide(slide.id, {
                            durationInSeconds: Number(e.target.value),
                          })
                        }
                        className="rounded-lg border border-slate-200 bg-white px-2 py-0.5 text-xs font-bold text-slate-700 focus:outline-none"
                      >
                        <option value={3}>3.0s</option>
                        <option value={4}>4.0s (Recommended)</option>
                        <option value={5}>5.0s</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Bottom Actions */}
        <div className="border-t border-slate-200/80 p-5 bg-white/90 backdrop-blur space-y-2.5">
          {hasUnsavedChanges && (
            <div className="flex items-center justify-between rounded-xl bg-amber-50 p-2.5 px-3 border border-amber-200/80 text-xs text-amber-800">
              <span className="flex items-center gap-1.5 font-bold">
                <AlertCircle className="w-4 h-4 text-amber-600" /> Changes made
                to shots
              </span>
              <span className="text-[11px] font-semibold text-amber-700">
                Click Update Preview
              </span>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={handleUpdatePreview}
              className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-3 px-4 text-xs font-bold transition-all shadow-sm ${
                hasUnsavedChanges
                  ? "bg-amber-500 hover:bg-amber-600 text-white ring-2 ring-amber-400/40"
                  : "bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200"
              }`}
            >
              <RotateCw className="w-3.5 h-3.5" />
              Update Preview
            </button>

            <button
              onClick={handleExport}
              disabled={isExporting || previewSlides.length === 0}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white py-3 px-4 text-xs font-bold shadow-md shadow-indigo-600/25 disabled:opacity-50 transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              {isExporting
                ? "Exporting..."
                : `Export ${resolution.toUpperCase()}`}
            </button>
          </div>
        </div>
      </aside>

      {/* CENTER PREVIEW STAGE */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 relative z-10">
        <div className="relative flex flex-col items-center w-full max-w-[460px]">
          {isExporting ? (
            <div className="w-full mb-3 bg-white/95 backdrop-blur-xl border border-indigo-100 rounded-2xl p-4 shadow-xl shadow-indigo-500/5 transition-all">
              <div className="flex items-center justify-between text-xs font-bold text-slate-800 mb-2">
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

              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200/80">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 via-indigo-600 to-violet-600 rounded-full transition-all duration-300 ease-out shadow-sm"
                  style={{ width: `${Math.max(4, renderProgress)}%` }}
                />
              </div>

              <p className="text-[11px] text-slate-500 text-center mt-2 font-medium truncate">
                {statusMessage}
              </p>
            </div>
          ) : (
            <div className="mb-2.5 flex items-center gap-2 rounded-full bg-white/90 backdrop-blur border border-slate-200/80 px-4 py-1 shadow-sm text-xs font-semibold text-slate-600">
              <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
              <span>
                9:16 Reel Stage • {(totalFrames / fps).toFixed(1)}s total
              </span>
            </div>
          )}

          {/* 9:16 SCREEN VIEWPORT */}
          <div className="h-[84vh] aspect-[9/16] rounded-[30px] overflow-hidden bg-black relative flex items-center justify-center shadow-2xl ring-1 ring-slate-900/10">
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
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                  controls
                  loop
                  clickToPlay
                  acknowledgeRemotionLicense
                />

                {/* INSTAGRAM SAFE ZONE OVERLAY LAYER */}
                {showInstagramOverlay && (
                  <div className="absolute inset-0 pointer-events-none z-30 flex flex-col justify-between p-4 pt-6 pb-5 font-sans select-none animate-in fade-in duration-200">
                    <div className="w-full flex items-center justify-between text-white/95 drop-shadow-md px-1">
                      <span className="text-xs font-bold tracking-tight">
                        Reels
                      </span>
                      <Camera className="w-5 h-5 text-white stroke-[2.2]" />
                    </div>

                    <div className="absolute top-14 left-3 right-3 border-b border-dashed border-red-400/40 text-[9px] font-mono text-red-300 text-center pb-0.5 tracking-wider">
                      TOP SAFE ZONE (HEADER CLEARANCE)
                    </div>

                    <div className="w-full flex items-end justify-between pb-3">
                      <div className="flex-1 max-w-[76%] text-white drop-shadow-md space-y-1.5 pl-1">
                        <div className="flex items-center gap-2">
                          <div className="h-7 w-7 rounded-full border border-white/60 bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 p-[1.5px] flex items-center justify-center">
                            <div className="h-full w-full rounded-full bg-slate-900 overflow-hidden flex items-center justify-center">
                              <span className="text-[9px] font-bold text-white">
                                RS
                              </span>
                            </div>
                          </div>
                          <span className="text-[11px] font-bold text-white">
                            reelstudio.ai
                          </span>
                          <span className="text-[9px] font-semibold border border-white/70 px-2 py-0.2 rounded-md backdrop-blur-sm bg-black/20">
                            Follow
                          </span>
                        </div>

                        <p className="text-[10px] leading-tight text-white/95 line-clamp-2">
                          Cinematic 3D Spatial Transitions & Custom Motion in
                          9:16 ✨
                        </p>

                        <div className="flex items-center gap-1.5 text-[9px] text-white/90 pt-0.5">
                          <Music className="w-3 h-3 text-white" />
                          <span className="truncate max-w-[190px] font-medium">
                            {previewAudio && !isMuted
                              ? `${previewAudio.title} • ${previewAudio.artist}`
                              : "No Audio / Studio Silent"}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col items-center gap-3.5 text-white drop-shadow-lg pr-1">
                        <div className="flex flex-col items-center gap-0.5">
                          <Heart className="w-5 h-5 text-white stroke-[2.2]" />
                          <span className="text-[9px] font-semibold text-white tracking-tight">
                            124K
                          </span>
                        </div>
                        <div className="flex flex-col items-center gap-0.5">
                          <MessageCircle className="w-5 h-5 text-white stroke-[2.2] -rotate-90" />
                          <span className="text-[9px] font-semibold text-white tracking-tight">
                            1,842
                          </span>
                        </div>
                        <div className="flex flex-col items-center gap-0.5">
                          <Send className="w-5 h-5 text-white stroke-[2.2]" />
                          <span className="text-[9px] font-semibold text-white tracking-tight">
                            48.2K
                          </span>
                        </div>
                        <Bookmark className="w-4 h-4 text-white stroke-[2.2]" />
                        <MoreHorizontal className="w-4 h-4 text-white stroke-[2.4]" />
                        <div className="pt-0.5">
                          <div className="relative h-7 w-7 rounded-full border-2 border-slate-900 bg-slate-900 flex items-center justify-center shadow-lg ring-1 ring-white/40 animate-spin [animation-duration:5s]">
                            <Disc3 className="w-full h-full text-white/80" />
                            <div className="absolute h-2.5 w-2.5 rounded-full bg-slate-800 border border-white/60" />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="absolute bottom-4 left-3 right-3 border-t border-dashed border-red-400/40 text-[9px] font-mono text-red-300 text-center pt-0.5 tracking-wider">
                      BOTTOM SAFE ZONE (SCRUBBER & CAPTIONS)
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="h-full w-full flex items-center justify-center text-slate-500 text-xs font-medium">
                Upload photos to view reel preview
              </div>
            )}
          </div>
        </div>
      </main>

      {/* RIGHT DRAWER: MUSIC CATALOG */}
      {isAudioDrawerOpen && (
        <aside className="w-[410px] h-full bg-white/95 backdrop-blur-xl border-l border-slate-200/80 shadow-2xl flex flex-col z-30 transition-all animate-in slide-in-from-right duration-300">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                <Flame className="w-4 h-4 text-indigo-600" />
              </span>
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  Online Music Library
                </h2>
                <p className="text-[11px] text-slate-400">
                  Royalty-Free Audio Stream
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                if (audioPreviewRef.current) audioPreviewRef.current.pause();
                setPreviewingAudioId(null);
                setIsAudioDrawerOpen(false);
              }}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="px-5 py-3 bg-slate-50/70 border-b border-slate-100 flex items-center gap-3">
            <Volume2 className="w-4 h-4 text-slate-500" />
            <div className="flex-1">
              <div className="flex justify-between text-[11px] font-semibold text-slate-600 mb-1">
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
                className="w-full accent-indigo-600 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>
          </div>

          <div className="p-4 border-b border-slate-100 space-y-2.5">
            <div className="relative">
              <input
                type="text"
                placeholder="Search tracks, genres, vibes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) =>
                  e.key === "Enter" && fetchTracks(searchQuery, true)
                }
                className="w-full rounded-xl border border-slate-200 bg-white/90 pl-8 pr-16 py-2 text-xs text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-3" />
              <button
                onClick={() => fetchTracks(searchQuery, true)}
                className="absolute right-1.5 top-1.5 rounded-lg bg-indigo-600 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-indigo-700 transition"
              >
                Search
              </button>
            </div>

            <div className="flex gap-1.5 overflow-x-auto pb-0.5 text-[11px] no-scrollbar">
              {[
                { label: "All", query: "" },
                { label: "Phonk", query: "phonk" },
                { label: "Lo-Fi", query: "lofi" },
                { label: "Chill", query: "chill" },
                { label: "Cinematic", query: "cinematic" },
                { label: "Upbeat", query: "upbeat" },
              ].map((chip) => (
                <button
                  key={chip.label}
                  onClick={() => {
                    setActiveGenre(chip.label);
                    setSearchQuery(chip.query);
                    fetchTracks(chip.query, true);
                  }}
                  className={`px-2.5 py-1 rounded-full font-bold transition whitespace-nowrap text-xs ${
                    activeGenre === chip.label
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {chip.label}
                </button>
              ))}
            </div>
          </div>

          <div className="px-4 py-2.5 border-b border-slate-100 bg-slate-50/50">
            <input
              type="file"
              ref={audioFileInputRef}
              accept="audio/*"
              onChange={handleCustomAudioUpload}
              className="hidden"
            />
            <button
              onClick={() => audioFileInputRef.current?.click()}
              className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg border border-dashed border-slate-300 text-xs font-semibold text-slate-600 hover:bg-white transition-colors"
            >
              <UploadCloud className="w-3.5 h-3.5 text-slate-500" />
              Upload local MP3 instead
            </button>
          </div>

          <div
            ref={trackListContainerRef}
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto p-4 space-y-3"
          >
            {isLoadingMusic ? (
              <div className="flex flex-col items-center justify-center h-48 text-slate-400 text-xs gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
                <span>Loading tracks...</span>
              </div>
            ) : onlineTracks.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-slate-400 text-xs">
                <span>No tracks found for "{searchQuery}"</span>
              </div>
            ) : (
              <>
                {onlineTracks.map((track) => {
                  const isSelected = selectedAudio?.id === track.id;
                  const isPreviewing = previewingAudioId === track.id;

                  const progressPercent =
                    isPreviewing && audioDuration > 0
                      ? (audioCurrentTime / audioDuration) * 100
                      : 0;

                  return (
                    <div
                      key={track.id}
                      className={`p-3 rounded-2xl border transition-all flex flex-col gap-2.5 ${
                        isSelected
                          ? "border-indigo-500 bg-indigo-50/40 shadow-sm"
                          : "border-slate-200/80 bg-white/90 hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <button
                          onClick={() => toggleAudioPreview(track)}
                          className={`h-9 w-9 flex-shrink-0 flex items-center justify-center rounded-xl transition-transform active:scale-95 ${
                            isPreviewing
                              ? "bg-indigo-600 text-white shadow-md shadow-indigo-200"
                              : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                          }`}
                        >
                          {isPreviewing ? (
                            <Pause className="w-4 h-4 fill-white" />
                          ) : (
                            <Play className="w-4 h-4 fill-slate-700 ml-0.5" />
                          )}
                        </button>

                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-slate-900 truncate">
                            {track.title}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] text-slate-400 truncate">
                              {track.artist}
                            </span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-slate-100 text-slate-600 font-semibold">
                              {track.tag}
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={() => {
                            setSelectedAudio(track);
                            setPreviewAudio(track);
                            setIsMuted(false);
                            setHasUnsavedChanges(true);
                            setPlayerKey((k) => k + 1);
                          }}
                          className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                            isSelected
                              ? "bg-emerald-600 text-white shadow-sm"
                              : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                          }`}
                        >
                          {isSelected ? (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              Added
                            </>
                          ) : (
                            "Select"
                          )}
                        </button>
                      </div>

                      {isPreviewing && (
                        <div className="pt-1.5 border-t border-slate-100 animate-in fade-in duration-200">
                          <div
                            onClick={handleSeekAudio}
                            className="w-full h-2 bg-slate-100 hover:bg-slate-200 rounded-full cursor-pointer relative overflow-hidden transition-colors"
                          >
                            <div
                              className="h-full bg-indigo-600 rounded-full transition-all duration-150"
                              style={{ width: `${progressPercent}%` }}
                            />
                          </div>

                          <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 mt-1">
                            <span>{formatTime(audioCurrentTime)}</span>
                            <span>{formatTime(audioDuration || 0)}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}

                {isLoadingMore && (
                  <div className="flex items-center justify-center py-3 text-xs text-indigo-600 font-bold gap-1.5">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Loading more tracks...</span>
                  </div>
                )}
                {!hasMore && onlineTracks.length > 0 && (
                  <div className="text-center py-2 text-[11px] text-slate-400 font-medium">
                    End of catalog
                  </div>
                )}
              </>
            )}
          </div>

          <div className="p-4 border-t border-slate-100 bg-slate-50/60">
            <button
              onClick={() => {
                if (audioPreviewRef.current) audioPreviewRef.current.pause();
                setPreviewingAudioId(null);
                setPreviewAudio(selectedAudio ? { ...selectedAudio } : null);
                setIsAudioDrawerOpen(false);
                handleUpdatePreview();
              }}
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm transition-all"
            >
              Apply to Reel & Close
            </button>
          </div>
        </aside>
      )}
    </div>
  );
}
