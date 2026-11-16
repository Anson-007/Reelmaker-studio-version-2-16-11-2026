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

interface GrandHorizonProps {
  videos: string[];
  showOutro?: boolean;
  outroData?: OutroProps & { transitionType?: OutroTransitionType };
}

export const GRAND_BEAT_FRAMES: number[] = [
  0, 80, 110, 143, 173, 202, 231, 262, 291, 323, 354, 383, 413,
];

export const BASE_DURATION = 441; // 14.7s @ 30 FPS
export const OUTRO_DURATION = 150; // 5.0s
const CROSSFADE_DURATION = 12;
const TRANSITION_FRAMES = 25;

export const getGrandHorizonTotalFrames = (
  showOutro: boolean = false,
  transition: string = "cut",
) => {
  const overlap = showOutro && transition !== "cut" ? TRANSITION_FRAMES : 0;
  return showOutro ? BASE_DURATION + OUTRO_DURATION - overlap : BASE_DURATION;
};

// FIX: Safely parse internal paths
const getSafeMediaSrc = (src: string | null | undefined): string | null => {
  if (!src || src.startsWith("#")) return null;
  if (
    src.startsWith("http") ||
    src.startsWith("data:") ||
    src.startsWith("blob:")
  ) {
    return src;
  }
  return staticFile(src.startsWith("/") ? src.substring(1) : src);
};

// FIX: Detect if the incoming file is an image to prevent WebAudio fetch crashes
const isImageFile = (url: string) => {
  if (!url) return false;
  return (
    /\.(jpeg|jpg|png|webp|gif)$/i.test(url) || url.startsWith("data:image")
  );
};

const CinematicClip: React.FC<{ src: string; isFirst: boolean }> = ({
  src,
  isFirst,
}) => {
  const frame = useCurrentFrame();
  const safeSrc = getSafeMediaSrc(src);
  const isImg = isImageFile(src);

  const scale = interpolate(frame, [0, 150], [1.0, 1.07], {
    extrapolateRight: "clamp",
  });

  const opacity = isFirst
    ? 1
    : interpolate(frame, [0, CROSSFADE_DURATION], [0, 1], {
        extrapolateRight: "clamp",
      });

  return (
    <AbsoluteFill style={{ transform: `scale(${scale})`, opacity }}>
      {safeSrc ? (
        isImg ? (
          <img
            src={safeSrc}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
            alt="Cinematic Media"
          />
        ) : (
          <Video
            src={safeSrc}
            style={{ width: "100%", height: "100%" }}
            objectFit="cover"
            muted
          />
        )
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
              fontSize: "30px",
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
          src={staticFile("audio/ReelAudio-12.mp3")}
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

        {GRAND_BEAT_FRAMES.map((startFrame, index) => {
          const nextFrame =
            index < GRAND_BEAT_FRAMES.length - 1
              ? GRAND_BEAT_FRAMES[index + 1]
              : BASE_DURATION;

          const duration =
            index < GRAND_BEAT_FRAMES.length - 1
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
