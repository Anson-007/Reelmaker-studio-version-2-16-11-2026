"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Search,
  Flame,
  ArrowRight,
  Clock,
  TrendingUp,
} from "lucide-react";
import { TRENDING_TEMPLATES } from "../../data/templates";
import { TemplateCard } from "../../components/TemplateCard";

const CATEGORIES = ["All", "Trends", "Velocity", "Beat Sync", "Cinematic"];

export default function TrendsGalleryPage() {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredTemplates = TRENDING_TEMPLATES.filter((tpl) => {
    const matchesCategory =
      selectedCategory === "All" || tpl.category === selectedCategory;
    const matchesQuery =
      tpl.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tpl.subtitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tpl.tag.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesQuery;
  });

  return (
    <div className="relative min-h-screen bg-[#FDFDFF] text-slate-800 font-sans selection:bg-rose-500/20 selection:text-rose-950 overflow-hidden">
      <style>{`
        @keyframes float-slow { 0%, 100% { transform: translate(0, 0) scale(1); } 33% { transform: translate(30px, -50px) scale(1.05); } 66% { transform: translate(-20px, 20px) scale(0.95); } }
        .animate-float-1 { animation: float-slow 15s ease-in-out infinite; }
        .animate-float-2 { animation: float-slow 18s ease-in-out infinite; animation-delay: -5s; }
        .animate-float-3 { animation: float-slow 20s ease-in-out infinite; animation-delay: -10s; }
      `}</style>

      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-rose-200/40 rounded-full blur-[100px] animate-float-1 pointer-events-none" />
      <div className="absolute top-[20%] right-[-10%] w-[400px] h-[400px] bg-orange-200/40 rounded-full blur-[100px] animate-float-2 pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[20%] w-[600px] h-[600px] bg-amber-100/40 rounded-full blur-[120px] animate-float-3 pointer-events-none" />

      <div className="relative z-10 flex flex-col min-h-screen">
        <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-slate-200/80">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link
                href="/"
                className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer bg-white/50"
              >
                <ArrowLeft className="w-4 h-4" />
              </Link>
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-rose-500 via-orange-500 to-amber-500 flex items-center justify-center text-white shadow-md shadow-rose-500/20">
                  <TrendingUp className="w-4 h-4 text-white" />
                </div>
                <span className="text-lg sm:text-xl font-black tracking-tight text-slate-900">
                  Trending Vault
                </span>
              </div>
            </div>
            <Link
              href="/studio"
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 hover:bg-rose-600 text-white text-xs font-bold py-2.5 px-4 transition-all shadow-sm cursor-pointer"
            >
              <span className="hidden sm:inline">Open Full Studio</span>
              <span className="sm:hidden">Studio</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </header>

        <section className="pt-8 pb-6 px-4 sm:px-6 max-w-7xl mx-auto w-full">
          <div className="max-w-2xl mb-8">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold mb-3 shadow-sm">
              <Flame className="w-3.5 h-3.5 text-rose-600" />
              <span>
                Viral Audio Presets ({TRENDING_TEMPLATES.length} Available)
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-950 drop-shadow-sm">
              Trending Audio Templates
            </h1>
            <p className="mt-2 text-xs sm:text-sm text-slate-600">
              Hand-synced to viral Instagram Reels & TikTok sounds with instant
              in-browser GPU export.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-6 border-b border-slate-200/60">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 no-scrollbar [&::-webkit-scrollbar]:hidden">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap cursor-pointer shadow-sm ${
                    selectedCategory === cat
                      ? "bg-slate-900 text-white"
                      : "bg-white/80 backdrop-blur-md text-slate-600 border border-slate-200 hover:bg-white"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
            <div className="relative w-full sm:w-72">
              <input
                type="text"
                placeholder="Search trends or BPM..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white/80 backdrop-blur-md pl-9 pr-4 py-2 text-xs text-slate-800 placeholder-slate-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:bg-white transition-all"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            </div>
          </div>
        </section>

        <section className="flex-1 pb-16 px-4 sm:px-6 max-w-7xl mx-auto w-full">
          {filteredTemplates.length === 0 ? (
            <div className="text-center py-20 bg-white/60 backdrop-blur-md rounded-3xl border border-slate-200 p-8 shadow-sm">
              <Flame className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-800">
                No matching trends found
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Try a different keyword or reset filters.
              </p>
              <button
                onClick={() => {
                  setSelectedCategory("All");
                  setSearchQuery("");
                }}
                className="mt-4 px-4 py-2 rounded-xl bg-rose-50 border border-rose-100 text-rose-700 text-xs font-bold hover:bg-rose-100 transition-colors shadow-sm cursor-pointer"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-5 gap-4">
              {filteredTemplates.map((tpl) => (
                <TemplateCard key={tpl.id} tpl={tpl} variant="trending" />
              ))}

              {/* COMING SOON CARD */}
              <div className="group relative flex flex-col rounded-2xl bg-slate-50/50 backdrop-blur-sm border-2 border-dashed border-rose-200 shadow-sm overflow-hidden items-center justify-center min-h-[250px] aspect-[9/13.5] cursor-default transition-all hover:bg-rose-50/40 hover:border-rose-300">
                <div className="flex flex-col items-center gap-3 p-4 text-center opacity-70 group-hover:opacity-100 transition-opacity">
                  <div className="h-10 w-10 rounded-full bg-rose-100 flex items-center justify-center shadow-inner">
                    <Clock className="w-4 h-4 text-rose-500" />
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-slate-700 tracking-tight">
                      More Trends Coming Soon
                    </h3>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
