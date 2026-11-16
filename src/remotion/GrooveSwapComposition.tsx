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

interface GrooveSwapProps {
  photos: string[];
  showOutro?: boolean;
  outroData?: OutroProps & { transitionType?: OutroTransitionType };
}

// 9 exact beat frames converted from HH:MM:SS:FF at 30fps
export const GROOVE_SWAP_BEAT_FRAMES: number[] = [
  0, 24, 51, 84, 95, 106, 151, 193, 217,
];

export const BASE_DURATION = 241; // Ends 24 frames after the final cut (~8.03s total)
export const OUTRO_DURATION = 150; // 5.0s
const TRANSITION_FRAMES = 25;

export const getGrooveSwapTotalFrames = (
  showOutro: boolean = false,
  transition: string = "cut",
) => {
  const overlap = showOutro && transition !== "cut" ? TRANSITION_FRAMES : 0;
  return showOutro ? BASE_DURATION + OUTRO_DURATION - overlap : BASE_DURATION;
};

export const GrooveSwapComposition: React.FC<GrooveSwapProps> = ({
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
    for (let i = GROOVE_SWAP_BEAT_FRAMES.length - 1; i >= 0; i--) {
      if (frame >= GROOVE_SWAP_BEAT_FRAMES[i]) {
        cutIndex = i;
        break;
      }
    }
  }

  const startFrame = GROOVE_SWAP_BEAT_FRAMES[cutIndex];
  const nextFrame =
    cutIndex < GROOVE_SWAP_BEAT_FRAMES.length - 1
      ? GROOVE_SWAP_BEAT_FRAMES[cutIndex + 1]
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
  let flashOpacity = 0.0;
  let showUnderlay = false;
  let underlayScale = 1.0;
  let underlayOpacity = 0.0;
  let opacity = 1.0;

  if (frame < BASE_DURATION) {
    const spr = spring({
      frame: localFrame,
      fps,
      config: { damping: 14, stiffness: 140, mass: 0.8 },
    });

    const punch = interpolate(spr, [0, 1], [1.1, 1.0]);
    // Changed drift to dynamically use slotDuration so shorter cuts don't break
    const drift = interpolate(localFrame, [0, slotDuration], [1.0, 1.02], {
      extrapolateRight: "clamp",
    });
    scale = punch * drift;

    flashOpacity = interpolate(localFrame, [0, 4], [0.3, 0], {
      extrapolateRight: "clamp",
    });

    showUnderlay = localFrame < 6;
    if (showUnderlay) {
      underlayScale = interpolate(localFrame, [0, 6], [1.0, 1.05]);
      underlayOpacity = interpolate(localFrame, [0, 6], [0.5, 0]);
      opacity = interpolate(localFrame, [0, 4], [0.3, 1], {
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
          src={staticFile("audio/ReelAudio-2.mp3")}
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
            transform: `scale(${scale})`,
            opacity,
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
                  color: "#8b5cf6",
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
              backgroundColor: "#FFFFFF",
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
