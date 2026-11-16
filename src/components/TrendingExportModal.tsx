"use client";

import React from "react";
import {
  X,
  VolumeX,
  Volume2,
  Sparkles,
  ShieldAlert,
  CheckCircle2,
  Download,
} from "lucide-react";

interface TrendingExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectExport: (muteAudio: boolean) => void;
  audioName?: string;
}

export const TrendingExportModal: React.FC<TrendingExportModalProps> = ({
  isOpen,
  onClose,
  onSelectExport,
  audioName = "Trending Audio",
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="mb-5 pr-6">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-600 text-[10px] font-bold uppercase tracking-wider mb-2">
            <Sparkles className="w-3 h-3" /> Beat-Synced Export
          </div>
          <h3 className="text-xl font-black text-slate-900 tracking-tight">
            Choose Your Export Mode
          </h3>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            Your photo cuts and transitions are locked to{" "}
            <span className="font-semibold text-slate-700">{audioName}</span>.
            Select how you want to handle the audio track:
          </p>
        </div>

        <div className="space-y-3.5">
          {/* OPTION 1: EXPORT WITHOUT AUDIO (RECOMMENDED) */}
          <div className="rounded-2xl border-2 border-emerald-500/80 bg-emerald-50/40 p-4 transition-all hover:bg-emerald-50/70">
            <div className="flex items-start justify-between gap-2 mb-1.5">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-sm flex-shrink-0">
                  <VolumeX className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-900 flex items-center gap-1.5 flex-wrap">
                    Export Without Audio
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[9px] font-extrabold uppercase tracking-wide">
                      <CheckCircle2 className="w-2.5 h-2.5" /> Recommended
                    </span>
                  </h4>
                  <p className="text-[10px] font-semibold text-emerald-700">
                    Best for Instagram Reels, TikTok & YouTube Shorts
                  </p>
                </div>
              </div>
            </div>

            <p className="text-[11px] text-slate-600 leading-relaxed mt-2 mb-3">
              Downloads a clean, silent beat-synced MP4. When uploading to
              Instagram or YouTube, select the official trending audio natively
              inside the app—this prevents copyright strikes and boosts
              algorithm reach.
            </p>

            <button
              onClick={() => onSelectExport(true)}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-md shadow-emerald-600/20 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              Export Silent Video (Recommended)
            </button>
          </div>

          {/* OPTION 2: EXPORT WITH AUDIO + DISCLAIMER */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 transition-all hover:border-slate-300">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-8 w-8 rounded-xl bg-slate-800 text-white flex items-center justify-center flex-shrink-0">
                <Volume2 className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">
                  Export With Audio
                </h4>
                <p className="text-[10px] text-slate-500">
                  For WhatsApp Status, personal sharing, or offline preview
                </p>
              </div>
            </div>

            {/* Copyright Disclaimer Box */}
            <div className="rounded-xl bg-amber-50/90 border border-amber-200/80 p-2.5 mb-3 flex items-start gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-[10px] text-amber-900 leading-relaxed">
                <span className="font-bold">Audio Rights Notice:</span> Trending
                music tracks belong to their respective copyright owners and are
                provided strictly for beat-sync reference. ReelStudio is not
                responsible for copyright claims, muted audio, or platform
                strikes.
              </p>
            </div>

            <button
              onClick={() => onSelectExport(false)}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              Export With Audio Anyway
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
