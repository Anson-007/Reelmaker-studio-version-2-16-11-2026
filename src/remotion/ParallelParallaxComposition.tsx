"use client";

import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
  Sequence,
  Img,
} from "remotion";
import { Audio } from "@remotion/media";

export interface ParallelParallaxProps {
  assets: { originalUrl: string; cutoutUrl: string | null }[];
}

export const TIMINGS = [
  { start: 0, popStart: 11, popEnd: 20, end: 32 },
  { start: 32, popStart: 43, popEnd: 52, end: 67 },
  { start: 67, popStart: 78, popEnd: 87, end: 123 },
  { start: 123, popStart: 134, popEnd: 143, end: 211 },
  { start: 211, popStart: 222, popEnd: 231, end: 290 },
  { start: 290, popStart: 301, popEnd: 310, end: 395 },
  { start: 395, isFinal: true, bwEnd: 408, end: 500 },
];

export const BASE_DURATION = 500;

const Clip: React.FC<{
  originalUrl: string;
  cutoutUrl: string | null;
  timing: (typeof TIMINGS)[0];
  index: number;
}> = ({ originalUrl, cutoutUrl, timing, index }) => {
  // CRITICAL FIX: inside a <Sequence>, useCurrentFrame() already starts at 0.
  // We do NOT subtract timing.start here.
  const localFrame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const popStartLocal = timing.popStart ? timing.popStart - timing.start : 0;
  const popEndLocal = timing.popEnd ? timing.popEnd - timing.start : 0;

  if (timing.isFinal) {
    const bwEndLocal = timing.bwEnd! - timing.start;

    const dropSpring = spring({
      frame: localFrame,
      fps,
      config: { damping: 14, stiffness: 120, mass: 1 },
    });
    const scale = interpolate(dropSpring, [0, 1], [1.3, 1.0]);

    const grayscale = interpolate(
      localFrame,
      [bwEndLocal - 2, bwEndLocal],
      [100, 0],
      { extrapolateRight: "clamp", extrapolateLeft: "clamp" },
    );

    return (
      <AbsoluteFill
        style={{
          transform: `scale(${scale})`,
          filter: `grayscale(${grayscale}%)`,
        }}
      >
        <Img
          src={originalUrl}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </AbsoluteFill>
    );
  }

  const popSpring = spring({
    frame: localFrame - popStartLocal,
    fps,
    config: { damping: 12, stiffness: 150, mass: 0.8 },
  });

  const fgTranslateY = interpolate(popSpring, [0, 1], [300, 0]);
  const fgScale = interpolate(popSpring, [0, 1], [1.15, 1.0]);

  const bgBlur = interpolate(localFrame, [0, popEndLocal], [20, 0], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
  });

  const isPopping = localFrame >= popStartLocal;

  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ filter: `blur(${bgBlur}px)` }}>
        <Img
          src={originalUrl}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </AbsoluteFill>

      {cutoutUrl && isPopping && (
        <AbsoluteFill
          style={{
            transform: `translateY(${fgTranslateY}px) scale(${fgScale})`,
            filter:
              localFrame < popEndLocal
                ? "drop-shadow(0px 20px 30px rgba(0,0,0,0.6))"
                : "none",
          }}
        >
          <Img
            src={cutoutUrl}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};

export const ParallelParallaxComposition: React.FC<ParallelParallaxProps> = ({
  assets,
}) => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#000", overflow: "hidden" }}>
      <Sequence from={0} durationInFrames={BASE_DURATION}>
        <Audio src={staticFile("audio/ReelAudio-parallel.mp3")} />

        {TIMINGS.map((timing, idx) => {
          const asset = assets[idx] || {
            originalUrl: `/w${idx + 1}.jpg`,
            cutoutUrl: null,
          };

          // CRITICAL FIX: The sequence must stay alive for the rest of the video
          const duration = BASE_DURATION - timing.start;

          return (
            <Sequence key={idx} from={timing.start} durationInFrames={duration}>
              <Clip
                originalUrl={asset.originalUrl}
                cutoutUrl={asset.cutoutUrl}
                timing={timing}
                index={idx}
              />
            </Sequence>
          );
        })}
      </Sequence>
    </AbsoluteFill>
  );
};
