import React from "react";
import {
  AbsoluteFill,
  interpolate,
  staticFile,
  useCurrentFrame,
  Sequence,
} from "remotion";
import { Audio, Video } from "@remotion/media";

interface GrandHorizonProps {
  videos: string[];
}

// 13 Video Clips converted to exact 30 FPS frames based on the tutorial math
// Timings: 2.65s, 0.99s, 1.09s, 0.99s, 0.96s, 0.97s, 1.02s, 0.96s, 1.07s, 1.02s, 0.97s, 0.99s, 0.93s
export const GRAND_BEAT_FRAMES: number[] = [
  0, 80, 110, 143, 173, 202, 231, 262, 291, 323, 354, 383, 413,
];

export const TOTAL_FRAMES = 441; // 14.7s @ 30 FPS
const CROSSFADE_DURATION = 12; // 12 frames of smooth overlap to eliminate black screens

const CinematicClip: React.FC<{ src: string; isFirst: boolean }> = ({
  src,
  isFirst,
}) => {
  const frame = useCurrentFrame();

  // Majestic, slow cinematic zoom in to match the "grand" vibe
  const scale = interpolate(frame, [0, 150], [1.0, 1.07], {
    extrapolateRight: "clamp",
  });

  // Fades in over the previous clip seamlessly
  const opacity = isFirst
    ? 1
    : interpolate(frame, [0, CROSSFADE_DURATION], [0, 1], {
        extrapolateRight: "clamp",
      });

  const isPlaceholder = src.startsWith("#") || src === "";

  return (
    // Transparent background to allow proper crossfading
    <AbsoluteFill style={{ transform: `scale(${scale})`, opacity }}>
      {!isPlaceholder ? (
        <Video
          src={src}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
          muted
        />
      ) : (
        <AbsoluteFill
          style={{
            backgroundColor: "#2d1b11",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <span
            style={{
              color: "#fcd34d",
              fontSize: "14px",
              fontWeight: "bold",
              letterSpacing: "1px",
            }}
          >
            AWAITING MEDIA
          </span>
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};

export const GrandHorizonFlowComposition: React.FC<GrandHorizonProps> = ({
  videos,
}) => {
  const safeVideos = videos && videos.length > 0 ? videos : ["#placeholder"];

  return (
    <AbsoluteFill style={{ backgroundColor: "#000", overflow: "hidden" }}>
      <Audio src={staticFile("audio/ReelAudio-12.mp3")} />

      {GRAND_BEAT_FRAMES.map((startFrame, index) => {
        const nextFrame =
          index < GRAND_BEAT_FRAMES.length - 1
            ? GRAND_BEAT_FRAMES[index + 1]
            : TOTAL_FRAMES;

        const duration =
          index < GRAND_BEAT_FRAMES.length - 1
            ? nextFrame - startFrame + CROSSFADE_DURATION
            : nextFrame - startFrame;

        const activeVideo = safeVideos[index % safeVideos.length];

        return (
          <Sequence key={index} from={startFrame} durationInFrames={duration}>
            <CinematicClip src={activeVideo} isFirst={index === 0} />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
