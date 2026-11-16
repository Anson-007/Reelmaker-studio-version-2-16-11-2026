"use client";

import {
  AddOutroGridCard,
  SlotCounterPill,
} from "../../../components/EditorMediaAddons";
import { getTemplateConfig } from "../../../data/templates";

import dynamic from "next/dynamic";
import React from "react";
import { Loader2 } from "lucide-react";

const ParallaxClient = dynamic(() => import("./ClientPage"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[100dvh] w-full items-center justify-center bg-slate-900">
      <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
    </div>
  ),
});

export default function ParallelParallaxPage() {
  return <ParallaxClient />;
}
