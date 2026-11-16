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
import { OutroCard, OutroProps } from "./OutroCard";

export interface ParallelParallaxProps {
  assets: { originalUrl: string; cutoutUrl: string | null }[];
  showOutro?: boolean;
  outroData?: OutroProps & { transitionType?: string };
}

// Exactly mapped to your provided timestamps (converted to 30fps frames)
export const TIMINGS = [
  { start: 0, popStart: 11, popEnd: 20, end: 32 }, // Image 1
  { start: 32, popStart: 32, popEnd: 44, end: 47 }, // Image 2
  { start: 47, popStart: 47, popEnd: 64, end: 67 }, // Image 3
  { start: 67, popStart: 67, popEnd: 79, end: 123 }, // Image 4
  { start: 123, popStart: 123, popEnd: 159, end: 211 }, // Image 5
  { start: 211, popStart: 211, popEnd: 228, end: 290 }, // Image 6
  { start: 290, isFinal: true, bwEnd: 303, end: 395 }, // Image 7 (Final)
];

export const BASE_DURATION = 395; // ~13.16 seconds to cover the 13:05 audio fully

const Clip: React.FC<{
  originalUrl: string;
  cutoutUrl: string | null;
  timing: (typeof TIMINGS)[0];
  index: number;
}> = ({ originalUrl, cutoutUrl, timing, index }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const localFrame = frame - timing.start;
  const popStartLocal = timing.popStart ? timing.popStart - timing.start : 0;
  const popEndLocal = timing.popEnd ? timing.popEnd - timing.start : 0;

  // --- FINAL IMAGE LOGIC ---
  if (timing.isFinal) {
    const bwEndLocal = timing.bwEnd! - timing.start;

    // Heavy drop-in animation
    const dropSpring = spring({
      frame: localFrame,
      fps,
      config: { damping: 14, stiffness: 120, mass: 1 },
    });
    const scale = interpolate(dropSpring, [0, 1], [1.3, 1.0]);

    // 00:00:10:03 - Converts into full color exactly at frame 303
    const grayscale = interpolate(
      localFrame,
      [bwEndLocal - 2, bwEndLocal],
      [100, 0],
      {
        extrapolateRight: "clamp",
        extrapolateLeft: "clamp",
      },
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

  // --- STANDARD CLIPS LOGIC (Images 1 to 6) ---

  // 1st image comes from out of blur (0 to 3 frames)
  let initialBlur = 0;
  if (index === 0) {
    initialBlur = interpolate(localFrame, [0, 3], [20, 0], {
      extrapolateRight: "clamp",
    });
  }

  // Pop Up Cutout Animation
  const popSpring = spring({
    frame: localFrame - popStartLocal,
    fps,
    config: { damping: 12, stiffness: 150, mass: 0.8 },
  });

  // Slide up and snap into place
  const fgTranslateY = interpolate(popSpring, [0, 1], [300, 0]);
  const fgScale = interpolate(popSpring, [0, 1], [1.15, 1.0]);

  // Background Blur: heavily blurred before landing, perfectly clear when it lands
  const bgBlur =
    index === 0 && localFrame <= 3
      ? initialBlur
      : interpolate(localFrame, [popStartLocal, popEndLocal], [10, 0], {
          extrapolateRight: "clamp",
          extrapolateLeft: "clamp",
        });

  const isPopping = localFrame >= popStartLocal;

  return (
    <AbsoluteFill>
      {/* Background Layer */}
      <AbsoluteFill style={{ filter: `blur(${bgBlur}px)` }}>
        <Img
          src={originalUrl}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </AbsoluteFill>

      {/* Foreground Cutout Layer */}
      {cutoutUrl && isPopping && (
        <AbsoluteFill
          style={{
            transform: `translateY(${fgTranslateY}px) scale(${fgScale})`,
            // When it lands, the drop shadow disappears so it merges cleanly with the background photo
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
          // Fallback to local default assets if user hasn't uploaded enough
          const asset = assets[idx] || {
            originalUrl: `/w${idx + 1}.jpg`,
            cutoutUrl: null,
          };
          const duration = timing.end - timing.start;

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
