"use client";

import React from "react";
import { Sparkles, Plus, CheckCircle2, Camera, Film } from "lucide-react";

interface SlotCounterPillProps {
  currentCount: number;
  maxSlots: number;
  mediaType?: "photos" | "videos" | "mixed";
}

export const SlotCounterPill: React.FC<SlotCounterPillProps> = ({
  currentCount,
  maxSlots,
  mediaType = "photos",
}) => {
  const isFull = currentCount >= maxSlots;
  const label =
    mediaType === "videos"
      ? "Videos"
      : mediaType === "mixed"
        ? "Clips"
        : "Photos";

  return (
    <div
      className={`flex-shrink-0 inline-flex items-center gap-1.5 rounded-full border py-1.5 px-3 text-[11px] font-bold whitespace-nowrap transition-colors ${
        isFull
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : "border-slate-200 bg-slate-100 text-slate-700"
      }`}
    >
      {mediaType === "videos" ? (
        <Film className="w-3.5 h-3.5 text-amber-600" />
      ) : (
        <Camera className="w-3.5 h-3.5 text-amber-600" />
      )}
      <span>
        {currentCount} / {maxSlots} {label}
      </span>
    </div>
  );
};

interface AddOutroGridCardProps {
  isOutroEnabled: boolean;
  logoUrl?: string | null;
  onOpenOutroTab: () => void;
}

export const AddOutroGridCard: React.FC<AddOutroGridCardProps> = ({
  isOutroEnabled,
  logoUrl,
  onOpenOutroTab,
}) => {
  return (
    <button
      type="button"
      onClick={onOpenOutroTab}
      className={`group relative aspect-[9/14] w-full rounded-xl overflow-hidden border-2 border-dashed transition-all duration-200 flex flex-col items-center justify-center p-2.5 text-center cursor-pointer shadow-sm hover:shadow-md hover:-translate-y-0.5 ${
        isOutroEnabled
          ? "border-emerald-400 bg-gradient-to-b from-emerald-50/90 via-white to-teal-50/80 hover:border-emerald-500"
          : "border-amber-300 bg-gradient-to-b from-amber-50/70 via-white to-rose-50/60 hover:border-amber-500 hover:bg-amber-50/90"
      }`}
    >
      <span
        className={`absolute top-1.5 left-1.5 right-1.5 px-1.5 py-0.5 rounded-md text-[8px] font-extrabold uppercase tracking-wider truncate ${
          isOutroEnabled
            ? "bg-emerald-600 text-white"
            : "bg-amber-500/90 text-white"
        }`}
      >
        {isOutroEnabled ? "Outro Active" : "+ 5s Outro"}
      </span>

      {isOutroEnabled && logoUrl ? (
        <div className="w-11 h-11 rounded-xl bg-white border border-emerald-200 p-1.5 shadow-sm mb-2 mt-3 flex items-center justify-center overflow-hidden">
          <img
            src={logoUrl}
            alt="Brand Logo"
            className="w-full h-full object-contain"
          />
        </div>
      ) : (
        <div
          className={`w-10 h-10 rounded-2xl flex items-center justify-center mb-2 mt-3 shadow-sm transition-transform duration-200 group-hover:scale-110 ${
            isOutroEnabled
              ? "bg-emerald-500 text-white"
              : "bg-gradient-to-tr from-amber-500 via-orange-500 to-rose-500 text-white"
          }`}
        >
          {isOutroEnabled ? (
            <CheckCircle2 className="w-5 h-5" />
          ) : (
            <Plus className="w-5 h-5 stroke-[2.5]" />
          )}
        </div>
      )}

      <span className="text-[11px] font-black text-slate-900 leading-tight flex items-center justify-center gap-1">
        <Sparkles className="w-3 h-3 text-amber-500 flex-shrink-0" />
        {isOutroEnabled ? "Edit Outro" : "Add Outro"}
      </span>

      <span className="text-[9px] font-medium text-slate-500 mt-1 leading-tight px-1">
        {isOutroEnabled
          ? "Tap to customize logo & handle"
          : "Add your logo & social card"}
      </span>
    </button>
  );
};
