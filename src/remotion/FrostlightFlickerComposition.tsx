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

interface FrostlightFlickerProps {
  photos: string[];
  showOutro?: boolean;
  outroData?: OutroProps & { transitionType?: OutroTransitionType };
}

// 20 Photos converted to exact 30 FPS frames based on the tutorial math
// Timings: 0.14s, 0.30s, 0.27s, 0.27s, then sixteen ~0.57s clips
export const FROSTLIGHT_BEAT_FRAMES: number[] = [
  0, 4, 13, 21, 29, 46, 64, 80, 97, 115, 132, 149, 166, 183, 201, 218, 234, 252,
  269, 286,
];

export const BASE_DURATION = 303; // ~10.1s @ 30 FPS
export const OUTRO_DURATION = 150; // 5.0s
const TRANSITION_FRAMES = 25;

export const getFrostlightFlickerTotalFrames = (
  showOutro: boolean = false,
  transition: string = "cut",
) => {
  const overlap = showOutro && transition !== "cut" ? TRANSITION_FRAMES : 0;
  return showOutro ? BASE_DURATION + OUTRO_DURATION - overlap : BASE_DURATION;
};

export const FrostlightFlickerComposition: React.FC<FrostlightFlickerProps> = ({
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
    for (let i = FROSTLIGHT_BEAT_FRAMES.length - 1; i >= 0; i--) {
      if (frame >= FROSTLIGHT_BEAT_FRAMES[i]) {
        cutIndex = i;
        break;
      }
    }
  }

  const startFrame = FROSTLIGHT_BEAT_FRAMES[cutIndex];
  const nextFrame =
    cutIndex < FROSTLIGHT_BEAT_FRAMES.length - 1
      ? FROSTLIGHT_BEAT_FRAMES[cutIndex + 1]
      : BASE_DURATION;
  const slotDuration = Math.max(1, nextFrame - startFrame);
  const localFrame = frame - startFrame;
  const activePhoto =
    safePhotos.length > 0 ? safePhotos[cutIndex % safePhotos.length] : null;

  let scale = 1.0;
  let flashOpacity = 0.0;

  if (frame < BASE_DURATION) {
    if (slotDuration < 10) {
      // Ultra-fast intro flickers (0.14s, 0.27s)
      scale = localFrame === 0 ? 1.05 : 1.0;
      flashOpacity = localFrame === 0 ? 0.4 : 0.0;
    } else {
      // Main rhythmic holds (~0.57s)
      const bounce = spring({
        frame: localFrame,
        fps,
        config: { damping: 14, stiffness: 130, mass: 0.8 },
      });
      scale = interpolate(bounce, [0, 1], [1.08, 1.0]);

      // Warm golden/amber flash to emulate holiday lights
      flashOpacity = interpolate(localFrame, [0, 6], [0.25, 0], {
        extrapolateRight: "clamp",
      });
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
      // FIX: Corrected line break in the template literal string
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
        {/* FIX: Audio volume is clamped and executed via callback */}
        <Audio
          src={staticFile("audio/ReelAudio-14.mp3")}
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
                  color: "#fbbf24",
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
              backgroundColor: "#fef08a", // Warm amber/golden glow
              opacity: flashOpacity,
              mixBlendMode: "overlay",
              pointerEvents: "none",
            }}
          />
        )}
      </Sequence>

      {/* Outro Sequence */}
      {showOutro && (
        <>
          {/* FIX: Transition Sound Effect */}
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
