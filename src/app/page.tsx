"use client";

import React, { useEffect, useRef } from "react";
import Link from "next/link";
import {
  Sparkles,
  Play,
  Zap,
  Layers,
  Music,
  Video,
  CheckCircle2,
  ChevronRight,
  Clock,
  Compass,
  Radio,
  Sliders,
} from "lucide-react";

const PRESET_CARDS = [
  {
    id: "seamless-swap",
    title: "Seamless Morph & Beat Swap",
    category: "Architecture & Interior",
    shots: "8 Rapid Cuts",
    duration: "7.9s",
    tag: "Viral Beat",
    linkUrl: "/preset/seamless-swap",
    previewImage:
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800",
    description:
      "Snappy rhythmic cuts on 132 BPM transients with seamless room morph optical illusions.",
    isComingSoon: false,
  },
  {
    id: "groove-swap",
    title: "110 BPM Groove Swap",
    category: "Architecture & Interior",
    shots: "7 Downbeats",
    duration: "7.6s",
    tag: "Slap Bass Groove",
    linkUrl: "/preset/groove-swap",
    previewImage:
      "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=800",
    description:
      "Steady, hypnotic downbeat cuts synchronized to electro-funk slap bass & kick transients.",
    isComingSoon: false,
  },
  {
    id: "coming-soon",
    title: "More Presets Coming Soon",
    category: "In Motion Lab",
    shots: "New Drops",
    duration: "Weekly",
    tag: "Cooking",
    linkUrl: "#",
    previewImage: "",
    description:
      "Our motion engineers are fine-tuning brand-new 3D ribbon orbits, glitch snaps, and viral reel tempos.",
    isComingSoon: true,
  },
];

export default function HomePage() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // INTERACTIVE WATER-TEXTURE MOUSE TRAIL
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

  return (
    <div className="relative min-h-screen bg-[#FDFDFF] text-slate-900 font-sans selection:bg-indigo-500/20 selection:text-indigo-950 overflow-x-hidden">
      <canvas
        ref={canvasRef}
        className="pointer-events-none fixed inset-0 z-0 opacity-70 mix-blend-multiply"
      />

      {/* TOP NAVIGATION */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/70 border-b border-slate-200/60 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.03)]">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/25">
              <Video className="w-4 h-4 text-white" />
            </div>
            <span className="font-extrabold text-lg tracking-tight text-slate-950">
              Reel
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">
                Studio
              </span>
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-xs font-semibold text-slate-600">
            <a
              href="#templates"
              className="hover:text-indigo-600 transition-colors"
            >
              Presets
            </a>
            <a
              href="#features"
              className="hover:text-indigo-600 transition-colors"
            >
              Features
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/studio"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-950 hover:bg-slate-800 text-white text-xs font-semibold shadow-sm transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-300" />
              Open Studio
            </Link>
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="relative pt-16 pb-24 px-6 overflow-hidden z-10">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[720px] h-[520px] bg-gradient-to-tr from-indigo-300/30 via-violet-200/25 to-pink-200/20 blur-[130px] pointer-events-none rounded-full" />

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/90 border border-slate-200/80 text-indigo-700 text-[11px] font-semibold mb-6 shadow-sm backdrop-blur-md">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-600"></span>
            </span>
            Bespoke Beat-Accurate Motion Architecture
          </div>

          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-slate-950 leading-[1.08] mb-6">
            We make cinematic Reels <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600">
              that stop the scroll
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-600 max-w-xl mx-auto mb-10 font-normal leading-relaxed">
            Turn static room captures into high-converting 9:16 vertical reels
            with granular camera movements, custom transitions, and locked drum
            cuts.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 mb-16">
            <Link
              href="/studio"
              className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-full bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-700 hover:from-indigo-500 hover:to-violet-500 text-white text-xs sm:text-sm font-bold shadow-xl shadow-indigo-600/25 transition-all duration-300 hover:shadow-indigo-500/40 hover:scale-[1.03] active:scale-[0.98]"
            >
              <Sliders className="w-4 h-4 text-indigo-200" />
              Open ReelStudio Editor
            </Link>

            <a
              href="#templates"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full bg-white/90 hover:bg-white text-slate-700 border border-slate-200/90 text-xs sm:text-sm font-semibold transition-all shadow-sm hover:shadow-md hover:border-slate-300"
            >
              <Play className="w-3.5 h-3.5 text-slate-600 fill-slate-600" />
              Explore Presets
            </a>
          </div>

          {/* 9:16 PHONE STAGE */}
          <div className="relative max-w-[340px] sm:max-w-[390px] mx-auto pt-2">
            <div className="absolute -inset-4 bg-gradient-to-b from-indigo-500/20 via-violet-500/10 to-transparent blur-2xl -z-10 rounded-[50px] transform scale-95" />

            <div className="absolute -left-14 sm:-left-20 top-24 z-20 hidden sm:flex items-center gap-3 p-3.5 rounded-2xl bg-white/95 backdrop-blur-md border border-slate-200/90 shadow-[0_10px_30px_-5px_rgba(99,102,241,0.15)] animate-bounce [animation-duration:5s]">
              <div className="h-10 w-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-inner">
                <Layers className="w-5 h-5" />
              </div>
              <div className="text-left">
                <p className="text-xs font-bold text-slate-900 leading-tight">
                  14 Camera Drifts
                </p>
                <p className="text-[10px] text-slate-500">Parallax & Orbits</p>
              </div>
            </div>

            <div className="absolute -right-14 sm:-right-20 bottom-24 z-20 hidden sm:flex items-center gap-3 p-3.5 rounded-2xl bg-white/95 backdrop-blur-md border border-slate-200/90 shadow-[0_10px_30px_-5px_rgba(217,70,239,0.15)] animate-bounce [animation-duration:6s] [animation-delay:1s]">
              <div className="h-10 w-10 rounded-xl bg-pink-50 border border-pink-100 flex items-center justify-center text-pink-600 shadow-inner">
                <Music className="w-5 h-5" />
              </div>
              <div className="text-left">
                <p className="text-xs font-bold text-slate-900 leading-tight">
                  Synced Audio
                </p>
                <p className="text-[10px] text-slate-500">
                  Royalty-Free Tracks
                </p>
              </div>
            </div>

            <div className="group relative aspect-[9/16] w-full rounded-[36px] overflow-hidden bg-slate-950 border-[6px] border-slate-900 shadow-[0_25px_60px_-15px_rgba(15,23,42,0.28)] transition-all duration-500 hover:scale-[1.02] hover:shadow-[0_30px_70px_-10px_rgba(99,102,241,0.3)]">
              <img
                src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1080"
                alt="Reel Preview"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />

              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-black/30 p-5 flex flex-col justify-between text-white pointer-events-none">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="tracking-wide">Reels</span>
                  <Sparkles className="w-4 h-4 text-indigo-400" />
                </div>
                <div className="space-y-1.5 text-left">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    <p className="text-xs font-bold">@reelstudio.ai</p>
                  </div>
                  <p className="text-[11px] text-white/90 leading-tight">
                    Custom camera sweeps, transitions, and timeline control.
                  </p>
                </div>
              </div>

              <Link
                href="/studio"
                className="absolute inset-0 m-auto h-16 w-16 rounded-full bg-white/95 hover:bg-white text-indigo-600 flex items-center justify-center shadow-2xl backdrop-blur transition-all duration-300 hover:scale-110 hover:shadow-indigo-500/50 group/btn pointer-events-auto"
                title="Launch ReelStudio Editor"
              >
                <Play className="w-7 h-7 fill-indigo-600 ml-1 group-hover/btn:scale-110 transition-transform" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURE HIGHLIGHTS */}
      <section
        id="features"
        className="border-y border-slate-200/80 bg-white/80 backdrop-blur-md py-6 px-6 z-10 relative"
      >
        <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-around gap-6 text-slate-700 text-xs font-bold">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-indigo-600" /> 14 Custom
            Camera Drifts
          </span>
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-indigo-600" /> Instant 1080p,
            2K & 4K Output
          </span>
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-indigo-600" /> 3D Carousel &
            Curved Sliders
          </span>
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-indigo-600" /> Instagram Safe
            Zone Native
          </span>
        </div>
      </section>

      {/* PRESETS GALLERY */}
      <section
        id="templates"
        className="py-20 px-6 max-w-6xl mx-auto z-10 relative"
      >
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
            ✦ Curated Motion Library
          </span>
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-950 mt-3 mb-3">
            Hand-Crafted Rhythmic Presets
          </h2>
          <p className="text-xs sm:text-sm text-slate-600">
            Engineered frame-by-frame to specific audio tracks for maximum
            retention and replay value.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-7">
          {PRESET_CARDS.map((tmpl) => {
            if (tmpl.isComingSoon) {
              return (
                <div
                  key={tmpl.id}
                  className="relative rounded-3xl bg-gradient-to-b from-white/90 via-slate-50/70 to-indigo-50/40 border-2 border-dashed border-indigo-200/90 p-7 flex flex-col justify-between overflow-hidden shadow-sm transition-all hover:border-indigo-400 group"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-100/70 text-[10px] font-bold text-indigo-700 tracking-wide uppercase">
                        <Radio className="w-3 h-3 text-indigo-600 animate-pulse" />
                        In Development
                      </span>
                      <span className="text-[10px] font-mono text-slate-400 font-semibold">
                        Weekly Drops
                      </span>
                    </div>

                    <div className="pt-8">
                      <div className="h-12 w-12 rounded-2xl bg-indigo-500/10 border border-indigo-200 flex items-center justify-center text-indigo-600 mb-4 group-hover:scale-110 transition-transform">
                        <Compass className="w-6 h-6 stroke-[2]" />
                      </div>
                      <h3 className="text-lg font-black text-slate-900 tracking-tight">
                        More Cinematic Presets Coming Soon
                      </h3>
                      <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                        Our sound engineers and motion designers are timing
                        brand-new 3D ribbon orbits, glitch snap transitions, and
                        viral Reels tempos.
                      </p>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-slate-200/60 mt-8 flex items-center justify-between">
                    <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" /> Stay tuned
                    </span>
                    <span className="text-xs font-bold text-indigo-600 group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                      Cooking... ⚡
                    </span>
                  </div>
                </div>
              );
            }

            return (
              <div
                key={tmpl.id}
                className="group rounded-3xl bg-white border border-slate-200/90 overflow-hidden shadow-sm hover:shadow-xl hover:border-indigo-300 transition-all duration-300 flex flex-col"
              >
                <div className="relative aspect-[9/13] w-full overflow-hidden bg-slate-900">
                  <img
                    src={tmpl.previewImage}
                    alt={tmpl.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 left-3">
                    <span className="px-2.5 py-1 rounded-full bg-slate-900/75 backdrop-blur-md text-[10px] font-bold text-white border border-white/20">
                      {tmpl.tag}
                    </span>
                  </div>
                  <div className="absolute bottom-3 right-3">
                    <span className="px-2 py-0.5 rounded-md bg-white/90 backdrop-blur text-[10px] font-bold text-slate-900">
                      {tmpl.duration}
                    </span>
                  </div>
                </div>

                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">
                      {tmpl.category}
                    </span>
                    <h3 className="text-base font-bold text-slate-900 mt-1 mb-1.5">
                      {tmpl.title}
                    </h3>
                    <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                      {tmpl.description}
                    </p>
                  </div>

                  <div className="mt-5 pt-3.5 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400 font-medium">
                      {tmpl.shots}
                    </span>
                    <Link
                      href={tmpl.linkUrl}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-50 hover:bg-gradient-to-r hover:from-indigo-600 hover:to-violet-600 text-indigo-700 hover:text-white text-xs font-bold transition-all duration-300 shadow-sm"
                    >
                      Use Preset
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-slate-200/80 bg-white py-12 px-6 text-center text-xs text-slate-500 z-10 relative">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-lg bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white text-xs font-bold shadow-sm">
              RS
            </div>
            <span className="font-bold text-slate-900">ReelStudio</span>
            <span>• Next-Gen Vertical Video Engine</span>
          </div>

          <p>© 2026 IntelEra AI Company. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
