"use client";

import React, { useState, useRef, useMemo } from "react";
import Link from "next/link";
import { Music, Volume2, VolumeX, Camera, Film, Layers } from "lucide-react";
import {
  ALL_TEMPLATES,
  FEATURED_TEMPLATES,
  TRENDING_TEMPLATES,
  TemplateItem,
} from "../data/templates";

export { ALL_TEMPLATES, FEATURED_TEMPLATES, TRENDING_TEMPLATES };
export type { TemplateItem };

interface TemplateCardProps {
  tpl?: TemplateItem;
  variant?: "trending" | "featured";
  // Legacy props fallback in case any older page passes individual props
  title?: string;
  slug?: string;
  duration?: string;
  thumbnail?: string;
}

export const TemplateCard: React.FC<TemplateCardProps> = ({
  tpl: propTpl,
  variant,
  title: legacyTitle,
  slug: legacySlug,
  duration: legacyDuration,
  thumbnail: legacyThumbnail,
}) => {
  const resolvedTpl: TemplateItem = useMemo(() => {
    if (propTpl) return propTpl;
    const found = ALL_TEMPLATES.find(
      (t) => t.id === legacySlug || t.title === legacyTitle,
    );
    if (found) return found;
    return {
      id: legacySlug || "template",
      title: legacyTitle || "Template",
      subtitle: "Beat-Synced Reel Preset",
      bpm: "110 BPM",
      category: "Trends",
      tag: "Beat Sync",
      duration: legacyDuration || "12.0s",
      cutsCount: 12,
      maxSlots: 10,
      mediaType: "photos",
      requiredMediaLabel: "10 Photos",
      thumbnail: legacyThumbnail || "/a1.png",
      previewSnippet: legacyThumbnail || "/a1.png",
      previewVideo: `/previews/${legacySlug || "template"}.mp4`,
      defaultMedia: [],
      href: `/preset/${legacySlug || "template"}`,
      audioName: "Audio.mp3",
      badgeColor: "from-purple-600 to-indigo-600",
    };
  }, [propTpl, legacySlug, legacyTitle, legacyDuration, legacyThumbnail]);

  const isTrending =
    variant === "trending" ||
    (!variant && TRENDING_TEMPLATES.some((t) => t.id === resolvedTpl.id));

  const prefix = isTrending ? "TT" : "FT";
  const folder = isTrending ? "TT Thumbnails" : "FT Thumbnails";
  const noSpaceTitle = resolvedTpl.title.replace(/\s+/g, "");
  const capitalizedSlug =
    resolvedTpl.id.charAt(0).toUpperCase() + resolvedTpl.id.slice(1);

  // Candidate chains so minor filename differences (spaces vs hyphens vs .jpg) never break
  const imgCandidates = useMemo(
    () =>
      Array.from(
        new Set([
          resolvedTpl.thumbnail,
          `/thumbnails/${prefix}${resolvedTpl.title}.png`,
          `/thumbnails/${prefix}${noSpaceTitle}.png`,
          `/thumbnails/${prefix}${resolvedTpl.title}.jpg`,
          `/thumbnails/${prefix}${noSpaceTitle}.jpg`,
          resolvedTpl.previewSnippet,
        ]),
      ).filter(Boolean),
    [resolvedTpl, prefix, noSpaceTitle],
  );

  const videoCandidates = useMemo(
    () =>
      Array.from(
        new Set([
          resolvedTpl.previewVideo,
          `/previews/${folder}/${prefix}${resolvedTpl.title}.mp4`,
          `/previews/${folder}/${prefix}${capitalizedSlug}.mp4`,
          `/previews/${folder}/${prefix}${noSpaceTitle}.mp4`,
          `/previews/${resolvedTpl.id}.mp4`,
        ]),
      ).filter(Boolean),
    [resolvedTpl, folder, prefix, capitalizedSlug, noSpaceTitle],
  );

  const [imgIdx, setImgIdx] = useState(0);
  const [vidIdx, setVidIdx] = useState(0);
  const [isHovering, setIsHovering] = useState(false);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);

  const videoRef = useRef<HTMLVideoElement>(null);

  const handleMouseEnter = () => {
    setIsHovering(true);
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(() => {});
    }
  };

  const handleMouseLeave = () => {
    setIsHovering(false);
    setIsVideoPlaying(false);
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    if (videoRef.current) {
      videoRef.current.muted = nextMuted;
    }
  };

  const activeImgSrc =
    imgCandidates[Math.min(imgIdx, imgCandidates.length - 1)];
  const activeVidSrc =
    videoCandidates[Math.min(vidIdx, videoCandidates.length - 1)];

  const accentBorderHover = isTrending
    ? "hover:border-rose-400 hover:shadow-rose-500/15"
    : "hover:border-purple-400 hover:shadow-purple-500/15";

  const bpmPillHover = isTrending
    ? "group-hover:bg-rose-600 group-hover:text-white"
    : "group-hover:bg-purple-600 group-hover:text-white";

  const bpmIconColor = isTrending
    ? "text-rose-600 group-hover:text-white"
    : "text-purple-600 group-hover:text-white";

  const cutsLabelColor = isTrending ? "text-rose-300" : "text-purple-300";

  return (
    <Link
      href={resolvedTpl.href}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`group relative flex flex-col rounded-2xl bg-white/90 backdrop-blur-md border border-slate-200/90 shadow-sm hover:shadow-2xl ${accentBorderHover} transition-all duration-300 sm:hover:-translate-y-2 overflow-hidden cursor-pointer`}
    >
      <div className="relative aspect-[9/13.5] w-full overflow-hidden bg-slate-900">
        {/* Static Thumbnail (Stays visible until the video is actively playing so there is zero black flash) */}
        <img
          src={activeImgSrc}
          alt={resolvedTpl.title}
          onError={() => {
            if (imgIdx < imgCandidates.length - 1) {
              setImgIdx((prev) => prev + 1);
            }
          }}
          className={`absolute inset-0 w-full h-full object-cover transition-all duration-500 ease-out z-10 ${
            isHovering && isVideoPlaying
              ? "opacity-0 scale-105"
              : "opacity-100 group-hover:scale-105"
          }`}
        />

        {/* Hover Preview Video */}
        <video
          ref={videoRef}
          src={activeVidSrc}
          muted={isMuted}
          playsInline
          loop
          preload="metadata"
          onPlaying={() => setIsVideoPlaying(true)}
          onError={() => {
            if (vidIdx < videoCandidates.length - 1) {
              setVidIdx((prev) => prev + 1);
            }
          }}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ease-out z-0 ${
            isHovering && isVideoPlaying ? "opacity-100" : "opacity-0"
          }`}
        />

        {/* Top-Left: BPM Pill */}
        <div
          className={`absolute top-2.5 left-2.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/95 backdrop-blur border border-white/50 text-[10px] font-bold text-slate-800 shadow-sm ${bpmPillHover} transition-colors duration-200 z-20`}
        >
          <Music className={`w-3 h-3 ${bpmIconColor}`} />
          {resolvedTpl.bpm}
        </div>

        {/* Top-Right: Duration Badge + Hover Audio Mute/Unmute Toggle */}
        <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 z-20">
          {isHovering && (
            <button
              type="button"
              onClick={toggleMute}
              title={isMuted ? "Unmute preview" : "Mute preview"}
              className="h-6 w-6 rounded-full bg-black/70 hover:bg-black/90 text-white backdrop-blur flex items-center justify-center shadow-md border border-white/20 transition-transform hover:scale-110 cursor-pointer"
            >
              {isMuted ? (
                <VolumeX className="w-3.5 h-3.5 text-white/90" />
              ) : (
                <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
              )}
            </button>
          )}
          <div className="px-2 py-0.5 rounded-md bg-black/60 backdrop-blur text-[10px] font-bold text-white shadow-sm">
            {resolvedTpl.duration}
          </div>
        </div>

        {/* Bottom Overlay: Required Media Badge + Cuts + Title */}
        <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/90 via-black/45 to-transparent flex flex-col justify-end z-20">
          <div className="flex items-center justify-between gap-1 mb-0.5">
            <span
              className={`text-[10px] font-bold ${cutsLabelColor} uppercase tracking-wider`}
            >
              {resolvedTpl.cutsCount} Cuts
            </span>
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-white/15 backdrop-blur-sm text-[9px] font-bold text-white border border-white/15">
              {resolvedTpl.mediaType === "videos" ? (
                <Film className="w-2.5 h-2.5 text-amber-300" />
              ) : resolvedTpl.mediaType === "mixed" ? (
                <Layers className="w-2.5 h-2.5 text-amber-300" />
              ) : (
                <Camera className="w-2.5 h-2.5 text-amber-300" />
              )}
              {resolvedTpl.requiredMediaLabel}
            </span>
          </div>
          <h3 className="text-sm font-bold text-white leading-tight">
            {resolvedTpl.title}
          </h3>
        </div>
      </div>

      {/* Card Footer */}
      <div className="p-3 flex flex-col gap-2.5 flex-1 justify-between bg-white z-20">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg overflow-hidden border border-slate-200 flex-shrink-0 bg-slate-100">
            <img
              src={activeImgSrc}
              alt="Snippet"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-bold text-slate-800 truncate">
              {resolvedTpl.subtitle}
            </p>
            <p className="text-[10px] text-slate-400 font-mono truncate">
              {resolvedTpl.audioName}
            </p>
          </div>
        </div>
        <div
          className={`w-full py-2 rounded-xl bg-gradient-to-r ${resolvedTpl.badgeColor} text-white text-xs font-bold shadow-sm text-center`}
        >
          Use Template
        </div>
      </div>
    </Link>
  );
};
