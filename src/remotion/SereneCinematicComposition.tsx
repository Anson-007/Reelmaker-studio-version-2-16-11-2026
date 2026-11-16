import React from "react";
import {
  AbsoluteFill,
  interpolate,
  staticFile,
  useCurrentFrame,
  Sequence,
} from "remotion";
import { Audio, Video } from "@remotion/media";
import { OutroCard, OutroProps } from "./OutroCard";

export type OutroTransitionType = "cut" | "fade" | "slice" | "circle" | "slide";

interface SereneCinematicProps {
  videos: string[];
  showOutro?: boolean;
  outroData?: OutroProps & { transitionType?: OutroTransitionType };
}

export const SERENE_BEAT_FRAMES: number[] = [
  0, 58, 95, 132, 169, 205, 242, 278,
];

export const BASE_DURATION = 312; // 10.4s @ 30 FPS
export const OUTRO_DURATION = 150; // 5.0s
const CROSSFADE_DURATION = 12; // 12 frames of smooth overlap
const TRANSITION_FRAMES = 25;

export const getSereneCinematicTotalFrames = (
  showOutro: boolean = false,
  transition: string = "cut",
) => {
  const overlap = showOutro && transition !== "cut" ? TRANSITION_FRAMES : 0;
  return showOutro ? BASE_DURATION + OUTRO_DURATION - overlap : BASE_DURATION;
};

// FIX: Helper to safely format video URLs for Remotion's internal fetcher
const getSafeVideoSrc = (src: string) => {
  if (!src) return "";
  if (
    src.startsWith("http") ||
    src.startsWith("data:") ||
    src.startsWith("blob:")
  ) {
    return src;
  }
  // If it's a local public path (like "/v1.mp4"), wrap it in staticFile
  return staticFile(src.startsWith("/") ? src.substring(1) : src);
};

const CinematicClip: React.FC<{ src: string; isFirst: boolean }> = ({
  src,
  isFirst,
}) => {
  const frame = useCurrentFrame();
  const safeSrc = getSafeVideoSrc(src);

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

  return (
    <AbsoluteFill style={{ transform: `scale(${scale})`, opacity }}>
      {safeSrc ? (
        <Video
          src={safeSrc}
          style={{ width: "100%", height: "100%" }}
          objectFit="cover" // FIX: Moved objectFit from style to native prop
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
              color: "#38bdf8",
              fontSize: "30px",
              fontWeight: "bold",
              letterSpacing: "1px",
            }}
          >
            AWAITING VIDEO
          </span>
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};

export const SereneCinematicComposition: React.FC<SereneCinematicProps> = ({
  videos,
  showOutro = false,
  outroData,
}) => {
  const frame = useCurrentFrame();
  const safeVideos = videos && videos.length > 0 ? videos : [];

  const transitionType = outroData?.transitionType || "cut";
  const overlapDur =
    showOutro && transitionType !== "cut" ? TRANSITION_FRAMES : 0;
  const outroStartFrame = BASE_DURATION - overlapDur;

  const outroLocalFrame = frame - outroStartFrame;
  let outroTransitionStyle: React.CSSProperties = {
    width: "100%",
    height: "100%",
    position: "absolute",
  };

  if (showOutro && outroLocalFrame >= 0 && outroLocalFrame <= overlapDur) {
    if (transitionType === "fade") {
      outroTransitionStyle.opacity = interpolate(
        outroLocalFrame,
        [0, overlapDur],
        [0, 1],
        { extrapolateRight: "clamp" },
      );
    } else if (transitionType === "slice") {
      const progress = interpolate(outroLocalFrame, [0, overlapDur], [0, 150], {
        extrapolateRight: "clamp",
      });
      outroTransitionStyle.clipPath = `polygon(0 0, ${progress}% 0, ${progress - 50}% 100%, 0 100%)`;
    } else if (transitionType === "circle") {
      const radius = interpolate(outroLocalFrame, [0, overlapDur], [0, 150], {
        extrapolateRight: "clamp",
      });
      outroTransitionStyle.clipPath = `circle(${radius}% at 50% 50%)`;
    } else if (transitionType === "slide") {
      const y = interpolate(outroLocalFrame, [0, overlapDur], [100, 0], {
        extrapolateRight: "clamp",
      });
      outroTransitionStyle.transform = `translateY(${y}%)`;
    }
  }

  return (
    <AbsoluteFill style={{ backgroundColor: "#000", overflow: "hidden" }}>
      <Sequence from={0} durationInFrames={BASE_DURATION}>
        <Audio
          src={staticFile("audio/ReelAudio-11.mp3")}
          volume={(f) =>
            showOutro
              ? interpolate(
                  f,
                  [outroStartFrame, outroStartFrame + TRANSITION_FRAMES],
                  [1, 0],
                  {
                    extrapolateLeft: "clamp",
                    extrapolateRight: "clamp",
                  },
                )
              : 1
          }
        />

        {SERENE_BEAT_FRAMES.map((startFrame, index) => {
          const nextFrame =
            index < SERENE_BEAT_FRAMES.length - 1
              ? SERENE_BEAT_FRAMES[index + 1]
              : BASE_DURATION;

          const duration =
            index < SERENE_BEAT_FRAMES.length - 1
              ? nextFrame - startFrame + CROSSFADE_DURATION
              : nextFrame - startFrame;

          const activeVideo =
            safeVideos.length > 0 ? safeVideos[index % safeVideos.length] : "";

          return (
            <Sequence key={index} from={startFrame} durationInFrames={duration}>
              <CinematicClip src={activeVideo} isFirst={index === 0} />
            </Sequence>
          );
        })}
      </Sequence>

      {/* Outro Sequence */}
      {showOutro && (
        <>
          <Sequence from={outroStartFrame} durationInFrames={OUTRO_DURATION}>
            <Audio
              src={staticFile("audio/whoosh-transition.mp3")}
              volume={0.8}
            />
          </Sequence>

          <Sequence from={outroStartFrame} durationInFrames={OUTRO_DURATION}>
            <div style={outroTransitionStyle}>
              <OutroCard
                {...(outroData || {
                  logoUrl: null,
                  bgUrl: null,
                  contactText: "",
                  socialHandle: "",
                })}
              />
            </div>
          </Sequence>
        </>
      )}
    </AbsoluteFill>
  );
};
