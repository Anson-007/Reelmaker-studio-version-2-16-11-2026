import React from "react";
import {
  AbsoluteFill,
  interpolate,
  staticFile,
  useCurrentFrame,
  Sequence,
} from "remotion";
import { Audio, Video } from "@remotion/media";

interface SereneCinematicProps {
  videos: string[];
}

export const SERENE_BEAT_FRAMES: number[] = [
  0, 58, 95, 132, 169, 205, 242, 278,
];

export const TOTAL_FRAMES = 312; // 10.4s @ 30 FPS
const CROSSFADE_DURATION = 12; // 12 frames of smooth overlap

const CinematicClip: React.FC<{ src: string; isFirst: boolean }> = ({
  src,
  isFirst,
}) => {
  const frame = useCurrentFrame();

  // Slow cinematic zoom in
  const scale = interpolate(frame, [0, 150], [1.0, 1.06], {
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
            backgroundColor: "#1e293b",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <span
            style={{
              color: "#94a3b8",
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

export const SereneCinematicComposition: React.FC<SereneCinematicProps> = ({
  videos,
}) => {
  const safeVideos = videos && videos.length > 0 ? videos : ["#placeholder"];

  return (
    <AbsoluteFill style={{ backgroundColor: "#000", overflow: "hidden" }}>
      <Audio src={staticFile("audio/ReelAudio-11.mp3")} />

      {SERENE_BEAT_FRAMES.map((startFrame, index) => {
        const nextFrame =
          index < SERENE_BEAT_FRAMES.length - 1
            ? SERENE_BEAT_FRAMES[index + 1]
            : TOTAL_FRAMES;

        const duration =
          index < SERENE_BEAT_FRAMES.length - 1
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
