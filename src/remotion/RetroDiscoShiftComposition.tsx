import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
  Sequence,
} from "remotion";
import { Audio } from "@remotion/media";
import { OutroCard, OutroProps } from "./OutroCard";

export type OutroTransitionType = "cut" | "fade" | "slice" | "circle" | "slide";

interface RetroDiscoShiftProps {
  photos: string[];
  showOutro?: boolean;
  outroData?: OutroProps & { transitionType?: OutroTransitionType };
}

// 20 Photos converted to exact 30 FPS frames
export const RETRO_DISCO_BEAT_FRAMES: number[] = [
  0, 71, 98, 121, 133, 145, 169, 193, 215, 227, 239, 251, 263, 287, 311, 323,
  335, 359, 383, 407,
];

export const BASE_DURATION = 453; // 15.1s @ 30 FPS
export const OUTRO_DURATION = 150; // 5.0s
const TRANSITION_FRAMES = 25;

export const getRetroDiscoTotalFrames = (
  showOutro: boolean = false,
  transition: string = "cut",
) => {
  const overlap = showOutro && transition !== "cut" ? TRANSITION_FRAMES : 0;
  return showOutro ? BASE_DURATION + OUTRO_DURATION - overlap : BASE_DURATION;
};

export const RetroDiscoShiftComposition: React.FC<RetroDiscoShiftProps> = ({
  photos,
  showOutro = false,
  outroData,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const transitionType = outroData?.transitionType || "cut";
  const overlapDur =
    showOutro && transitionType !== "cut" ? TRANSITION_FRAMES : 0;
  const outroStartFrame = BASE_DURATION - overlapDur;

  const safePhotos = photos && photos.length > 0 ? photos : [];

  let cutIndex = 0;
  if (frame < BASE_DURATION) {
    for (let i = RETRO_DISCO_BEAT_FRAMES.length - 1; i >= 0; i--) {
      if (frame >= RETRO_DISCO_BEAT_FRAMES[i]) {
        cutIndex = i;
        break;
      }
    }
  }

  const startFrame = RETRO_DISCO_BEAT_FRAMES[cutIndex];
  const nextFrame =
    cutIndex < RETRO_DISCO_BEAT_FRAMES.length - 1
      ? RETRO_DISCO_BEAT_FRAMES[cutIndex + 1]
      : BASE_DURATION;
  const slotDuration = Math.max(1, nextFrame - startFrame);
  const localFrame = frame - startFrame;

  const activePhoto =
    safePhotos.length > 0 ? safePhotos[cutIndex % safePhotos.length] : null;

  // Animation dynamics
  let scale = 1.0;
  let flashOpacity = 0.0;
  let brightness = 1.0;

  if (frame < BASE_DURATION) {
    if (slotDuration > 40) {
      // Long Segments (Intro 2.38s and Outro 1.54s): Smooth cinematic drift
      scale = interpolate(localFrame, [0, slotDuration], [1.0, 1.1], {
        extrapolateRight: "clamp",
      });
    } else if (slotDuration <= 15) {
      // Fast Cuts (0.40s): Sharp, snappy hits
      scale = localFrame === 0 ? 1.06 : 1.0;
      if (cutIndex % 2 === 0) {
        flashOpacity = interpolate(localFrame, [0, 3], [0.3, 0], {
          extrapolateRight: "clamp",
        });
      }
    } else {
      // Medium Beats (0.75s, 0.80s, 0.90s): Smooth bounce
      const bounce = spring({
        frame: localFrame,
        fps,
        config: { damping: 14, stiffness: 140, mass: 0.7 },
      });
      scale = interpolate(bounce, [0, 1], [1.08, 1.0]);
      brightness = interpolate(localFrame, [0, slotDuration], [1.05, 0.95]);
    }
  }

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
        {/* FIX: Clamped callback audio volume logic */}
        <Audio
          src={staticFile("audio/ReelAudio-10.mp3")}
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

        <AbsoluteFill
          style={{
            transform: `scale(${scale})`,
            filter: `brightness(${brightness})`,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          {activePhoto ? (
            <img
              src={activePhoto}
              alt={`Slide ${cutIndex + 1}`}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                position: "absolute",
                inset: 0,
              }}
            />
          ) : (
            <AbsoluteFill
              style={{
                backgroundColor: "#1e1e1e",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <span
                style={{
                  color: "#d946ef",
                  fontSize: "40px",
                  fontWeight: "bold",
                }}
              >
                Upload Photos
              </span>
            </AbsoluteFill>
          )}
        </AbsoluteFill>

        {flashOpacity > 0 && (
          <AbsoluteFill
            style={{
              backgroundColor: "#FBCFE8", // Retro pink flash
              opacity: flashOpacity,
              mixBlendMode: "screen",
              pointerEvents: "none",
            }}
          />
        )}
      </Sequence>

      {/* Outro Sequence */}
      {showOutro && (
        <>
          {/* Transition Sound Effect */}
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
