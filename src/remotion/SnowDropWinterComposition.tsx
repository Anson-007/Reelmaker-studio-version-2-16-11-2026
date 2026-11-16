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

interface SnowDropWinterProps {
  photos: string[];
  showOutro?: boolean;
  outroData?: OutroProps & { transitionType?: OutroTransitionType };
}

// Exactly mapped from your image durations: 0.27s, 2.33s, 0.20s, 0.20s...
export const SNOW_DROP_BEAT_FRAMES: number[] = [
  0, 8, 78, 84, 90, 96, 102, 128, 140, 151, 163, 175, 188, 200, 212, 236, 250,
];

// 8.94 seconds at 30 FPS
export const BASE_DURATION = 268;
export const OUTRO_DURATION = 150; // 5.0s
const TRANSITION_FRAMES = 25;

export const getSnowDropWinterTotalFrames = (
  showOutro: boolean = false,
  transition: string = "cut",
) => {
  const overlap = showOutro && transition !== "cut" ? TRANSITION_FRAMES : 0;
  return showOutro ? BASE_DURATION + OUTRO_DURATION - overlap : BASE_DURATION;
};

export const SnowDropWinterComposition: React.FC<SnowDropWinterProps> = ({
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
    for (let i = SNOW_DROP_BEAT_FRAMES.length - 1; i >= 0; i--) {
      if (frame >= SNOW_DROP_BEAT_FRAMES[i]) {
        cutIndex = i;
        break;
      }
    }
  }

  const startFrame = SNOW_DROP_BEAT_FRAMES[cutIndex];
  const nextFrame =
    cutIndex < SNOW_DROP_BEAT_FRAMES.length - 1
      ? SNOW_DROP_BEAT_FRAMES[cutIndex + 1]
      : BASE_DURATION;
  const slotDuration = Math.max(1, nextFrame - startFrame);
  const localFrame = frame - startFrame;

  const activePhoto =
    safePhotos.length > 0 ? safePhotos[cutIndex % safePhotos.length] : null;
  const prevPhoto =
    safePhotos.length > 0
      ? safePhotos[(cutIndex - 1 + safePhotos.length) % safePhotos.length]
      : null;

  let scale = 1.0;
  let opacity = 1.0;
  let flashOpacity = 0.0;
  let showUnderlay = false;
  let underlayScale = 1.0;
  let underlayOpacity = 0.0;
  let translateY = 0;

  if (frame < BASE_DURATION) {
    if (slotDuration > 60) {
      // 2.33s Long Ambient Drift (Cut 2)
      scale = interpolate(localFrame, [0, slotDuration], [1.0, 1.15], {
        extrapolateRight: "clamp",
      });
      translateY = interpolate(localFrame, [0, slotDuration], [1.5, -1.5], {
        extrapolateRight: "clamp",
      });
    } else if (slotDuration <= 8) {
      // Ultra-fast 0.20s stutter snaps
      scale = localFrame === 0 ? 1.06 : 1.0;
      flashOpacity = localFrame === 0 ? 0.35 : 0.0;
    } else {
      // Standard ~0.40s driving rhythm beats
      const dropSpring = spring({
        frame: localFrame,
        fps,
        config: { damping: 13, stiffness: 140, mass: 0.7 },
      });
      scale = interpolate(dropSpring, [0, 1], [1.12, 1.0]);

      showUnderlay = localFrame < 5;
      if (showUnderlay) {
        underlayScale = interpolate(localFrame, [0, 5], [1.0, 1.06]);
        underlayOpacity = interpolate(localFrame, [0, 5], [0.5, 0]);
        opacity = interpolate(localFrame, [0, 4], [0.4, 1], {
          extrapolateRight: "clamp",
        });
      }

      flashOpacity = interpolate(localFrame, [0, 3], [0.3, 0], {
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
      // FIX: Corrected line break in the clipPath template literal
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
        {/* FIX: Audio volume is clamped and processed via callback */}
        <Audio
          src={staticFile("audio/ReelAudio-5.mp3")}
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

        {showUnderlay && prevPhoto && (
          <AbsoluteFill
            style={{
              transform: `scale(${underlayScale})`,
              opacity: underlayOpacity,
              filter: "blur(6px)",
            }}
          >
            <img
              src={prevPhoto}
              alt="Outgoing Slide"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                position: "absolute",
                inset: 0,
              }}
            />
          </AbsoluteFill>
        )}

        <AbsoluteFill
          style={{
            transform: `scale(${scale}) translateY(${translateY}%)`,
            opacity,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          {activePhoto ? (
            <img
              src={activePhoto}
              alt={`Winter Slide ${cutIndex + 1}`}
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
                  color: "#06b6d4",
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
              backgroundColor: "#E0F2FE", // Soft icy blue flash
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
