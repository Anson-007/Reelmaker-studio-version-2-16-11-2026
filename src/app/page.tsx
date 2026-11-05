"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Play,
  ArrowRight,
  Sparkles,
  Camera,
  ChevronRight,
  Compass,
  Zap,
  Music,
  Mail,
  Phone,
  MapPin,
  Loader2,
} from "lucide-react";
// CRITICAL FIX: Import from the new data file, not the page file
import { ALL_TEMPLATES, TemplateItem } from "../data/templates";

export default function HomePage() {
  const router = useRouter();
  const [isNavigatingToStudio, setIsNavigatingToStudio] = useState(false);

  const handleGoToStudio = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsNavigatingToStudio(true);
    router.push("/studio");
  };

  // Slice the top 4 templates to feature on the homepage
  const featuredTemplates: TemplateItem[] = ALL_TEMPLATES.slice(0, 4);

  return (
    <div className="min-h-screen bg-[#FDFDFF] text-slate-800 font-sans selection:bg-purple-500/20 selection:text-purple-950">
      {/* 1. TOP ANNOUNCEMENT LINE */}
      <div className="w-full bg-gradient-to-r from-purple-700 via-indigo-700 to-violet-700 text-white text-xs py-2 px-4 text-center font-medium shadow-sm flex items-center justify-center gap-2 flex-wrap">
        <span className="hidden sm:inline-flex bg-white/20 text-white font-bold px-2 py-0.5 rounded-full text-[10px] tracking-wide uppercase">
          GPU In-Browser Engine
        </span>
        <span className="text-[11px] sm:text-xs">
          Instant 9:16 Reels with beat-synced cuts & zero cloud wait time.
        </span>
        <button
          onClick={handleGoToStudio}
          className="font-bold underline underline-offset-2 hover:text-purple-200 transition-colors ml-1 cursor-pointer text-[11px] sm:text-xs"
        >
          Try Free &rarr;
        </button>
      </div>

      {/* 2. MAIN NAVBAR */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 cursor-pointer">
            <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-md shadow-purple-500/20">
              <Play className="w-3.5 h-3.5 fill-white ml-0.5" />
            </div>
            <span className="text-lg sm:text-xl font-black tracking-tight text-slate-900">
              ReelStudio
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600">
            <Link
              href="/templates"
              className="hover:text-purple-600 transition-colors cursor-pointer"
            >
              Templates
            </Link>
            <Link
              href="#how-it-works"
              className="hover:text-purple-600 transition-colors cursor-pointer"
            >
              How it Works
            </Link>
            <button
              onClick={handleGoToStudio}
              className="hover:text-purple-600 transition-colors cursor-pointer font-semibold"
            >
              Custom Studio
            </button>
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <button
              onClick={handleGoToStudio}
              disabled={isNavigatingToStudio}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 hover:bg-purple-600 text-white text-xs font-bold py-2.5 px-4 transition-all duration-200 shadow-sm cursor-pointer disabled:opacity-75"
            >
              {isNavigatingToStudio ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Loading Studio...
                </>
              ) : (
                <>
                  Get Started
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* 3. HERO SECTION */}
      <section className="relative pt-10 pb-4 px-4 sm:px-6 text-center max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-50 border border-purple-200 text-purple-700 text-[11px] sm:text-xs font-bold mb-4 shadow-sm animate-in fade-in">
          <Sparkles className="w-3.5 h-3.5 text-purple-600" />
          <span>Hand-Crafted Rhythmic Presets</span>
        </div>

        <h1 className="text-4xl md:text-6xl font-black tracking-tight text-slate-950 leading-[1.15] md:leading-[1.12]">
          Create{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-500">
            Viral Reels
          </span>{" "}
          in Seconds
        </h1>

        <p className="mt-4 text-sm md:text-base text-slate-500 max-w-2xl mx-auto font-normal px-2">
          Start with hand-crafted templates. Let the engine sync your shots to
          the beat, apply cinematic drift, and render instantly in your browser.
        </p>

        {/* HERO CTA BUTTONS */}
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3 relative z-20 w-full sm:w-auto px-4 sm:px-0">
          <button
            onClick={handleGoToStudio}
            disabled={isNavigatingToStudio}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-violet-600 hover:from-purple-500 hover:to-indigo-500 text-white text-sm font-bold py-3.5 sm:py-3 px-6 shadow-lg shadow-purple-600/25 transition-all hover:scale-[1.02] active:scale-95 cursor-pointer disabled:opacity-75"
          >
            {isNavigatingToStudio ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Opening Studio...
              </>
            ) : (
              <>
                Start Editing Free
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          <Link
            href="/templates"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 hover:border-purple-300 bg-white text-slate-700 text-sm font-bold py-3.5 sm:py-3 px-6 shadow-sm hover:bg-slate-50 transition-all hover:scale-[1.02] cursor-pointer"
          >
            See All Templates
          </Link>
        </div>
      </section>

      {/* 4. TEMPLATES ROW */}
      <section
        id="templates"
        className="pt-8 pb-10 px-4 sm:px-6 max-w-7xl mx-auto"
      >
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
              Featured Templates
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Tap any template to customize photos instantly
            </p>
          </div>

          <Link
            href="/templates"
            className="hidden sm:inline-flex items-center gap-1.5 text-xs font-bold text-purple-600 hover:text-purple-700 transition-colors cursor-pointer"
          >
            View all 15 templates <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {featuredTemplates.map((tpl: TemplateItem) => (
            <Link
              key={tpl.id}
              href={tpl.href}
              className="group relative flex flex-col rounded-2xl bg-white border border-slate-200/90 shadow-sm hover:shadow-2xl hover:shadow-purple-500/15 hover:border-purple-400 transition-all duration-300 sm:hover:-translate-y-2 overflow-hidden cursor-pointer"
            >
              <div className="relative aspect-[9/13.5] w-full overflow-hidden bg-slate-900">
                <img
                  src={tpl.thumbnail}
                  alt={tpl.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                />

                <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur text-[10px] font-bold text-white shadow-sm">
                  9:16
                </div>

                <div className="absolute top-2.5 left-2.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/95 backdrop-blur border border-white/50 text-[10px] font-bold text-slate-800 shadow-sm group-hover:bg-purple-600 group-hover:text-white transition-colors duration-200">
                  <Music className="w-3 h-3 text-purple-600 group-hover:text-white" />
                  {tpl.bpm}
                </div>

                <div className="absolute inset-x-0 bottom-0 p-4 sm:p-3 bg-gradient-to-t from-black/85 via-black/40 to-transparent flex flex-col justify-end">
                  <span className="text-[10px] font-bold text-purple-300 uppercase tracking-wider">
                    {tpl.tag}
                  </span>
                  <h3 className="text-sm font-bold text-white leading-tight">
                    {tpl.title}
                  </h3>
                </div>
              </div>

              <div className="p-4 sm:p-3 flex flex-col gap-2.5 bg-white flex-1 justify-between">
                <div className="flex items-center gap-3 sm:gap-2">
                  <div className="h-8 w-8 sm:h-7 sm:w-7 rounded-lg overflow-hidden border border-slate-200 flex-shrink-0 bg-slate-100">
                    <img
                      src={tpl.previewSnippet}
                      alt="Sample"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs sm:text-[11px] font-bold text-slate-800 truncate">
                      + Add Your Photos
                    </p>
                    <p className="text-[10px] text-slate-400 truncate">
                      {tpl.subtitle}
                    </p>
                  </div>
                </div>

                <div
                  className={`w-full py-2.5 sm:py-2 rounded-xl bg-gradient-to-r ${tpl.badgeColor} text-white text-xs font-bold shadow-md transition-all text-center`}
                >
                  Use Template
                </div>
              </div>
            </Link>
          ))}

          {/* 5th CARD: REDIRECTS TO /TEMPLATES */}
          <Link
            href="/templates"
            className="group relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-purple-200 hover:border-purple-500 bg-purple-50/40 hover:bg-purple-50/80 transition-all duration-300 p-5 text-center shadow-sm hover:shadow-xl sm:hover:-translate-y-2 min-h-[330px] cursor-pointer"
          >
            <div className="h-12 w-12 rounded-2xl bg-white border border-purple-200 flex items-center justify-center text-purple-600 shadow-sm group-hover:scale-110 group-hover:bg-purple-600 group-hover:text-white transition-all duration-300 mb-3">
              <Compass className="w-6 h-6 stroke-[2.2]" />
            </div>

            <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600 mb-1">
              Template Vault
            </span>
            <h3 className="text-base font-black text-slate-900 tracking-tight">
              Explore More...
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-[150px]">
              Discover 15+ viral beat-synced templates & transitions.
            </p>

            <div className="mt-4 inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white border border-purple-200 text-xs font-bold text-purple-700 shadow-sm group-hover:bg-purple-600 group-hover:text-white group-hover:border-purple-600 transition-colors">
              Browse All <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </Link>
        </div>
      </section>

      {/* DIVIDER LINE */}
      <div className="max-w-7xl mx-auto px-6 py-2">
        <hr className="border-t border-slate-200/80" />
      </div>

      {/* 5. VISUAL PIPELINE */}
      <section
        id="how-it-works"
        className="py-8 px-4 sm:px-6 max-w-6xl mx-auto"
      >
        <div className="text-center max-w-xl mx-auto mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-[11px] sm:text-xs font-bold mb-2">
            <Zap className="w-3.5 h-3.5 text-indigo-600" />
            <span>Instant GPU Pipeline</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-black text-slate-950 tracking-tight">
            How ReelStudio Works
          </h2>
          <p className="text-xs md:text-sm text-slate-500 mt-1">
            Drop your media on the left, let the AI route each frame to the
            beat, and get your viral reel.
          </p>
        </div>

        <div className="relative rounded-[2rem] border border-slate-200/90 bg-gradient-to-b from-white via-white/95 to-purple-50/20 p-5 md:p-8 shadow-xl shadow-purple-500/5 overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[480px] h-[220px] bg-purple-500/10 blur-[100px] pointer-events-none rounded-full" />

          <div className="relative z-10 flex flex-col md:flex-row items-center justify-center w-full max-w-4xl mx-auto">
            {/* LEFT IMAGE */}
            <div className="w-[200px] sm:w-[240px] md:w-[270px] flex-shrink-0 z-20 flex justify-center md:justify-end">
              <img
                src="/left_panel.png"
                alt="Upload Media Panel"
                className="w-full h-auto object-contain drop-shadow-md rounded-2xl md:hover:scale-105 transition-transform duration-300"
              />
            </div>

            {/* DESKTOP HORIZONTAL NEON LASER BRIDGE */}
            <div className="hidden md:flex flex-1 w-full min-w-[140px] max-w-[320px] h-[220px] items-center justify-center md:-mx-2 z-10">
              <svg
                viewBox="0 0 200 120"
                preserveAspectRatio="none"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="w-full h-full overflow-visible"
              >
                <defs>
                  <linearGradient
                    id="neonLaser1"
                    x1="0%"
                    y1="0%"
                    x2="100%"
                    y2="0%"
                  >
                    <stop offset="0%" stopColor="#C084FC" />
                    <stop offset="50%" stopColor="#E879F9" />
                    <stop offset="100%" stopColor="#818CF8" />
                  </linearGradient>
                  <linearGradient
                    id="neonLaser2"
                    x1="0%"
                    y1="0%"
                    x2="100%"
                    y2="0%"
                  >
                    <stop offset="0%" stopColor="#818CF8" />
                    <stop offset="50%" stopColor="#F472B6" />
                    <stop offset="100%" stopColor="#A855F7" />
                  </linearGradient>
                  <filter
                    id="neonLaserGlow"
                    x="-20%"
                    y="-20%"
                    width="140%"
                    height="140%"
                  >
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>
                <path
                  d="M 0 35 C 75 35, 125 55, 200 55"
                  stroke="url(#neonLaser1)"
                  strokeWidth="3"
                  strokeLinecap="round"
                  filter="url(#neonLaserGlow)"
                />
                <path
                  d="M 0 60 C 65 60, 115 25, 200 35"
                  stroke="url(#neonLaser2)"
                  strokeWidth="3"
                  strokeLinecap="round"
                  filter="url(#neonLaserGlow)"
                />
                <path
                  d="M 0 85 C 80 85, 120 75, 200 85"
                  stroke="url(#neonLaser1)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  filter="url(#neonLaserGlow)"
                  opacity="0.9"
                />
                <path
                  d="M 0 60 L 95 60"
                  stroke="#C084FC"
                  strokeWidth="2"
                  strokeDasharray="4 5"
                  opacity="0.7"
                />
                <circle
                  cx="95"
                  cy="60"
                  r="4.5"
                  fill="#FFFFFF"
                  stroke="#EC4899"
                  strokeWidth="2.5"
                />
                <circle
                  cx="130"
                  cy="42"
                  r="5"
                  fill="#FFFFFF"
                  stroke="#8B5CF6"
                  strokeWidth="2.5"
                />
                <circle
                  cx="155"
                  cy="72"
                  r="4.5"
                  fill="#FFFFFF"
                  stroke="#D946EF"
                  strokeWidth="2.5"
                />
              </svg>
            </div>

            {/* MOBILE VERTICAL NEON LASER BRIDGE */}
            <div className="flex md:hidden w-full h-[60px] items-center justify-center -my-2 z-10">
              <svg
                viewBox="0 0 100 140"
                preserveAspectRatio="none"
                fill="none"
                className="h-full w-12 overflow-visible"
              >
                <defs>
                  <linearGradient
                    id="neonLaserVert"
                    x1="0%"
                    y1="0%"
                    x2="0%"
                    y2="100%"
                  >
                    <stop offset="0%" stopColor="#C084FC" />
                    <stop offset="50%" stopColor="#F472B6" />
                    <stop offset="100%" stopColor="#818CF8" />
                  </linearGradient>
                  <filter
                    id="neonLaserGlowVert"
                    x="-20%"
                    y="-20%"
                    width="140%"
                    height="140%"
                  >
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>
                <path
                  d="M 50 0 L 50 140"
                  stroke="url(#neonLaserVert)"
                  strokeWidth="3"
                  strokeLinecap="round"
                  filter="url(#neonLaserGlowVert)"
                />
                <circle
                  cx="50"
                  cy="70"
                  r="5"
                  fill="#FFFFFF"
                  stroke="#EC4899"
                  strokeWidth="2.5"
                />
              </svg>
            </div>

            {/* RIGHT IMAGE */}
            <div className="w-[200px] sm:w-[240px] md:w-[270px] flex-shrink-0 z-20 flex justify-center md:justify-start">
              <img
                src="/right_panel.png"
                alt="Rendered Video Panel"
                className="w-full h-auto object-contain drop-shadow-md rounded-2xl md:hover:scale-105 transition-transform duration-300"
              />
            </div>
          </div>
        </div>
      </section>

      {/* DIVIDER LINE */}
      <div className="max-w-7xl mx-auto px-6 py-4">
        <hr className="border-t border-slate-200/80" />
      </div>

      {/* 6. REELSTUDIO PRO WORKSPACE CALLOUT */}
      <section className="py-8 px-4 sm:px-6 max-w-7xl mx-auto">
        <div className="rounded-3xl bg-slate-950 text-white p-6 sm:p-7 md:p-12 relative overflow-hidden shadow-2xl">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-purple-600/30 rounded-full blur-[120px] pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none" />

          <div className="relative z-10 max-w-2xl text-center sm:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-400/30 text-purple-300 text-[11px] sm:text-xs font-bold mb-3">
              <Camera className="w-3.5 h-3.5 text-purple-400" />
              Full Customization Studio
            </div>

            <h2 className="text-2xl md:text-4xl font-black tracking-tight leading-tight">
              Prefer building custom reels from scratch?
            </h2>

            <p className="mt-3 text-slate-400 text-xs md:text-sm leading-relaxed max-w-lg mx-auto sm:mx-0">
              Open the full **ReelStudio Editor** to build 9:16 reels with 10
              custom 3D camera drift moves, 12 spatial transitions, Instagram
              safe-zone overlays, and free music catalog streaming.
            </p>

            <div className="mt-6 flex flex-col sm:flex-row flex-wrap gap-4 items-center relative z-20">
              <button
                onClick={handleGoToStudio}
                disabled={isNavigatingToStudio}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-violet-600 hover:from-purple-500 hover:to-indigo-500 text-white text-sm font-bold py-3.5 sm:py-3 px-6 shadow-lg shadow-purple-600/30 transition-all active:scale-95 cursor-pointer disabled:opacity-75"
              >
                {isNavigatingToStudio ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Loading Editor...
                  </>
                ) : (
                  <>
                    Launch ReelStudio Editor
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <span className="text-[10px] sm:text-[11px] text-slate-400">
                100% Free • No watermarks • In-Browser GPU Export
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 7. CLEAN FOOTER */}
      <footer className="border-t border-slate-200 bg-white mt-10">
        <div className="max-w-7xl mx-auto px-6 py-10 sm:py-12">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
            <div className="space-y-3">
              <div className="flex items-center">
                <img
                  src="/intelera-logo.png"
                  alt="IntelEra AI"
                  className="h-8 sm:h-9 w-auto object-contain"
                />
              </div>
              <p className="text-xs text-slate-500 leading-relaxed font-normal pr-4">
                Turn your photos and clips into viral, beat-matched vertical
                videos in seconds. Built for creators, agencies, and modern
                marketing teams.
              </p>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-3">
                Contact Us
              </h4>
              <ul className="space-y-2.5 text-xs text-slate-600">
                <li className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-purple-600 flex-shrink-0" />
                  <a
                    href="mailto:info@inteleraai.com"
                    className="hover:text-purple-600 transition-colors font-medium truncate"
                  >
                    info@inteleraai.com
                  </a>
                </li>
                <li className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-purple-600 flex-shrink-0" />
                  <a
                    href="tel:+919014068181"
                    className="hover:text-purple-600 transition-colors font-medium"
                  >
                    +91 9014068181
                  </a>
                </li>
                <li className="flex items-start gap-2 text-[11px] leading-relaxed text-slate-500 pr-4">
                  <MapPin className="w-3.5 h-3.5 text-purple-600 flex-shrink-0 mt-0.5" />
                  <span>
                    4th Floor, Door Nos. 1-4A 1-4B, Serilingampally, Nallagandla
                    Rd, Gopanpalle, Hyderabad, Telangana 500046
                  </span>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-3">
                Templates
              </h4>
              <ul className="space-y-2 text-xs text-slate-500 font-medium">
                <li>
                  <Link
                    href="/preset/seamless-swap"
                    className="hover:text-purple-600 transition-colors cursor-pointer"
                  >
                    Seamless Interior Swap
                  </Link>
                </li>
                <li>
                  <Link
                    href="/preset/groove-swap"
                    className="hover:text-purple-600 transition-colors cursor-pointer"
                  >
                    110 BPM Groove Swap
                  </Link>
                </li>
                <li>
                  <Link
                    href="/preset/speed-ramp-drift"
                    className="hover:text-purple-600 transition-colors cursor-pointer"
                  >
                    Speed Ramp Drift
                  </Link>
                </li>
                <li>
                  <Link
                    href="/preset/minimal-cinematic"
                    className="hover:text-purple-600 transition-colors cursor-pointer"
                  >
                    Minimal Cinematic
                  </Link>
                </li>
                <li>
                  <Link
                    href="/templates"
                    className="hover:text-purple-600 transition-colors text-left cursor-pointer"
                  >
                    All Presets Vault
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-3">
                Workspace
              </h4>
              <ul className="space-y-2 text-xs text-slate-500 font-medium">
                <li>
                  <button
                    onClick={handleGoToStudio}
                    className="hover:text-purple-600 transition-colors cursor-pointer text-left font-medium"
                  >
                    ReelStudio Editor
                  </button>
                </li>
                <li>
                  <button
                    onClick={handleGoToStudio}
                    className="hover:text-purple-600 transition-colors cursor-pointer text-left font-medium"
                  >
                    Motion Combos
                  </button>
                </li>
                <li>
                  <button
                    onClick={handleGoToStudio}
                    className="hover:text-purple-600 transition-colors cursor-pointer text-left font-medium"
                  >
                    Instagram Safe-Zone
                  </button>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-10 pt-5 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-3 text-center sm:text-left">
            <p>
              &copy; {new Date().getFullYear()} ReelStudio. Powered by IntelEra
              AI. All rights reserved.
            </p>
            <p>Built for creators & developers.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
